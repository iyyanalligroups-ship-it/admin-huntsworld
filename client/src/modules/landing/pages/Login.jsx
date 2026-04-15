

import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import React, { useState, useContext, useRef, useEffect, forwardRef } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "../context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useLoginWithEmailMutation, useLazyGetUserByIdQuery } from "@/redux/api/Authapi";
import showToast from "@/toast/showToast";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

// InputOTPPattern component with proper ref and prop forwarding
const InputOTPPattern = forwardRef(({ value, onChange }, ref) => {
  return (
    <InputOTP
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
      value={value}
      onChange={onChange}
      ref={ref}
      className="flex justify-center"
    >
      <InputOTPGroup className="flex gap-1 sm:gap-2">
        <InputOTPSlot index={0} className="w-10 h-10 sm:w-12 sm:h-12 text-center text-sm sm:text-base" />
        <InputOTPSlot index={1} className="w-10 h-10 sm:w-12 sm:h-12 text-center text-sm sm:text-base" />
        <InputOTPSlot index={2} className="w-10 h-10 sm:w-12 sm:h-12 text-center text-sm sm:text-base" />
        <InputOTPSlot index={3} className="w-10 h-10 sm:w-12 sm:h-12 text-center text-sm sm:text-base" />
        <InputOTPSlot index={4} className="w-10 h-10 sm:w-12 sm:h-12 text-center text-sm sm:text-base" />
        <InputOTPSlot index={5} className="w-10 h-10 sm:w-12 sm:h-12 text-center text-sm sm:text-base" />
      </InputOTPGroup>
    </InputOTP>
  );
});

