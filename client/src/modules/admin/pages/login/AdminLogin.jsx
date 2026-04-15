import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useState, useContext, useRef, useEffect, forwardRef } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useLoginWithEmailMutation, useLazyGetUserByIdQuery } from "@/redux/api/Authapi";
import showToast from "@/toast/showToast";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from 'lucide-react'

// Shadcn OTP Pattern Component
const InputOTPPattern = forwardRef(({ value, onChange }, ref) => {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      ref={ref}
      className="flex justify-center"
    >
      <InputOTPGroup className="flex gap-1 sm:gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot
            key={i}
            index={i}
            className="
              w-10 h-10 sm:w-12 sm:h-12
              text-center text-sm sm:text-base
              border-2 border-gray-400
              rounded-md
              focus:border-[#ea1a24]
              focus:ring-2 focus:ring-[#ea1a24]/30
              data-[active=true]:border-[#ea1a24]
              data-[active=true]:ring-2 data-[active=true]:ring-[#ea1a24]/30
            "
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
});


const AdminLogin = () => {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState("email");
  const [form, setForm] = useState({
    email: "",
    password: "",
    mobile: "",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [isOtpShow, setIsOtpShow] = useState(false);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const otpRef = useRef(null);
  const [loginWithEmail, { isLoading, error }] = useLoginWithEmailMutation();
  const [fetchUserById] = useLazyGetUserByIdQuery();
  const [showPassword, setShowPassword] = useState(false);
  // ────── OTP RESEND TIMER (60 seconds) ──────
  const [timer, setTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const intervalRef = useRef(null);
  const OTP_COOLDOWN_KEY = "adminOtpCooldown";
  const passwordValueRef = useRef("");
  const startCooldown = () => {
    const now = Date.now();
    localStorage.setItem(OTP_COOLDOWN_KEY, now.toString());

    setTimer(60);
    setIsResendDisabled(true);

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsResendDisabled(false);
          localStorage.removeItem(OTP_COOLDOWN_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Restore timer on page refresh
  useEffect(() => {
    if (!isOtpShow) return;

    const saved = localStorage.getItem(OTP_COOLDOWN_KEY);
    if (saved) {
      const elapsed = Math.floor((Date.now() - Number(saved)) / 1000);
      const left = 60 - elapsed;
      if (left > 0) {
        setTimer(left);
        setIsResendDisabled(true);

        intervalRef.current = setInterval(() => {
          setTimer((t) => {
            if (t <= 1) {
              clearInterval(intervalRef.current);
              setIsResendDisabled(false);
              localStorage.removeItem(OTP_COOLDOWN_KEY);
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOtpShow]);

  // Navigation based on role
  useEffect(() => {
    if (user) {
      const role = user?.role?.role || user?.role || user?.user?.role?.role || "UNKNOWN";
      if (role === "ADMIN") {
        navigate("/admin-dashboard", { replace: true });
      } else if (role === "SUB_ADMIN") {
        navigate("/sub-admin-dashboard", { replace: true });
      } else {
        navigate("/unauthorized", { replace: true });
      }
    }
  }, [user, navigate]);

  // Auto-focus OTP
  useEffect(() => {
    if (isOtpShow && otpRef.current) {
      otpRef.current.focus();
    }
  }, [isOtpShow]);

  // Validate Mobile
  const isValidMobile = (number) => /^[6-9]\d{9}$/.test(number);

  // Handle Submit - NOW SUPPORTS EMAIL OR PHONE + PASSWORD
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loginType === "email") {
      const identifier = form.email.trim();

      if (!identifier) {
        setErrors({ email: "Email or phone number is required" });
        return;
      }
      const password = passwordValueRef.current;
      if (!password) {
        setErrors({ password: "Password is required" });
        return;
      }

      const isPhoneNumber = isValidMobile(identifier);

      if (!isPhoneNumber && !identifier.includes("@")) {
        setErrors({ email: "Please enter a valid email or phone number" });
        return;
      }

      try {
        const payload = {
          password: password,
          isAdminLogin: true,
        };

        if (isPhoneNumber) {

          payload.email = identifier;   // Login with Phone + Password
        } else {
          payload.email = identifier;   // Login with Email + Password
        }

        const response = await loginWithEmail(payload).unwrap();

        if (!response.success) throw new Error(response.message || "Login Failed");
        passwordValueRef.current = "";
        const token = response.token;
        sessionStorage.setItem("token", token);

        const decodedToken = jwtDecode(token);
        const userId = decodedToken?.userId;

        if (userId) {
          const { data: userResponse } = await fetchUserById(userId);
          login(userResponse, token);
          showToast(response.message || "Login Successful", "success");
        } else {
          login(null, token);
          showToast("Invalid user ID", "error");
        }
      } catch (err) {
        showToast(err?.data?.message || "Invalid credentials", "error");
      }
    }
    // OTP Login - unchanged
    else if (loginType === "otp") {
      if (form.otp.length === 6) {
        await handleVerifyOtp();
      } else {
        showToast("Please enter a complete 6-digit OTP", "error");
      }
    }
  };

  // Handle OTP Change
  const handleOtpChange = (value) => {
    setForm({ ...form, otp: value });
    setErrors({});
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!isValidMobile(form.mobile)) {
      setErrors({ mobile: "Invalid mobile number" });
      return;
    }

    try {
      setIsLoadingOtp(true);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/send-number-otp`, {
        phone: form.mobile,
      });

      if (response.data.success) {
        setIsOtpShow(true);
        setForm({ ...form, otp: "" });
        setErrors({});
        showToast("OTP sent successfully", "success");
        startCooldown();
      } else {
        throw new Error(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to send OTP", "error");
    } finally {
      setIsLoadingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (form.otp.length !== 6) {
      showToast("Please enter a valid 6-digit OTP", "error");
      return;
    }

    try {
      setIsLoadingOtp(true);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/verify-number-otp`, {
        phone: form.mobile,
        otp: form.otp,
        isAdminLogin: true,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "OTP verification failed");
      }

      const token = response.data.data;
      sessionStorage.setItem("token", token);

      const decodedToken = jwtDecode(token);
      const userId = decodedToken?.userId;

      if (userId) {
        const { data: userResponse } = await fetchUserById(userId);
        login(userResponse, token);
      } else {
        login(null, token);
      }

      showToast("Login successful", "success");
      navigate(decodedToken.role === "ADMIN" ? "/admin-dashboard" : decodedToken.role === "SUB_ADMIN" ? "/sub-admin-dashboard" : "/unauthorized");
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "OTP verification failed", "error");
      setForm({ ...form, otp: "" });
      otpRef.current?.focus();
    } finally {
      setIsLoadingOtp(false);
    }
  };

  // Resend OTP with timer guard
  const handleResendOtp = async () => {
    if (timer > 0) {
      showToast(`Please wait ${timer}s before resending`, "warning");
      return;
    }

    setIsOtpShow(false);
    await handleSendOtp();
  };

  return (
    <section className="flex justify-center items-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col w-full max-w-4xl shadow-lg bg-white rounded-lg overflow-hidden">
        {/* Description Section */}
        <div className="hidden sm:flex flex-col justify-center items-center bg-[#0c1f4d] text-white p-6 sm:p-8 text-center lg:hidden">
          <h2 className="text-xl sm:text-2xl font-semibold">Welcome to ExpoB2B</h2>
          <p className="text-sm sm:text-base mt-3 max-w-md">
            Join our platform to expand your business, connect with merchants, and grow your network. Sign in to access exclusive deals and partnerships.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 w-full">
          {/* Login Form */}
          <div className="flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 text-center mb-4 sm:mb-6">
              Huntsworld Admin Login
            </h2>

            {/* Toggle */}
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 w-full max-w-sm">
              <Button
                onClick={() => {
                  setLoginType("email");
                  setIsOtpShow(false);
                  setErrors({});
                  setForm({ ...form, mobile: "", otp: "" });
                }}
                className={`py-2 px-4 text-sm sm:text-base font-medium ${loginType === "email" ? "bg-[#ea1a24] text-white" : "bg-gray-300 cursor-pointer"}`}
                disabled={isLoading || isLoadingOtp}
              >
                Email / Phone Login
              </Button>
              <Button
                onClick={() => {
                  setLoginType("otp");
                  setIsOtpShow(false);
                  setErrors({});
                  setForm({ ...form, email: "", password: "", otp: "" });
                }}
                className={`py-2 px-4 text-sm sm:text-base font-medium ${loginType === "otp" ? "bg-[#ea1a24] text-white" : "bg-gray-300 cursor-pointer"}`}
                disabled={isLoading || isLoadingOtp}
              >
                OTP Login
              </Button>
            </div>

            {/* Email / Phone Login */}
            {loginType === "email" && (
              <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
                <div>
                  <Input
                    type="text"
                    placeholder="Email or Phone Number"
                    value={form.email}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      setForm({ ...form, email: value });
                      setErrors({});
                    }}
                    className="w-full text-sm sm:text-base"
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-red-500 text-xs sm:text-sm">{errors.email}</p>}
                  {/* Smart Hint */}
                  {form.email && isValidMobile(form.email) && (
                    <p className="text-xs text-green-600 mt-1">Logging in with Phone Number</p>
                  )}
                  {form.email && form.email.includes("@") && !isValidMobile(form.email) && (
                    <p className="text-xs text-blue-600 mt-1">Logging in with Email</p>
                  )}
                </div>

                <div>
                  {/* Password Input + Eye */}
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="w-full pr-11"
                      autoComplete="current-password"
                      onChange={(e) => {
                        passwordValueRef.current = e.target.value;
                        setErrors((prev) => ({ ...prev, password: "" }));
                      }}
                    />

                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-900 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Error Message */}
                  {errors.password && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1.5">
                      {errors.password}
                    </p>
                  )}
                </div>


                <div className="text-end">
                  <Link
                    to="/forgot-password"
                    className="w-full underline text-sm text-[#ea1a24] py-2 rounded-md cursor-pointer"
                  >
                    Forgot password
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#ea1a24] text-white h-10 sm:h-12 text-sm sm:text-base rounded-md cursor-pointer disabled:bg-gray-400"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            )}

            {/* OTP Login - 100% UNCHANGED */}
            {loginType === "otp" && (
              <div className="space-y-4 w-full max-w-sm">
                {!isOtpShow ? (
                  <>
                    <Input
                      type="text"
                      placeholder="Enter Mobile Number"
                      value={form.mobile}
                      onChange={(e) => {
                        setForm({ ...form, mobile: e.target.value });
                        setErrors({});
                      }}
                      maxLength={10}
                      className="w-full h-10 sm:h-12 text-sm sm:text-base"
                      disabled={isLoadingOtp}
                    />
                    {errors.mobile && <p className="text-red-500 text-xs sm:text-sm">{errors.mobile}</p>}
                    <Button
                      onClick={handleSendOtp}
                      disabled={!isValidMobile(form.mobile) || isLoadingOtp || timer > 0}
                      className="w-full bg-[#ea1a24] text-white h-10 sm:h-12 text-sm sm:text-base rounded-md cursor-pointer disabled:bg-gray-400"
                    >
                      {isLoadingOtp ? "Sending OTP..." : timer > 0 ? `Wait ${timer}s` : "Send OTP"}
                    </Button>
                  </>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 text-center">
                    <div className="flex justify-center">
                      <InputOTPPattern
                        value={form.otp}
                        onChange={handleOtpChange}
                        ref={otpRef}
                      />
                    </div>

                    {form.otp.length === 6 ? (
                      <Button
                        type="submit"
                        className="w-full bg-[#ea1a24] text-white h-10 sm:h-12 text-sm sm:text-base rounded-md cursor-pointer disabled:bg-gray-400"
                        disabled={isLoadingOtp}
                      >
                        {isLoadingOtp ? "Verifying OTP..." : "Verify OTP"}
                      </Button>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-500 text-center">Enter complete 6-digit OTP</p>
                    )}

                    <Button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoadingOtp || isResendDisabled}
                      className={`w-full h-10 text-sm sm:text-base rounded-md cursor-pointer mt-2 ${isLoadingOtp || isResendDisabled
                        ? "bg-gray-400 text-gray-700"
                        : "bg-gray-500 text-white hover:bg-gray-600"
                        }`}
                    >
                      {isLoadingOtp
                        ? "Resending..."
                        : isResendDisabled
                          ? `Resend OTP in ${timer}s`
                          : "Resend OTP"}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Right Panel (Desktop) */}
          <div className="hidden lg:flex flex-col justify-center items-center bg-[#0c1f4d] text-white p-6 lg:p-8">
            <h2 className="text-2xl font-semibold">Welcome to Huntsworld</h2>
            <p className="text-base mt-3 max-w-md text-center">
              Join our platform to expand your business, connect with merchants, and grow your network. Sign in to access exclusive deals and partnerships.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;
