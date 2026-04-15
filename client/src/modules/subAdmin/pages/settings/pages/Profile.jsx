import React, { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Pencil, User, Mail, Phone, Users, Clock, Trash2, Copy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { useLazyGetUserByIdQuery, useUpdateUserMutation } from "@/redux/api/Authapi";
import { useUploadUserProfilePicMutation, useDeleteUserProfilePicMutation } from "@/redux/api/UserprofilePicapi";
import { Badge } from "@/components/ui/badge";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { validatePhoneNumber } from "@/modules/validation/phoneValidation";

const Profile = ({ userId }) => {
  const { isSidebarOpen } = useSidebar();
  const { refreshUser } = useContext(AuthContext);
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    profile_pic: "",
    created_at: "",
    password: "",
    confirmPassword: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [originalEmail, setOriginalEmail] = useState(""); // Track original email
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // OTP Verification States
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // RTK Query hooks
  const [fetchUserById, { isLoading, error }] = useLazyGetUserByIdQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [uploadProfileImage, { isLoading: isUploading }] = useUploadUserProfilePicMutation();
  const [deleteProfileImage, { isLoading: isDeleting }] = useDeleteUserProfilePicMutation();

  // Countdown timer for OTP resend
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchUserById(userId).unwrap();
        setUserDetails(response?.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        showToast("Failed to fetch user data", "error");
      }
    };
    if (userId) fetchUser();
  }, [userId, fetchUserById]);

  // Update formData when userDetails changes
  useEffect(() => {
    if (userDetails) {
      const updatedFormData = {
        name: userDetails.name || "",
        email: userDetails.email || "",
        phone: userDetails.phone || "",
        gender: userDetails.gender || "",
        profile_pic: userDetails.profile_pic || "",
        created_at: userDetails.created_at || "",
        password: "",
        confirmPassword: "",
      };
      setFormData(updatedFormData);
      setProfileImage(userDetails.profile_pic || null);
      setOriginalEmail(userDetails.email || ""); // Save original email
    }
  }, [userDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "phone") {
      const validation = validatePhoneNumber(value);
      setPhoneError(validation.isValid ? "" : validation.errorMessage);
    }

    if (name === "password") {
      if (!value.trim()) {
        setPasswordError("");
      } else if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/.test(
          value
        )
      ) {
        setPasswordError(
          "Password must be at least 6 characters and include one uppercase letter, one lowercase letter, one number, and one special character"
        );
      } else {
        setPasswordError("");
      }
    }

    if (name === "password" || name === "confirmPassword") {
      const newFormData = { ...formData, [name]: value };
      setConfirmPasswordError(
        newFormData.password && newFormData.confirmPassword
          ? newFormData.password === newFormData.confirmPassword
            ? ""
            : "Passwords do not match"
          : ""
      );
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);

    const imageFormData = new FormData();
    imageFormData.append("profile_pic", file);
    imageFormData.append("entity_type", "user");
    imageFormData.append("user_id", userId);

    try {
      const response = await uploadProfileImage({ formData: imageFormData }).unwrap();
      const uploadedUrl = response.files[0]?.fileUrl;

      setProfileImage(uploadedUrl);
      setFormData((prev) => ({ ...prev, profile_pic: uploadedUrl }));

     await updateUser({ id: userId, updatedUser: { profile_pic: uploadedUrl } }).unwrap();

      const updatedUser = await fetchUserById(userId).unwrap();
      setUserDetails(updatedUser?.user);
      showToast("Profile picture updated successfully", "success");
    } catch (err) {
      showToast(err.data?.message || "Failed to upload image", "error");
      setProfileImage(userDetails?.profile_pic || null);
    }
  };

  const handleDeleteImage = async () => {
    if (!formData.profile_pic) return;

    try {
      await deleteProfileImage({
        user_id: userId,
        entity_type: "user",
        profile_pic: formData.profile_pic,
      }).unwrap();

      await updateUser({ id: userId, updatedUser: { profile_pic: "" } }).unwrap();

      setProfileImage(null);
      setFormData((prev) => ({ ...prev, profile_pic: "" }));
      const updatedUser = await fetchUserById(userId).unwrap();
      setUserDetails(updatedUser?.user);
      showToast("Profile picture removed", "success");
    } catch (err) {
      showToast("Failed to delete image", "error");
    }
  };

  const handleSave = async () => {
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.errorMessage);
      showToast(phoneValidation.errorMessage, "error");
      return;
    }

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        showToast("Passwords do not match", "error");
        return;
      }
      if (
        formData.password &&
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/.test(
          formData.password
        )
      ) {
        setPasswordError(
          "Password must be at least 6 characters and include one uppercase letter, one lowercase letter, one number, and one special character"
        );
        showToast("Invalid password format", "error");
        return;
      }
    }

    const emailChanged = formData.email !== originalEmail;

    try {
      const { confirmPassword, ...payload } = formData;
      const response = await updateUser({ id: userId, updatedUser: payload }).unwrap();

      if (emailChanged && response.message?.includes("OTP")) {
        setShowOtpSection(true);
        startCountdown();
        showToast("OTP sent to your new email. Please verify.", "info");
      } else {
        setIsEditing(false);
        setOriginalEmail(formData.email);
        showToast("Profile updated successfully", "success");
      }

      const updatedUser = await fetchUserById(userId).unwrap();
      setUserDetails(updatedUser?.user);
      refreshUser(response);
    } catch (err) {
      showToast(err.data?.message || "Failed to update profile", "error");
    }
  };

  // OTP Handlers
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      setOtpError("Enter 4-digit OTP");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, email_otp: otp }),
      });
      const data = await res.json();

      if (data.success) {
        showToast("Email verified successfully!", "success");
        setShowOtpSection(false);
        setIsEditing(false);
        setOtp("");
        setOriginalEmail(formData.email);

        const updated = await fetchUserById(userId).unwrap();
        setUserDetails(updated?.user);
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Verification failed");
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      await updateUser({ id: userId, updatedUser: { email: formData.email } }).unwrap();
      showToast("New OTP sent!", "success");
      startCountdown();
    } catch (err) {
      showToast("Failed to resend OTP", "error");
    } finally {
      setIsResending(false);
    }
  };

  const safeFormData = {
    name: formData.name || "",
    email: formData.email || "",
    phone: formData.phone || "",
    gender: formData.gender || "",
    profile_pic: formData.profile_pic || "",
    created_at: formData.created_at || "",
  };

  const InfoDisplay = () => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg transition-all duration-300">
      <div className="flex flex-col items-center md:flex-row md:items-start gap-8 p-8">
        <div className="relative group">
          <Avatar key={profileImage} className="w-32 h-32 border-4 border-white shadow-md group-hover:scale-105 transition-transform">
            <AvatarImage src={`${profileImage}?t=${Date.now()}`} alt="Profile" />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
              {safeFormData.name.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left">
          <h3 className="text-2xl font-bold text-gray-800">{safeFormData.name || "Anonymous User"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-800">{safeFormData.email || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-gray-800">{safeFormData.phone || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-gray-800 capitalize">{safeFormData.gender || "Not specified"}</p>
              </div>
            </div>
            {safeFormData.created_at && (
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Joined</p>
                  <Badge variant="secondary" className="mt-1">
                    {format(new Date(safeFormData.created_at), "PPP")}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error loading user data</div>;

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Your personal details</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative group">
                <Avatar key={profileImage} className="w-24 h-24 border-2 border-primary/20 group-hover:border-primary/50 transition-all">
                  <AvatarImage src={`${profileImage}?t=${Date.now()}`} alt="Profile" />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {safeFormData.name.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-upload"
                  className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-primary/90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                </label>
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="font-medium">Profile Picture</h3>
                <p className="text-sm text-gray-500">Upload a clear photo</p>
                <Button variant="outline" size="sm" onClick={() => document.getElementById("profile-upload")?.click()} disabled={isUploading}>
                  Upload new image
                </Button>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={safeFormData.name} onChange={handleInputChange} placeholder="Enter your name" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input id="email" name="email" type="email" value={safeFormData.email} onChange={handleInputChange} placeholder="your.email@example.com" className="pl-10" />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Input id="phone" name="phone" type="tel" value={safeFormData.phone} onChange={handleInputChange} placeholder="+91 9876543210" className={`pl-10 ${phoneError ? "border-red-500" : ""}`} />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={safeFormData.gender} onValueChange={(v) => handleSelectChange("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    className={passwordError ? "border-red-500" : ""}
                  />
                  {passwordError && (
                    <p className="text-sm text-red-500 mt-1">{passwordError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm password" className={confirmPasswordError ? "border-red-500" : ""} />
                  {confirmPasswordError && <p className="text-sm text-red-500">{confirmPasswordError}</p>}
                </div>
              </div>

              <Button onClick={handleSave} disabled={isUpdating || !!phoneError || !!passwordError || !!confirmPasswordError} className="w-full">
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>

              {/* OTP Verification Section */}
              {showOtpSection && (
                <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-4">Verify Your New Email</h4>
                  <p className="text-sm text-gray-700 mb-4">OTP sent to <strong>{formData.email}</strong></p>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter 4-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      className="text-center text-2xl font-mono tracking-widest"
                    />
                    {otpError && <p className="text-sm text-red-600">{otpError}</p>}
                    <div className="flex gap-3">
                      <Button onClick={handleVerifyOtp} className="flex-1 bg-[#0c1f4d]">Verify OTP</Button>
                      <Button variant="outline" onClick={handleResendOtp} disabled={isResending || countdown > 0} className="flex-1">
                        {isResending ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setShowOtpSection(false); setOtp(""); setCountdown(0); }} className="w-full">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <InfoDisplay />
        )}
      </CardContent>
    </Card>
  );
};

Profile.propTypes = {
  userId: PropTypes.string.isRequired,
};

const ParentComponent = () => {
  const { user } = useContext(AuthContext);
  return <Profile userId={user?.user?._id} />;
};

export default ParentComponent;