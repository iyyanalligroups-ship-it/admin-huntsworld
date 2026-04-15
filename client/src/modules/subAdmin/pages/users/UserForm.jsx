import { useState, useEffect, useRef } from "react";
import {
  useRegisterUserMutation,
  useUpdateUserMutation,
  useResendOtpMutation,
  useVerifyEmailOtpMutation,
  useCompleteRegistrationMutation,
} from "@/redux/api/Authapi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import showToast from '@/toast/showToast';
import { Eye, EyeOff, Loader2, Smartphone, Mail, ShieldCheck, User, Lock, RotateCcw, CheckCircle2, Send, Briefcase } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const UserForm = ({ user, closeModal, refetch }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    confirmPassword: "",
    phoneOtp: "",
    emailOtp: "",
    role: user?.role?.role || "USER",
  });

  const [registerType, setRegisterType] = useState(user?.email ? "email" : "phone");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 🔹 Verification States
  const [phoneVerified, setPhoneVerified] = useState(!!user);
  const [emailVerified, setEmailVerified] = useState(!!user?.is_verified);
  const [phoneOtpShow, setPhoneOtpShow] = useState(false);
  const [emailOtpShow, setEmailOtpShow] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);

  const [registerUser, { isLoading: isRegistering }] = useRegisterUserMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [resendOtpEmail] = useResendOtpMutation();
  const [verifyEmailOtpHook] = useVerifyEmailOtpMutation();
  const [completeRegistration, { isLoading: isCompleting }] = useCompleteRegistrationMutation();

  const startTimer = (duration = 60) => {
    setTimer(duration);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    else if (formData.name.length < 3) newErrors.name = "Name must be at least 3 characters";

    if (!user && registerType === "email" && formData.password) {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/.test(formData.password)) {
        newErrors.password = "Must be 6+ chars with Uppercase, Lowercase, Number & Special char";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (registerType === "email" && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone))
      newErrors.phone = "Phone must be 10 digits";

    setErrors(newErrors);
  };

  useEffect(() => {
    validateForm();
  }, [formData, registerType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "phone") finalValue = value.replace(/\D/g, "").slice(0, 10);
    if (name === "phoneOtp" || name === "emailOtp") finalValue = value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // 🔹 PHONE VERIFICATION LOGIC
  const handleVerifyPhoneInitiate = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      showToast("Please enter a valid 10-digit phone number", "warning");
      return;
    }
    
    // If session hasn't started, start it
    if (!phoneOtpShow && !emailOtpShow) {
      setIsResending(true);
      try {
        const response = await registerUser({ 
          phone: formData.phone.trim(), 
          // Removed email from initial registerUser call to keep verification separate as requested
          role: formData.role
        }).unwrap();
        
        if (response.success) {
          setPhoneOtpShow(true);
          startTimer();
          showToast(response.message || "Phone OTP sent successfully", "success");
        }
      } catch (err) {
        showToast(err.data?.message || "Failed to start verification", "error");
      } finally {
        setIsResending(false);
      }
      return;
    }

    // If session started, treat as resend
    setIsResending(true);
    try {
      // Use the resendOtp endpoint for phone if session exists
      const response = await resendOtpEmail({ phone: formData.phone }).unwrap();
      if (response.success) {
        setPhoneOtpShow(true);
        startTimer();
        showToast("OTP resent to user's phone", "success");
      }
    } catch (err) {
      showToast(err.data?.message || "Failed to resend phone OTP", "error");
    } finally {
      setIsResending(false);
    }
  };

  const handleConfirmPhoneOtp = async () => {
    if (formData.phoneOtp.length < 4) return;
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/verify-number-otp`, {
        phone: formData.phone,
        otp: formData.phoneOtp,
      });
      if (response.data.success) {
        setPhoneVerified(true);
        setPhoneOtpShow(false);
        showToast("Phone verified successfully!", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid OTP", "error");
    }
  };

  // 🔹 EMAIL VERIFICATION LOGIC
  const handleVerifyEmailInitiate = async () => {
    if (!formData.email) return;

    // If session hasn't started, we must initiate phone first since the backend session is phone-based
    if (!phoneOtpShow && !phoneVerified) {
      if (!formData.phone || formData.phone.length < 10) {
        showToast("Please enter and verify your phone number first", "warning");
        return;
      }
      showToast("Please verify your phone number first to start registration", "warning");
      return;
    }

    setIsResending(true);
    try {
      // Trigger email OTP using the resend endpoint (works for PendingUser once phone session is active)
      const response = await resendOtpEmail({ 
        email: formData.email.trim().toLowerCase(), 
        phone: formData.phone.trim() 
      }).unwrap();
      
      if (response.success) {
        setEmailOtpShow(true);
        startTimer();
        showToast("OTP sent to user's email", "success");
      }
    } catch (err) {
      showToast(err.data?.message || "Failed to send email OTP", "error");
    } finally {
      setIsResending(false);
    }
  };

  const handleConfirmEmailOtp = async () => {
    if (formData.emailOtp.length < 4) return;
    try {
      const response = await verifyEmailOtpHook({
        email: formData.email,
        email_otp: formData.emailOtp,
        phone: formData.phone
      }).unwrap();
      if (response.success) {
        setEmailVerified(true);
        setEmailOtpShow(false);
        showToast("Email verified successfully!", "success");
      }
    } catch (err) {
      showToast(err.data?.message || "Invalid Email OTP", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneVerified) {
       showToast("Please verify the phone number first", "error");
       return;
    }

    if (user) {
      const response = await updateUser({ id: user._id, updatedUser: formData });
      if (response.data?.success) {
        showToast("User updated successfully", "success");
        if (refetch) refetch();
        closeModal();
      }
    } else {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email ? formData.email.trim().toLowerCase() : "",
        password: formData.password,
        role: formData.role,
      };

      try {
        const response = await completeRegistration(payload).unwrap();
        if (response.success) {
          showToast(response.message || "User created successfully!", "success");
          if (refetch) refetch();
          closeModal();
        }
      } catch (err) {
        showToast(err.data?.message || err.message || "Failed to create user", "error");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!user && (
        <div className="flex p-1 bg-gray-100 rounded-2xl w-fit mx-auto border border-gray-200/50">
          {["email", "phone"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRegisterType(type)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase transition-all duration-300 ${registerType === type ? "bg-white text-[#0c1f4d] shadow-md scale-[1.02]" : "text-gray-400 hover:bg-gray-200/50"}`}
            >
              {type === "email" ? <Mail size={16} /> : <Smartphone size={16} />} {type} Mode
            </button>
          ))}
        </div>
      )}

      <div className="max-h-[60vh] overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        {!user && (
          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em] pl-1 italic">
              <Briefcase size={14} className="text-[#0c1f4d]" /> Select Role <span className="text-red-500">*</span>
            </Label>
            <Select 
              onValueChange={(val) => setFormData(prev => ({ ...prev, role: val }))} 
              defaultValue={formData.role}
              disabled={phoneOtpShow || phoneVerified}
            >
              <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:border-[#0c1f4d] focus:ring-2 focus:ring-[#0c1f4d]/10 font-bold">
                <SelectValue placeholder="Choose User Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Standard User</SelectItem>
                {/* <SelectItem value="MERCHANT">Merchant / Shop Owner</SelectItem>
                <SelectItem value="SERVICE_PROVIDER">Service Provider</SelectItem>
                <SelectItem value="SUB_DEALER">Sub Dealer</SelectItem> */}
              </SelectContent>
            </Select>
            <p className="text-[9px] text-gray-400 pl-1">Role cannot be changed after you start verification.</p>
          </div>
        )}

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em] pl-1 italic">
            <User size={14} className="text-[#0c1f4d]" /> Full Name <span className="text-red-500">*</span>
          </Label>
          <Input 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="Enter User's Name" 
            className="h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:border-[#0c1f4d] focus:ring-2 focus:ring-[#0c1f4d]/10 font-semibold placeholder:text-gray-300 transition-all" 
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em] pl-1 italic">
            <Smartphone size={14} className="text-[#0c1f4d]" /> Phone Number <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black border-r border-gray-200 pr-3">+91</span>
              <Input 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                disabled={phoneVerified} 
                placeholder="99XXXXXXXX" 
                maxLength={10} 
                className={`h-12 pl-16 rounded-xl bg-white border-gray-200 shadow-sm focus:border-[#0c1f4d] focus:ring-2 focus:ring-[#0c1f4d]/10 font-black tracking-[0.2em] placeholder:text-gray-200 transition-all ${phoneVerified ? 'bg-green-50 border-green-300' : ''}`} 
              />
            </div>
            {!phoneVerified && (
              <Button type="button" onClick={handleVerifyPhoneInitiate} disabled={isResending || (phoneOtpShow && timer > 0) || !formData.phone || formData.phone.length < 10} className="h-12 px-6 rounded-xl bg-[#0c1f4d] text-white hover:bg-black text-[10px] font-black uppercase tracking-[0.1em] shadow-lg transition-all active:scale-95 cursor-pointer">
                {phoneOtpShow ? (timer > 0 ? `${timer}s` : "Resend") : "Verify"}
              </Button>
            )}
            {phoneVerified && <div className="h-12 w-12 flex items-center justify-center bg-green-100 text-green-600 rounded-xl border border-green-200"><CheckCircle2 size={18} /></div>}
          </div>
          {phoneOtpShow && !phoneVerified && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 mt-2">
              <Input name="phoneOtp" value={formData.phoneOtp} onChange={handleChange} placeholder="OTP" className="h-11 flex-1 rounded-xl border-red-200 bg-red-50/30 text-center font-black tracking-[0.5em] focus:ring-red-500/20" />
              <Button type="button" onClick={handleConfirmPhoneOtp} className="h-11 px-6 rounded-xl bg-red-600 text-white font-black text-[10px] uppercase shadow-lg hover:bg-red-700 cursor-pointer">Confirm</Button>
            </motion.div>
          )}
        </div>

        {registerType === "email" && (
          <div className={`space-y-2 md:col-span-2 transition-opacity duration-300 ${!phoneVerified ? 'opacity-50' : 'opacity-100'}`}>
            <Label className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em] pl-1 italic">
              <Mail size={14} className="text-[#0c1f4d]" /> Email Address <small className="text-gray-400">(Verify phone first)</small>
            </Label>
            <div className="flex gap-2">
              <Input 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                disabled={!phoneVerified || emailVerified} 
                placeholder={phoneVerified ? "email@example.com" : "Verify phone to unlock"} 
                className={`h-12 flex-1 rounded-xl bg-white border-gray-200 shadow-sm focus:border-[#0c1f4d] focus:ring-2 focus:ring-[#0c1f4d]/10 font-semibold placeholder:text-gray-300 transition-all ${emailVerified ? 'bg-green-50 border-green-300' : ''}`} 
              />
              {!emailVerified && formData.email && (
                <Button 
                  type="button" 
                  onClick={handleVerifyEmailInitiate} 
                  disabled={!phoneVerified || isResending || (emailOtpShow && timer > 0)} 
                  className="h-12 px-6 rounded-xl bg-[#0c1f4d] text-white hover:bg-black text-[10px] font-black uppercase tracking-[0.1em] shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailOtpShow ? (timer > 0 ? `${timer}s` : "Resend") : "Verify"}
                </Button>
              )}
              {emailVerified && <div className="h-12 w-12 flex items-center justify-center bg-green-100 text-green-600 rounded-xl border border-green-200"><CheckCircle2 size={18} /></div>}
            </div>
            {emailOtpShow && !emailVerified && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 mt-2">
                <Input name="emailOtp" value={formData.emailOtp} onChange={handleChange} placeholder="OTP" className="h-11 flex-1 rounded-xl border-red-200 bg-red-50/30 text-center font-black tracking-[0.5em] focus:ring-red-500/20" />
                <Button type="button" onClick={handleConfirmEmailOtp} className="h-11 px-6 rounded-xl bg-red-600 text-white font-black text-[10px] uppercase shadow-lg hover:bg-red-700 cursor-pointer">Confirm</Button>
              </motion.div>
            )}
          </div>
        )}

        {registerType === "email" && (
          <>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em] pl-1 italic">
                <Lock size={14} className="text-[#0c1f4d]" /> Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="Enter secure password"
                  className="h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:border-[#0c1f4d] focus:ring-2 focus:ring-[#0c1f4d]/10 font-semibold transition-all" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#0c1f4d] transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em] pl-1 italic">
                <ShieldCheck size={14} className="text-[#0c1f4d]" /> Confirm <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  placeholder="Confirm password"
                  className="h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:border-[#0c1f4d] focus:ring-2 focus:ring-[#0c1f4d]/10 font-semibold transition-all" 
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#0c1f4d] transition-colors">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
          </>
        )}
      </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-100">
         <Button type="button" variant="outline" onClick={closeModal} className="flex-1 h-14 rounded-xl font-bold uppercase text-xs tracking-widest text-gray-400 cursor-pointer">Cancel</Button>
         <Button 
          type="submit" 
          disabled={!phoneVerified || isRegistering || isUpdatingUser || isCompleting}
          className={`flex-[2] h-14 rounded-xl font-black shadow-xl uppercase text-xs tracking-[0.2em] transition-all cursor-pointer ${phoneVerified ? 'bg-[#0c1f4d] text-white hover:bg-black' : 'bg-gray-200 text-gray-400'}`}
         >
           {(isRegistering || isUpdatingUser || isCompleting) ? <Loader2 size={18} className="animate-spin" /> : (user ? "Update User" : "Finalize & Create User")}
         </Button>
      </div>
    </form>
  );
};

export default UserForm;