const Login = () => {
  const { login } = useContext(AuthContext);
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
  const otpRef = useRef(null);
  const [loginWithEmail] = useLoginWithEmailMutation();
  const [fetchUserById] = useLazyGetUserByIdQuery();

  // Auto-focus OTP input when form opens
  useEffect(() => {
    if (isOtpShow && otpRef.current) {
      otpRef.current.focus();
    }
  }, [isOtpShow]);

  // Validate Email Login
  const validateEmailLogin = () => {
    let newErrors = {};
    if (!form.email) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Mobile Number
  const isValidMobile = (number) => /^[6-9]\d{9}$/.test(number);

  // Send OTP by calling backend API
  const handleSendOtp = async () => {
    if (!isValidMobile(form.mobile)) {
      setErrors({ mobile: "Invalid mobile number" });
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/send-number-otp`, {
        phone: form.mobile,
      });

      if (response.data.success) {
        setIsOtpShow(true);
        setErrors({});
        showToast("OTP sent successfully", "success");
      } else {
        throw new Error(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Send OTP Error:", err);
      showToast(err.response?.data?.message || err.message || "Failed to send OTP", "error");
    }
  };

  // Handle OTP Verification and Login
  const handleVerifyOtp = async () => {
    if (form.otp.length !== 6) {
      showToast("Please enter a valid 6-digit OTP", "error");
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/verify-number-otp`, {
        phone: form.mobile,
        otp: form.otp,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "OTP verification failed");
      }

      const token = response.data.data;
      localStorage.setItem("token", token);

      const decodedToken = jwtDecode(token);
      const userId = decodedToken?.userId;

      if (userId) {
        const { data: userResponse } = await fetchUserById(userId);
        login(userResponse, token);
      } else {
        login(null, token);
      }

      showToast("Login successful", "success");
      navigate(decodedToken.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      console.error("OTP Verification Error:", err);
      showToast(err.response?.data?.message || err.message || "OTP verification failed", "error");
      setForm({ ...form, otp: "" });
      otpRef.current?.focus();
    }
  };

  // Handle Login Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loginType === "email") {
      if (validateEmailLogin()) {
        try {
          const response = await loginWithEmail({
            email: form.email,
            password: form.password,
          }).unwrap();

          if (!response.success) {
            throw new Error(response.message || "Login Failed");
          }

          const token = response.data;
          localStorage.setItem("token", token);

          const decodedToken = jwtDecode(token);
          const userId = decodedToken?.userId;

          if (userId) {
            const { data: userResponse } = await fetchUserById(userId);
            login(userResponse, token);
          } else {
            login(null, token);
          }

          showToast(response.message || "Login Successful", "success");
          navigate(decodedToken.role === "ADMIN" ? "/admin" : "/");
        } catch (err) {
          console.error("Login Error:", err);
          showToast(err?.data?.message || "Login Failed", "error");
        }
      }
    } else if (loginType === "otp") {
      if (form.otp.length === 6) {
        await handleVerifyOtp();
      } else {
        showToast("Please enter complete OTP", "error");
      }
    }
  };

  // Handle OTP Change
  const handleOtpChange = (value) => {
    setForm({ ...form, otp: value });
    setErrors({});
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (form.otp.length === 6) {
      showToast("Complete verification first", "warning");
      return;
    }
    setIsOtpShow(false);
    await handleSendOtp();
  };

  return (
    <section className="flex justify-center items-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col w-full max-w-4xl shadow-lg  bg-white rounded-lg overflow-hidden">
        {/* Description Section - Shown at the top on mobile, side on desktop */}
        <div className="hidden sm:flex flex-col justify-center items-center bg-[#0c1f4d] text-white p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold">Welcome to ExpoB2B</h2>
          <p className="text-sm sm:text-base mt-3 max-w-md">
            Join our platform to expand your business, connect with merchants, and grow your network.
            Sign in to access exclusive deals and partnerships.
          </p>
        </div>


        {/* Main Content - Grid for Desktop, Stacked for Mobile/Tablet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full">
          {/* Left - Login Form */}
          <div className="flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 text-center mb-4 sm:mb-6">
              Huntsworld Login
            </h2>

            {/* Toggle Login Type */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 w-full max-w-sm">
              <Button
                onClick={() => {
                  setLoginType("email");
                  setIsOtpShow(false);
                  setErrors({});
                  setForm({ ...form, mobile: "", otp: "" });
                }}
                className={`py-2 px-4 text-sm sm:text-base font-medium ${loginType === "email" ? "bg-[#ea1a24] text-white" : "bg-gray-300 cursor-pointer"
                  }`}
              >
                Login With Password
              </Button>
              <Button
                onClick={() => {
                  setLoginType("otp");
                  setIsOtpShow(false);
                  setErrors({});
                  setForm({ ...form, email: "", password: "", otp: "" });
                }}
                className={`py-2 px-4 text-sm sm:text-base font-medium ${loginType === "otp" ? "bg-[#ea1a24] text-white" : "bg-gray-300 cursor-pointer"
                  }`}
              >
                Login With OTP
              </Button>
            </div>

            {/* Email/Password Login */}
            {loginType === "email" && (
              <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
                <Input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-10 sm:h-12 text-sm sm:text-base"
                />
                {errors.email && <p className="text-red-500 text-xs sm:text-sm">{errors.email}</p>}

                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full h-10 sm:h-12 text-sm sm:text-base"
                />
                {errors.password && <p className="text-red-500 text-xs sm:text-sm">{errors.password}</p>}

                <Button
                  type="submit"
                  className="w-full bg-[#ea1a24] text-white h-10 sm:h-12 text-sm sm:text-base rounded-md cursor-pointer"
                >
                  Sign In
                </Button>
                <p className="text-center text-xs sm:text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-[#ea1a24] hover:underline">
                    Register
                  </Link>
                </p>
              </form>
            )}

            {/* Mobile OTP Login */}
            {loginType === "otp" && (
              <div className="space-y-4 w-full max-w-sm">
                {/* Mobile Number Input */}
                {!isOtpShow && (
                  <>
                    <Input
                      type="text"
                      name="mobile"
                      placeholder="Enter Mobile Number"
                      value={form.mobile}
                      onChange={(e) => {
                        setForm({ ...form, mobile: e.target.value });
                        setErrors({});
                      }}
                      maxLength={10}
                      className="w-full h-10 sm:h-12 text-sm sm:text-base"
                    />
                    {errors.mobile && <p className="text-red-500 text-xs sm:text-sm">{errors.mobile}</p>}
                    <Button
                      onClick={handleSendOtp}
                      disabled={!isValidMobile(form.mobile)}
                      className="w-full bg-[#ea1a24] text-white h-10 sm:h-12 text-sm sm:text-base rounded-md cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Send OTP
                    </Button>
                    <p className="text-center text-xs sm:text-sm text-gray-600">
                      Don't have an account?{" "}
                      <Link to="/register" className="text-[#ea1a24] hover:underline">
                        Register
                      </Link>
                    </p>
                  </>
                )}

                {/* OTP Input */}
                {isOtpShow && (
                  <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-4">
                    <InputOTPPattern
                      value={form.otp}
                      onChange={handleOtpChange}
                      ref={otpRef}
                    />
                    {form.otp.length === 6 ? (
                      <Button
                        type="submit"
                        className="w-full bg-[#ea1a24] text-white h-10 sm:h-12 text-sm sm:text-base rounded-md cursor-pointer"
                      >
                        Verify OTP
                      </Button>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-500 text-center">Enter complete OTP to verify</p>
                    )}
                    <Button
                      type="button"
                      onClick={handleResendOtp}
                      className="w-full bg-gray-500 text-white h-10 sm:h-12 text-sm sm:text-base rounded-md cursor-pointer"
                    >
                      Resend OTP
                    </Button>
                    <p className="text-center text-xs sm:text-sm text-gray-600">
                      Don't have an account?{" "}
                      <Link to="/register" className="text-[#ea1a24] hover:underline">
                        Register
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Right - Description Section (Desktop Only) */}
          <div className="hidden sm:flex flex-col justify-center items-center bg-[#0c1f4d] text-white p-6 lg:p-8">
            <h2 className="text-2xl font-semibold">Welcome to ExpoB2B</h2>
            <p className="text-base mt-3 max-w-md text-center">
              Join our platform to expand your business, connect with merchants, and grow your network. Sign in to access exclusive deals and partnerships.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;