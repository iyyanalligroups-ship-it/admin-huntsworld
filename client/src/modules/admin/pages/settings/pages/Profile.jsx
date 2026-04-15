import React, { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { CalendarIcon, Pencil, User, Mail, Phone, Users, Clock, Trash2, Copy } from "lucide-react";
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
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { refreshUser } = useContext(AuthContext);
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
  const [originalEmail, setOriginalEmail] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Email OTP Verification States
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
      }
    };
    if (userId) {
      fetchUser();
    }
  }, [userId, fetchUserById]);

  // Update formData when userDetails changes
  useEffect(() => {
    if (userDetails) {
      console.log("Updating formData with userDetails:", userDetails); // Debug log
      setFormData({
        name: userDetails.name || "",
        email: userDetails.email || "",
        phone: userDetails.phone || "",
        gender: userDetails.gender || "",
        profile_pic: userDetails.profile_pic || "",
        created_at: userDetails.created_at || "",
        password: "",
        confirmPassword: "",
      });
      setProfileImage(userDetails.profile_pic || null);
      setOriginalEmail(userDetails.email || "");
    }
  }, [userDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate phone number
    if (name === "phone") {
      const validation = validatePhoneNumber(value);
      setPhoneError(validation.errorMessage);
    }

    // Validate confirm password
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
      if (newFormData.password || newFormData.confirmPassword) {
        setConfirmPasswordError(
          newFormData.password === newFormData.confirmPassword
            ? ""
            : "Passwords do not match"
        );
      } else {
        setConfirmPasswordError("");
      }
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Generate preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result); // Set temporary preview URL
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append("profile_pic", file);
      formData.append("entity_type", "user");
      formData.append("user_id", userId);

      try {
        const response = await uploadProfileImage({ formData }).unwrap();
        const uploadedUrl = response.files[0]?.fileUrl;
        console.log("Uploaded URL:", uploadedUrl); // Debug log

        setProfileImage(uploadedUrl);
        setFormData((prev) => ({ ...prev, profile_pic: uploadedUrl }));

        await updateUser({
          id: userId,
          updatedUser: { profile_pic: uploadedUrl },
        }).unwrap();

        // Refetch user data to ensure userDetails is updated
        const updatedUser = await fetchUserById(userId).unwrap();
        setUserDetails(updatedUser?.user);

        showToast("Profile picture updated successfully", "success");
      } catch (err) {
        console.error("Failed to upload and update profile image:", err);
        showToast(err.data?.message || "Failed to upload profile picture", "error");
        setProfileImage(null); // Reset preview on error
      }
    }
  };

  const handleDeleteImage = async (profile_pic) => {
    if (!profile_pic || typeof profile_pic !== "string") {
      console.error("Invalid image URL for deletion");
      showToast("Invalid image URL for deletion", "error");
      return;
    }

    try {
      await deleteProfileImage({
        user_id: userId,
        entity_type: "user",
        profile_pic,
      }).unwrap();

      setProfileImage(null);
      setFormData((prev) => ({ ...prev, profile_pic: "" }));
      showToast("Profile picture deleted successfully", "success");
    } catch (err) {
      console.error("Failed to delete profile image:", err);
      showToast(err.data?.message || "Failed to delete profile picture", "error");
    }
  };

  const handleCopyReferral = async () => {
    try {
      const referralLink = `${import.meta.env.VITE_CLIENT_URL}/referral-register?ref=${userDetails?.referral_code}`;
      await navigator.clipboard.writeText(referralLink);
      showToast("Referral link copied to clipboard!", "success");
    } catch (err) {
      console.error("Failed to copy referral link:", err);
      showToast("Failed to copy referral link. Please try again.", "error");
    }
  };

  const handleSave = async () => {
    // Validate phone number
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.errorMessage);
      showToast(phoneValidation.errorMessage, "error");
      return;
    }

    // Validate password and confirm password
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
      const updateData = { ...formData };
      if (!formData.password) {
        delete updateData.password;
        delete updateData.confirmPassword;
      } else {
        delete updateData.confirmPassword;
      }

      const response = await updateUser({ id: userId, updatedUser: updateData }).unwrap();

      if (emailChanged && response.message?.includes("OTP sent")) {
        setShowOtpSection(true);
        startCountdown();
        showToast("OTP sent to your new email. Please verify to complete update.", "info");
      } else {
        setIsEditing(false);
        setOriginalEmail(formData.email);
        showToast("Profile updated successfully", "success");
      }

      // Refetch user data to ensure userDetails is updated
      const updatedUser = await fetchUserById(userId).unwrap();
      setUserDetails(updatedUser?.user);

      // Update global AuthContext + sessionStorage
      refreshUser(response);
    } catch (err) {
      showToast(err.data?.message || "Failed to update user", "error");
      console.error("Failed to update user:", err);
    }
  };

  // OTP Verification Handlers
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      setOtpError("Please enter 4-digit OTP");
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
      setOtpError("Verification failed. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      await updateUser({
        id: userId,
        updatedUser: { email: formData.email },
      }).unwrap();

      showToast("New OTP sent to your email!", "success");
      startCountdown();
    } catch (err) {
      showToast("Failed to resend OTP", "error");
    } finally {
      setIsResending(false);
    }
  };

  // Provide fallback values for formData properties
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
        {/* Avatar Section */}
        <div className="relative group">
          <Avatar
            key={profileImage}
            className="w-32 h-32 border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105"
          >
            {console.log("Rendering Avatar with profileImage:", profileImage)} {/* Debug log */}
            <AvatarImage
              src={`${profileImage}?t=${Date.now()}`}
              alt="Profile"
              className="object-cover"
              onError={() => console.error("Failed to load profile image:", profileImage)}
            />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
              {safeFormData.name ? safeFormData.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>

          <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* User Info Section */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          <h3 className="text-2xl font-bold text-gray-800">{safeFormData.name || "Anonymous User"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-800">{safeFormData.email || "Not provided"}</p>
              </div>
            </div>
            {/* Phone */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-gray-800">{safeFormData.phone || "Not provided"}</p>
              </div>
            </div>
            {/* Gender */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-gray-800 capitalize">{safeFormData.gender || "Not specified"}</p>
              </div>
            </div>
            {/* Joined Date */}
            {safeFormData.created_at && (
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
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

  if (isLoading) {
    return <div className="text-center p-6">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-6 text-red-500">Error loading user data</div>;
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Your personal details</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(!isEditing)}
          className="h-8 w-8 cursor-pointer"
        >
          <Pencil className="h-4 w-4 " />
        </Button>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative group">
                <Avatar
                  key={profileImage}
                  className="w-24 h-24 border-2 border-primary/20 transition-all duration-300 group-hover:border-primary/50"
                >
                  <AvatarImage
                    src={`${profileImage}?t=${Date.now()}`}
                    alt="Profile"
                    onError={() => console.error("Failed to load profile image:", profileImage)}
                  />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {safeFormData.name ? safeFormData.name.charAt(0) : "U"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-upload"
                  className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-camera"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <h3 className="font-medium">Profile Picture</h3>
                <p className="text-sm text-gray-500">Upload a clear photo to help others recognize you</p>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("profile-upload")?.click()}
                    className="rounded-md transition-all duration-300 hover:bg-primary/5"
                    disabled={isUploading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-upload mr-2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload new image
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={safeFormData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  className="text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 border-2 border-slate-300"
                />
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={safeFormData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. your.email@example.com"
                      className="pl-10 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 border-2 border-slate-300"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={safeFormData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +91 9876543210"
                      className={`pl-10 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 border-2 border-slate-300 ${phoneError ? "border-red-500" : ""}`}
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {phoneError && (
                    <p className="text-sm text-red-500">{phoneError}</p>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={safeFormData.gender}
                    onValueChange={(value) => handleSelectChange("gender", value)}
                  >
                    <SelectTrigger id="gender" className="rounded-md transition-all duration-300 w-full border-2 border-slate-300">
                      <SelectValue placeholder="e.g. Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="e.g. New Password"
                    className={`text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 border-2 border-slate-300 ${passwordError ? "border-red-500" : ""}`}
                  />
                  {passwordError && (
                    <p className="text-sm text-red-500 mt-1">{passwordError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={safeFormData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="e.g. Confirm Password"
                      className={`text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 border-2 border-slate-300 ${confirmPasswordError ? "border-red-500" : ""}`}
                    />
                  </div>
                  {confirmPasswordError && (
                    <p className="text-sm text-red-500">{confirmPasswordError}</p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <Button
                type="button"
                onClick={handleSave}
                disabled={isUpdating || !!phoneError || !!passwordError || !!confirmPasswordError}
                className="w-full"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>

              {/* OTP Section */}
              {showOtpSection && (
                <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-4">Verify Your New Email</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    An OTP has been sent to <strong>{formData.email}</strong>
                  </p>

                  <div className="space-y-4">
                    <Input
                      placeholder="e.g. 1234"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 4));
                        setOtpError("");
                      }}
                      maxLength={4}
                      className="text-center text-2xl font-mono tracking-widest border-2 border-slate-300"
                    />
                    {otpError && <p className="text-sm text-red-600">{otpError}</p>}

                    <div className="flex gap-3">
                      <Button onClick={handleVerifyOtp} className="flex-1 bg-[#0c1f4d] hover:bg-[#0c204de7]">
                        Verify OTP
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleResendOtp}
                        disabled={isResending || countdown > 0}
                        className="flex-1"
                      >
                        {isResending ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowOtpSection(false);
                        setOtp("");
                        setCountdown(0);
                      }}
                      className="w-full"
                    >
                      Cancel Verification
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

// Parent Component
const ParentComponent = () => {
  const { user } = useContext(AuthContext);
  return <Profile userId={user?.user?._id} />;
};

export default ParentComponent;