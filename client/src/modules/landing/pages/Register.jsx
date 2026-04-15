import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {Input} from "@/components/ui/input"
import { useToast } from "@/modules/landing/hooks/useToast";
import { CheckCircle, Users, Package } from "lucide-react";
import registerBg from "@/assets/images/register-banner.jpg";
import { useNavigate } from "react-router-dom";
import {
  useRegisterUserMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useVerifyEmailOtpMutation
} from "@/redux/api/Authapi";

const Register = () => {
  const [step, setStep] = useState(1);
  const { ToastComponent, showToast } = useToast();
  const navigate = useNavigate();
  const [registerUser, { isLoading, error }] = useRegisterUserMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [verifyEmailOtp, { isLoading: isVerifyingOtp  }] = useVerifyEmailOtpMutation();
  const [verifyOtp] = useVerifyOtpMutation();
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: ["", "", "", ""],
  });
  const [errors, setErrors] = useState({});
  const [isOtpShow, setIsOtpShow] = useState(false);

  const validate = () => {
    let newErrors = {};
    if (step === 1 && !formData.name.trim()) {
      newErrors.name = "Username is required";
    } else if (step === 2 && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    } else if (step === 3) {
      if (!formData.password.trim()) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
      if (formData.confirmPassword !== formData.password) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    } else if (
      step === 4 &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(step + 1);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        const response = await registerUser(formData).unwrap();
        console.log(response);
        
        if (response.data) {
          showToast(response.message  || "Registration Successful. OTP sent to email");
          setIsOtpShow(true);
        }
      } catch (error) {
        showToast(error.message || "Registration Failed", "error");
      }
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await verifyEmailOtp({
        email: formData.email,
        email_otp: formData.otp.join(""),
      }).unwrap();
      console.log(response);
      showToast(response.message  || "Otp Verification Successful", "success");
      navigate("/login");
    } catch (error) {
      showToast(error.message || "Otp Verification Failed", "error");
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await resendOtp({ email: formData.email }).unwrap();
      if (response.success) {
        showToast(response.message  || "Otp send Successfully", "success");
        setFormData({ ...formData, otp: ["", "", "", ""] }); // Clear OTP fields
      }
    } catch (error) {
      showToast(error.message || "Failed to send Otp", "error");
    }
  };

  // Handle OTP Input Change
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // Only allow numbers
    let newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData({ ...formData, otp: newOtp });

    // Move focus forward
    if (value && index < 3) otpRefs[index + 1].current.focus();
  };

  // Handle OTP Send/Resend
  const handleSendOtp = () => {
    setIsOtpShow(true); // Show OTP fields & hide mobile input
    setFormData({ ...formData, otp: ["", "", "", ""] }); // Clear OTP input
  };

  // Handle OTP Backspace (Move focus back)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  {
    isLoading && (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin text-red-500 h-12 w-12"></div>
      </div>
    );
  }

  {
    error && (
      <div className="text-red-500 text-center">
        {error.message || "Something went wrong"}
      </div>
    );
  }
  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      {/* Background Image with Overlay */}
      {
           ToastComponent && (
            <div>
              {ToastComponent}
            </div>
           )
      }
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${registerBg})`,
          filter: "brightness(40%)",
        }}
      ></div>
      <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-center mb-4">
          Register your Company FREE
        </h2>
        {!isOtpShow ? (
          step === 1 ? (
            <div>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
              
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
              <Button
                className="w-full bg-red-600 text-white mt-4 cursor-pointer"
                onClick={handleNext}
              >
                Next
              </Button>
            </div>
          ) : step === 2 ? (
            <div>
              <Input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Mobile Number"
          
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}
              <Button
                className="w-full bg-red-600 text-white mt-4 cursor-pointer"
                onClick={handleNext}
              >
                Next
              </Button>
            </div>
          ) : step === 3 ? (
            <div>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter a password"
      
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
       
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
              )}
              <Button
                className="w-full bg-red-600 text-white mt-4 cursor-pointer"
                onClick={handleNext}
              >
                Next
              </Button>
            </div>
          ) : (
            <div>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
         
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
              <Button
                className="w-full bg-green-600 text-white mt-4 cursor-pointer"
                onClick={handleRegister}
              >
                Create Account
              </Button>
            </div>
          )
        ) : (
          <div className="mt-4 space-y-4 w-full max-w-sm">
            <div className="flex gap-2 justify-center">
              {formData.otp.map((digit, index) => (
                <input
                  key={index}
                  ref={otpRefs[index]}
                  type="text"
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                />
              ))}
            </div>
            <Button
              onClick={handleResendOtp}
              className="w-full bg-gray-500 text-white py-2 rounded-md mt-3 cursor-pointer"
              disabled={isResending}
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </Button>

            <Button
              className="w-full bg-[#e03733] text-white py-2 cursor-pointer"
              onClick={handleVerifyOtp}
            >
              Verify OTP
            </Button>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="relative z-10 flex flex-col items-center text-white text-center p-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h3 className="text-3xl font-bold">
            Sell your products to millions of customers!
          </h3>
          <h4 className="text-xl">Register your Business with us Free</h4>
          <h5 className="text-lg font-semibold">
            Get started with Huntsworld!
          </h5>
        </div>

        {/* Stats Icons */}
        <div className="flex gap-10 mt-8">
          <div className="flex flex-col items-center">
            <Package size={40} strokeWidth={1.5} className="text-[#e03733]" />
            <h4 className="text-2xl font-bold mt-2">2 Crore+</h4>
            <h5 className="text-lg">Products/Services</h5>
          </div>
          <div className="flex flex-col items-center">
            <Users size={40} strokeWidth={1.5} className="text-[#e03733]" />
            <h4 className="text-2xl font-bold mt-2">20 Lakh+</h4>
            <h5 className="text-lg">Suppliers</h5>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle
              size={40}
              strokeWidth={1.5}
              className="text-[#e03733]"
            />
            <h4 className="text-2xl font-bold mt-2">50 Lakh+</h4>
            <h5 className="text-lg">Verified Buyers</h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
