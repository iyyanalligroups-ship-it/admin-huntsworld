// ForgotPasswordPage.tsx
import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import axios from "axios";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";
const ForgotPasswordPage = () => {
  const [step, setStep] = useState("email");
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  const [rules, setRules] = useState({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
  });
  const validatePasswordRules = (password) => {
    return {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[@$!%*?&]/.test(password),
    };
  };

  // Start 60s cooldown
  const startCooldown = () => {
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!email.includes("@")) return showToast("Enter valid email", "error");

    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/forgot-password`,
        { email }
      );
      showToast(res.data.message, "success");
      setStep("otp");
      startCooldown();
    } catch (err) {
      showToast(err.response?.data?.message || "Error sending OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) return showToast("Enter 4-digit OTP", "error");

    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/verify-reset-otp`,
        { email, otp }
      );
      showToast(res.data.message, "success");
      setStep("reset");
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword)
      return showToast("Passwords don't match", "error");

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return showToast(
        "Password must be 6+ chars with 1 uppercase, 1 number, 1 symbol",
        "error"
      );
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/reset-password`,
        { email, newPassword }
      );
      showToast(res.data.message, "success");
      setTimeout(() => (window.location.href = "/login"), 2000);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Error resetting password",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };
  const validatePassword = (password, confirmPassword) => {
    let errorObj = { password: "", confirmPassword: "" };

    // Password errors
    const rules = validatePasswordRules(password);

    if (!password) {
      errorObj.password = "Password is required";
    } else if (!rules.length) {
      errorObj.password = "Password must be at least 6 characters";
    } else if (!rules.uppercase) {
      errorObj.password = "Password must contain at least 1 uppercase letter";
    } else if (!rules.number) {
      errorObj.password = "Password must contain at least 1 number";
    } else if (!rules.symbol) {
      errorObj.password =
        "Password must contain at least 1 special character (@$!%*?&)";
    }

    // Confirm Password errors
    if (!confirmPassword) {
      errorObj.confirmPassword = "Confirm Password is required";
    } else if (password !== confirmPassword) {
      errorObj.confirmPassword = "Passwords do not match";
    }

    return errorObj;
  };

  return (
   <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-6">

  {/* EMAIL STEP */}
  {step === "email" && (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl text-[#1a2f6b] font-bold text-center mb-2">
        Forgot Password
      </h2>

      <p className="text-center text-sm text-gray-600 mb-6">
        Please enter your registered email address. A 4-digit OTP will be sent.
      </p>

      <div className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-2 h-5 w-5 text-gray-400" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full bg-[#0c1f4d] hover:bg-[#0c204dec]"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
        </Button>
      </div>
    </div>
  )}

  {/* OTP STEP */}
  {step === "otp" && (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
      <Button variant="ghost" onClick={() => setStep("email")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h2 className="text-2xl font-bold text-center mb-2">Enter OTP</h2>
      <p className="text-sm text-gray-600 text-center mb-6">
        We sent a 4-digit code to {email}
      </p>

      <Input
        type="text"
        maxLength={4}
        placeholder="0000"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        className="text-center text-2xl tracking-widest"
      />

      <Button
        onClick={handleVerifyOtp}
        disabled={loading || otp.length !== 4}
        className="w-full mt-4 bg-[#0c1f4d] hover:bg-[#0c204dec]"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify OTP"}
      </Button>

      <div className="text-center mt-4">
        <Button
          variant="link"
          disabled={cooldown > 0}
          onClick={handleSendOtp}
          className="w-full bg-[#0c1f4d] text-white hover:bg-[#0c204dec]"
        >
          Resend OTP {cooldown > 0 && `(${cooldown}s)`}
        </Button>
      </div>
    </div>
  )}

  {/* RESET STEP */}
  {step === "reset" && (
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow">
      <div className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

        {/* LEFT SIDE */}
        <div className="flex flex-col p-6 sm:p-8">
          <h2 className="text-xl text-[#0c1f4d] font-bold text-center mb-6">
            Set New Password
          </h2>

          <div className="space-y-4">
            <Input value={email} disabled className="bg-gray-100" />

            {/* New Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-2 h-5 w-5 text-gray-400" />
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewPassword(val);
                  setErrors(validatePassword(val, confirmPassword));
                  setRules(validatePasswordRules(val));
                }}
                className="pl-10"
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-2 h-5 w-5 text-gray-400" />
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  const val = e.target.value;
                  setConfirmPassword(val);
                  setErrors(validatePassword(newPassword, val));
                }}
                className="pl-10"
              />
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-[#0c1f4d] hover:bg-[#0c204dec]"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
            </Button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-col justify-center items-center bg-[#0c1f4d] text-white p-6 sm:p-8">
          <h3 className="font-semibold mb-3">Password Requirements</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              {rules.length ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}
              Minimum 6 characters
            </li>

            <li className="flex items-center gap-2">
              {rules.uppercase ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}
              At least 1 uppercase letter
            </li>

            <li className="flex items-center gap-2">
              {rules.number ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}
              At least 1 number
            </li>

            <li className="flex items-center gap-2">
              {rules.symbol ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}
              At least 1 special symbol (@$!%*?&)
            </li>
          </ul>
        </div>

      </div>
    </div>
  )}

</div>

  );
};
export default ForgotPasswordPage;
