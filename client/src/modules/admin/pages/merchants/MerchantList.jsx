import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  PlusCircle,
  RefreshCw,
  MoreVertical,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ShieldAlert,
  UserCheck,
  FileSignature,
  Lock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MerchantDetails from "./MerchantDetails";
import EditMerchantForm from "./EditMerchantModal";
import { useSidebar } from "../../hooks/useSidebar";
import showToast from "@/toast/showToast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigate, createSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Truncate = ({ text }) => {
  const rawText = text || "N/A";
  let formattedText = rawText.replace(/[-_]/g, " ");
  formattedText = formattedText.replace(/\b\w/g, (c) => c.toUpperCase());

  const isLong = formattedText.length > 15;
  const truncated = isLong ? `${formattedText.slice(0, 15)}…` : formattedText;

  return isLong ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block max-w-[10ch] truncate cursor-default">
            {truncated}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs break-words p-2 bg-gray-900 text-white">
          {formattedText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span className="inline-block max-w-[10ch] truncate">
      {formattedText}
    </span>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, merchantName }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-md bg-white shadow-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900">
            Confirm Deletion
          </DialogTitle>
        </DialogHeader>
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
          Are you sure you want to delete{" "}
          <span className="font-medium">{merchantName || "this merchant"}</span>?
          This action cannot be undone.
        </p>
        <div className="mt-4 sm:mt-6 flex justify-end gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[80px]"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-[#fd0101] hover:bg-[#ce0909] text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[80px]"
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// User Search Component
const UserSearch = ({ onUserSelect, onCancel }) => {
  const [emailQuery, setEmailQuery] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setSearchResults(null);

    if (!emailQuery.trim() && !phoneQuery.trim()) {
      setError("Please enter an email or phone number");
      return;
    }

    try {
      const params = {};
      if (emailQuery.trim()) params.query = emailQuery.trim();
      else if (phoneQuery.trim()) params.query = phoneQuery.trim();

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/merchants/lookup-merchant-creation`,
        { params }
      );

      if (
        response.data.success &&
        response.data.users?.length > 0 &&
        response.data.users[0].role?.role === "USER"
      ) {
        setSearchResults(response.data.users[0]);
      } else {
        setError("No user found with the provided details");
      }
    } catch (err) {
      setError("Error searching for user");
      console.error(err);
    }
  };

  const handleNext = () => {
    if (searchResults) {
      onUserSelect(searchResults);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4">
      <form onSubmit={handleSearch} className="mb-3 sm:mb-4">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                type="text"
                value={emailQuery}
                onChange={(e) => {
                  setEmailQuery(e.target.value);
                  if (e.target.value) setPhoneQuery("");
                }}
                placeholder="e.g. example@company.com"
                className="flex-grow border-2 border-slate-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm"
              />
            <Input
              type="text"
              value={phoneQuery}
              onChange={(e) => {
                setPhoneQuery(e.target.value);
                if (e.target.value) setEmailQuery("");
              }}
              placeholder="e.g. 1234567890"
              className="flex-grow border-2 border-slate-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#0c1f4d] hover:bg-[#153171] text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[80px]"
          >
            Search User
          </Button>
        </div>
      </form>

      {error && (
        <div className="text-red-500 mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 text-xs sm:text-sm">
          {error}
        </div>
      )}

      {searchResults && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 border border-gray-200 bg-gray-50">
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-900">
            User Details
          </h3>
          <p className="mb-1 text-xs sm:text-sm text-gray-600">
            <span className="font-medium">Name:</span>{" "}
            {searchResults.name || "N/A"}
          </p>
          <p className="mb-1 text-xs sm:text-sm text-gray-600">
            <span className="font-medium">Email:</span>{" "}
            {searchResults.email || "N/A"}
          </p>
          <p className="mb-1 text-xs sm:text-sm text-gray-600">
            <span className="font-medium">Phone:</span>{" "}
            {searchResults.phone_number || "N/A"}
          </p>
          <p className="mb-2 sm:mb-3 text-xs sm:text-sm text-gray-600">
            <span className="font-medium">Role:</span>{" "}
            {searchResults.role?.role || "N/A"}
          </p>
          <Button
            onClick={handleNext}
            className="bg-[#0c1f4d] hover:bg-[#153171] text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[80px]"
          >
            Next
          </Button>
        </div>
      )}

      <Button
        variant="outline"
        onClick={onCancel}
        className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[80px]"
      >
        Cancel
      </Button>
    </div>
  );
};

// Merchant Form Component
const MerchantForm = ({ userId, onSubmit, onCancel, merchantRefresh }) => {
  const [merchantData, setMerchantData] = useState({
    company_name: "",
    company_email: "",
    company_phone_number: "",
    company_video: "",
  });
  const [errors, setErrors] = useState({
    company_name: "",
    company_email: "",
    company_phone_number: "",
    company_video: "",
    general: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validateEmail = (email) => {
    if (!email) return { isValid: true, errorMessage: "" }; // optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, errorMessage: "Please enter a valid email" };
    }
    return { isValid: true, errorMessage: "" };
  };

  const validatePhoneNumber = (phone) => {
    const digits = phone.replace(/\D/g, "");
    if (!phone) return { isValid: false, errorMessage: "Phone number is required" };
    if (digits.length !== 10) {
      return { isValid: false, errorMessage: "Phone must be exactly 10 digits" };
    }
    return { isValid: true, errorMessage: "" };
  };

  const validateUrl = (url) => {
    if (!url) return { isValid: true, errorMessage: "" };
    const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
    if (!urlRegex.test(url)) {
      return { isValid: false, errorMessage: "Please enter a valid URL (http:// or https://)" };
    }
    return { isValid: true, errorMessage: "" };
  };

  useEffect(() => {
    const { company_name, company_email, company_phone_number, company_video } = merchantData;

    const emailValidation = validateEmail(company_email);
    const phoneValidation = validatePhoneNumber(company_phone_number);
    const videoValidation = validateUrl(company_video);

    const hasErrors =
      !company_name ||
      !emailValidation.isValid ||
      !phoneValidation.isValid ||
      !videoValidation.isValid;

    setIsValid(!hasErrors);
  }, [merchantData]);

  const handleMerchantFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "company_phone_number") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setMerchantData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
    } else {
      setMerchantData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  };

  const handleMerchantSubmit = async (e) => {
    e.preventDefault();
    setErrors({ company_name: "", company_email: "", company_phone_number: "", company_video: "", general: "" });
    setIsSubmitting(true);

    const emailValidation = validateEmail(merchantData.company_email);
    const phoneValidation = validatePhoneNumber(merchantData.company_phone_number);
    const videoValidation = validateUrl(merchantData.company_video);

    if (!merchantData.company_name) {
      setErrors((prev) => ({ ...prev, company_name: "Company name is required" }));
      setIsSubmitting(false);
      return;
    }

    if (!emailValidation.isValid) {
      setErrors((prev) => ({ ...prev, company_email: emailValidation.errorMessage }));
      setIsSubmitting(false);
      return;
    }

    if (!phoneValidation.isValid) {
      setErrors((prev) => ({ ...prev, company_phone_number: phoneValidation.errorMessage }));
      setIsSubmitting(false);
      return;
    }

    if (!videoValidation.isValid) {
      setErrors((prev) => ({ ...prev, company_video: videoValidation.errorMessage }));
      setIsSubmitting(false);
      return;
    }
    // Note: company_email is optional - skipping required check

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/merchants/create-minimal-merchant-by-userid`,
        {
          user_id: userId,
          ...merchantData,
        }
      );

      if (response.data.success) {
        showToast("Merchant created successfully", "success");
        merchantRefresh?.();
        onSubmit(response.data);
      } else {
        const errorMsg = response.data.message || "Failed to create merchant";
        merchantRefresh?.();
        setErrors((prev) => ({ ...prev, general: errorMsg }));
        showToast(errorMsg, "error");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error creating merchant";
      setErrors((prev) => ({ ...prev, general: errorMsg }));
      showToast(errorMsg, "error");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleMerchantSubmit}
      className="p-3 sm:p-4 md:p-6 border border-gray-200 bg-white"
    >
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">
        Create Merchant
      </h3>

      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          Company Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          name="company_name"
          value={merchantData.company_name}
          onChange={handleMerchantFormChange}
          className={`border-2 border-slate-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm ${errors.company_name ? "border-red-500" : ""}`}
          placeholder="e.g. Acme Corp"
        />
        {errors.company_name && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.company_name}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          Company Email <span className="text-gray-400 text-xs font-normal">(optional)</span>
        </label>
        <Input
          type="email"
          name="company_email"
          value={merchantData.company_email}
          onChange={handleMerchantFormChange}
          className={`border-2 border-slate-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm ${errors.company_email ? "border-red-500" : ""}`}
          placeholder="e.g. hello@acme.com"
        />
        {errors.company_email && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.company_email}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          Company Phone Number <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          inputMode="numeric"
          name="company_phone_number"
          value={merchantData.company_phone_number}
          onChange={handleMerchantFormChange}
          maxLength={10}
          className={`border-2 border-slate-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm ${errors.company_phone_number ? "border-red-500" : ""}`}
          placeholder="e.g. 1234567890"
        />
        {errors.company_phone_number && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">
            {errors.company_phone_number}
          </p>
        )}
        <p className="text-xs text-gray-500">Enter 10-digit phone number</p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          Company Video <span className="text-gray-400 text-xs font-normal">(optional)</span>
        </label>
        <Input
          type="text"
          name="company_video"
          value={merchantData.company_video}
          onChange={handleMerchantFormChange}
          className={`border-2 border-slate-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm ${errors.company_video ? "border-red-500" : ""}`}
          placeholder="e.g. https://youtube.com/watch?v=..."
        />
        {errors.company_video && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.company_video}</p>
        )}
      </div>

      {errors.general && (
        <div className="text-red-500 p-2 sm:p-3 bg-red-50 text-xs sm:text-sm rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errors.general}
        </div>
      )}

      <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[80px]"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`flex items-center gap-2 text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[100px] transition-all ${!isValid || isSubmitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#0c1f4d] hover:bg-[#153171] cursor-pointer"
            }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting
            </>
          ) : isValid ? (
            <>
              <Check className="w-4 h-4" />
              Submit
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </form>
  );
};

// Merchant Creation Dialog Wrapper
const MerchantCreation = ({ onClose, onSubmit, refresh }) => {
  const [selectedUserId, setSelectedUserId] = useState(null);

  return (
    <DialogContent className="w-[90vw] max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl bg-white shadow-lg p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[90vh]">
      <DialogHeader className="mb-3 sm:mb-4">
        <DialogTitle className="text-base sm:text-xl font-semibold text-gray-900">
          Add Merchant
        </DialogTitle>
      </DialogHeader>
      {!selectedUserId ? (
        <UserSearch
          onUserSelect={(user) => setSelectedUserId(user.user_id)}
          onCancel={onClose}
        />
      ) : (
        <MerchantForm
          userId={selectedUserId}
          merchantRefresh={refresh}
          onSubmit={(data) => {
            onSubmit(data);
            onClose();
          }}
          onCancel={onClose}
        />
      )}
    </DialogContent>
  );
};

// Main Merchant List Component

const MerchantList = () => {
  const { isSidebarOpen } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");
  const [merchants, setMerchants] = useState([]);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [editingMerchant, setEditingMerchant] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [merchantToDelete, setMerchantToDelete] = useState(null);
  const [togglingId, setTogglingId] = useState(null); // For account activate/deactivate loading
  const merchantsPerPage = 10;
  const detailsRef = useRef(null);
  const navigate = useNavigate();
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api/v1/merchants",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    },
  });

  const fetchMerchants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/merchants/fetch-all-merchants");
      const merchantsData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setMerchants(merchantsData);

      // Automatically sync selectedMerchant if it's currently open
      if (selectedMerchant) {
        const updatedMerchant = merchantsData.find(m => m._id === selectedMerchant._id);
        if (updatedMerchant) {
          setSelectedMerchant(updatedMerchant);
        }
      }
    } catch (error) {
      console.error("Error fetching merchants:", error);
      showToast("Failed to fetch merchants. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();

    // Real-time notifications for merchants
    const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/admin-notifications`, {
      reconnection: true,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Merchant List] Socket connected');
    });

    socket.on('new-merchant', () => {
      console.log('[Merchant List] New merchant event received, refreshing...');
      fetchMerchants();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleMarkAsRead = async (merchantId) => {
    try {
      await api.patch(`/merchants/mark-read/${merchantId}`);
      // Refresh only the specific merchant's state if possible, but for simplicity:
      fetchMerchants();
      showToast("Merchant marked as read", "success");
    } catch (err) {
      console.error("Error marking merchant as read:", err);
      showToast("Failed to mark merchant as read", "error");
    }
  };

  const handleAddMerchant = async (formData) => {
    setError(null);
    setIsAddModalOpen(false);
    // Full refresh to ensure we get accurate user_id.isActive from backend
    await fetchMerchants();
  };

  const handleDeleteMerchant = async (merchantId) => {
    setError(null);
    try {
      await api.delete(`/merchants/delete-merchant/${merchantId}`);
      setMerchants((prev) => prev.filter((merchant) => merchant._id !== merchantId));
      showToast("Merchant deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting merchant:", error);
      showToast("Failed to delete merchant. Please try again.", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setMerchantToDelete(null);
    }
  };

  const openDeleteModal = (merchant) => {
    setMerchantToDelete(merchant);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMerchantToDelete(null);
  };

  const confirmDelete = () => {
    if (merchantToDelete) {
      handleDeleteMerchant(merchantToDelete._id);
    }
  };

  const handleViewDetails = (merchant) => {
    setSelectedMerchant(merchant);
    setEditingMerchant(null);

    // Automatically mark as read when viewing details
    if (merchant.mark_as_read !== true) {
      handleMarkAsRead(merchant._id);
    }

    setTimeout(() => {
      if (detailsRef.current) {
        detailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleEditMerchant = (merchant) => {
    setSelectedMerchant(null);
    setEditingMerchant(merchant);
    // Automatically mark as read when editing
    if (merchant.mark_as_read !== true) {
      handleMarkAsRead(merchant._id);
    }

    setTimeout(() => {
      if (detailsRef.current) {
        detailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleSaveEdit = async (updatedMerchant, validationErrors = null) => {
    setError(null);

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      const errorMessages = Object.values(validationErrors)
        .filter(Boolean)
        .join("; ");
      const errorMsg = errorMessages || "Please fix the validation errors.";
      setError(errorMsg);
      showToast(errorMsg, "warning");
      return;
    }

    try {
      const payload = { ...updatedMerchant }; // or keep your merge if needed

      await api.put(`/merchants/update-merchant/${updatedMerchant._id}`, payload);

      // ── This is the key line you're missing / under-using ──
      await fetchMerchants();           // ← refresh the full list

      setEditingMerchant(null);
      showToast("Merchant updated successfully", "success");
    } catch (error) {
      console.error("Update failed:", error);
      showToast(error.response?.data?.message || "Failed to update merchant. Please try again.", "error");
    }
  };

  const closeDetails = () => setSelectedMerchant(null);
  const closeEdit = () => setEditingMerchant(null);

  const handleToggleStatus = async (merchant) => {
    const originalMerchants = [...merchants];
    const newStatus = !merchant.verified_status;

    setMerchants((prev) =>
      prev.map((m) =>
        m._id === merchant._id ? { ...m, verified_status: newStatus } : m
      )
    );

    try {
      await api.put(`/merchants/update-merchant/${merchant._id}`, {
        verified_status: newStatus,
      });

      showToast(newStatus ? "Marked as Verified" : "Marked as Unverified", newStatus ? "success" : "info");
    } catch (error) {
      console.error("Update failed:", error);
      setMerchants(originalMerchants);
      showToast("Failed to update status", "error");
    }
  };

  const handleToggle = async (userId) => {
    if (!userId || togglingId === userId) return;

    // Find the merchant in the current state to get original status
    const targetMerchant = merchants.find((m) => m.user_id?._id === userId);
    if (!targetMerchant) {
      showToast("Merchant user not found", "error");
      return;
    }

    // Use a fallback to 'false' if isActive is undefined
    const originalIsActive = targetMerchant.user_id?.isActive ?? false;
    const newIsActive = !originalIsActive;

    // 1. Optimistic Update (Immediate UI change for better UX)
    const originalMerchants = [...merchants];
    setMerchants((prev) =>
      prev.map((m) =>
        m.user_id?._id === userId
          ? { ...m, user_id: { ...m.user_id, isActive: newIsActive } }
          : m
      )
    );

    setTogglingId(userId);

    try {
      const token = sessionStorage.getItem("token");

      // Check your backend route prefix.
      // If your index.js uses app.use('/api/v1/users', ...), use this URL:
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/toggle-status/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // 2. Sync with Server (using the status returned by the backend)
        const serverStatus = res.data.isActive;
        setMerchants((prev) =>
          prev.map((m) =>
            m.user_id?._id === userId
              ? { ...m, user_id: { ...m.user_id, isActive: serverStatus } }
              : m
          )
        );
        showToast(res.data.message, "success");
      }
    } catch (error) {
      console.error("Toggle status failed:", error);
      // 3. Rollback on failure
      setMerchants(originalMerchants);
      const errorMsg = error.response?.data?.message || "Failed to update account status";
      showToast(errorMsg, "error");
    } finally {
      setTogglingId(null);
    }
  };
  const filteredMerchants = merchants.filter((merchant) =>
    [merchant.company_name, merchant.company_email, merchant.company_phone_number].some(
      (field) => field?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const indexOfLastMerchant = currentPage * merchantsPerPage;
  const indexOfFirstMerchant = indexOfLastMerchant - merchantsPerPage;
  const currentMerchants = filteredMerchants.slice(indexOfFirstMerchant, indexOfLastMerchant);
  const totalPages = Math.ceil(filteredMerchants.length / merchantsPerPage);

  const handleNextPage = () => currentPage < totalPages && setCurrentPage((prev) => prev + 1);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage((prev) => prev - 1);

  const handleViewProducts = (merchant) => {
    const email = merchant?.company_email?.trim();
    const phone = merchant?.company_phone_number?.trim();

    if (!email && !phone) {
      showToast("This merchant has no email or phone number", "error");
      return;
    }

    const params = {};
    if (email) {
      params.email = email;
    } else {
      params.phone = phone;
    }

    navigate({
      pathname: "/admin-dashboard/merchants/products",
      search: createSearchParams(params).toString(),
    });

    showToast("Loading merchant products...", "info");
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-vh-100 p-3 sm:p-4 md:p-6 text-gray-600 text-center text-xs sm:text-sm">
         <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading merchants...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-4 md:p-6 text-red-500 text-center text-xs sm:text-sm">
        {error}{" "}
        <button onClick={fetchMerchants} className="underline text-[#0c1f4d] hover:text-[#153171]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`p-3 sm:p-4 md:p-6 lg:p-8 ${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"} bg-gray-100 min-h-screen transition-all duration-300`}>

      {/* ---------------------------------------------------------------------------
            LEFT PANEL: ADMIN SOP (Standard Operating Procedures)
           --------------------------------------------------------------------------- */}
      <div className="xl:col-span-1 space-y-6 ">

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
            Merchant Protocol
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Administrative guidelines for managing vendor accounts and compliance status.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 space-y-4 mb-4 md:space-y-0">


          {/* SOP 1: Verification */}
          <Card className="border-l-4 border-l-indigo-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <FileSignature size={16} className="text-indigo-600" />
                1. KYC & Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                The <span className="font-bold">Verified Status</span> toggle grants public visibility.
                <br /><br />
                <span className="bg-red-50 text-red-700 px-1 rounded font-semibold">CRITICAL:</span> Only enable this after verifying GST, PAN, and physical address proofs.
              </p>
            </CardContent>
          </Card>

          {/* SOP 2: Governance */}
          <Card className="border-l-4 border-l-emerald-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <Lock size={16} className="text-emerald-600" />
                2. Account Governance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-1 shrink-0"></span>
                  <span><strong>Active:</strong> Merchant can login and trade.</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0"></span>
                  <span><strong>Inactive:</strong> Suspends access immediately. Use for non-compliance or payment defaults.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* SOP 3: Data Integrity */}
          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <ShieldAlert size={16} className="text-amber-600" />
                3. Data Modification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                Use <strong>Edit</strong> to correct contact details. Use <strong>Delete</strong> only for duplicate or erroneous entries.
                <br />
                <em>Note: Deletion is permanent and removes all listed products.</em>
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h1 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold">
          Merchant List
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="e.g. Acme, hello@acme.com"
            className="w-full sm:w-48 md:w-64 lg:w-72 border-2 border-slate-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2 sm:gap-3">

            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center bg-[#0c1f4d] hover:bg-[#153171] text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[100px]"
            >
              <PlusCircle className="w-4 h-4 mr-1 sm:mr-2" /> Add Merchant
            </Button>
            <Button
              onClick={fetchMerchants}
              className="flex items-center bg-[#0c1f4d] hover:bg-[#153171] text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[100px]"
            >
              <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        merchantName={merchantToDelete?.company_name}
      />

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <MerchantCreation
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddMerchant}
          refresh={fetchMerchants}
        />
      </Dialog>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-4">
        {currentMerchants.length > 0 ? (
          currentMerchants.map((merchant, index) => (
            <div key={merchant._id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  {indexOfFirstMerchant + index + 1}. {merchant.company_name || "-"}
                  {merchant.mark_as_read !== true && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                  {merchant.modifiedFields?.length > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      Modified
                    </span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <MoreVertical className="w-5 h-5 text-gray-500 hover:text-[#0c1f4d]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white shadow-lg">
                    <DropdownMenuItem onClick={() => handleViewDetails(merchant)}>
                      View Details
                    </DropdownMenuItem>
                    {merchant.mark_as_read !== true && (
                      <DropdownMenuItem onClick={() => handleMarkAsRead(merchant._id)} className="text-blue-600">
                        Mark as Read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleViewProducts(merchant)}>
                      View Products
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggle(merchant?.user_id?._id)}
                      disabled={togglingId === merchant?.user_id?._id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {togglingId === merchant?.user_id?._id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : merchant?.user_id?.isActive === true ? (
                        <>
                          <ToggleLeft className="w-4 h-4 text-red-600" />
                          Deactivate Account
                        </>
                      ) : (
                        <>
                          <ToggleRight className="w-4 h-4 text-green-600" />
                          Activate Account
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditMerchant(merchant)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDeleteModal(merchant)} className="text-red-600">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <p><span className="font-medium">Email:</span> {merchant.company_email || "-"}</p>
                <p><span className="font-medium">Phone:</span> {merchant.company_phone_number || "-"}</p>
                <p><span className="font-medium">Type:</span> {merchant?.company_type?.name || "-"}</p>
                <p><span className="font-medium">Employees:</span> {merchant.number_of_employees || "-"}</p>
                <p>
                  <span className="font-medium">Account:</span>{" "}
                  <span className={merchant?.user_id?.isActive === true ? "text-green-600" : "text-red-600"}>
                    {merchant?.user_id?.isActive === true ? "Active" : "Inactive"}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-medium">Verified Status:</span>
                  <Switch
                    checked={merchant.verified_status}
                    onCheckedChange={() => handleToggleStatus(merchant)}
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600"
                    thumbIcon={
                      merchant.verified_status ? (
                        <ToggleRight className="h-4 w-4 text-white" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-white" />
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-xs text-gray-600">No merchants found</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto bg-white border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#0c1f4d] border-b hover:bg-[#153171] border-gray-300">
              <TableHead className="w-[60px] sm:w-[80px] text-xs sm:text-sm font-medium text-white">S.No</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">Company Name</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">Email</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">Phone</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">Type</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">Account Status</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">Verified Status</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">Employees</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentMerchants.length > 0 ? (
              currentMerchants.map((merchant, index) => (
                <TableRow key={merchant._id} className="hover:bg-gray-50">
                  <TableCell className="text-xs sm:text-sm text-gray-600">
                    {indexOfFirstMerchant + index + 1}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm text-gray-900 font-medium">
                    <div className="flex items-center gap-2">
                      <Truncate text={merchant.company_name || "-"} />
                      {merchant.mark_as_read !== true && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                          New
                        </span>
                      )}
                      {merchant.modifiedFields?.length > 0 && (
                        <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          Modified
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm text-gray-600">{merchant.company_email || "-"}</TableCell>
                  <TableCell className="text-xs sm:text-sm text-gray-600">{merchant.company_phone_number || "-"}</TableCell>
                  <TableCell className="text-xs sm:text-sm text-gray-600">
                    {merchant.company_type?.name || merchant.company_type || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${merchant?.user_id?.isActive === true ? "bg-green-500" : "bg-red-500"
                          }`}
                      />
                      <span className={`text-xs font-medium ${merchant?.user_id?.isActive === true ? "text-green-700" : "text-red-700"
                        }`}>
                        {merchant?.user_id?.isActive === true ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={merchant.verified_status}
                      onCheckedChange={() => handleToggleStatus(merchant)}
                      className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600"
                      thumbIcon={
                        merchant.verified_status ? (
                          <ToggleRight className="h-4 w-4 text-white" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-white" />
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm text-gray-600">
                    {merchant.number_of_employees || "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      {/* ✅ FIX 1: asChild + real button */}
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="focus:outline-none focus:ring-0"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500 hover:text-[#0c1f4d]" />
                        </button>
                      </DropdownMenuTrigger>

                      {/* ✅ FIX 2: prevent broken focus restore */}
                      <DropdownMenuContent
                        className="bg-white shadow-lg"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        <DropdownMenuItem onClick={() => handleViewDetails(merchant)}>
                          View Details
                        </DropdownMenuItem>
                        {merchant.mark_as_read !== true && (
                          <DropdownMenuItem onClick={() => handleMarkAsRead(merchant._id)} className="text-blue-600">
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleViewProducts(merchant)}>
                          View Products
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleToggle(merchant?.user_id?._id)}
                          disabled={togglingId === merchant?.user_id?._id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {togglingId === merchant?.user_id?._id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating...
                            </>
                          ) : merchant?.user_id?.isActive ? (
                            <>
                              <ToggleLeft className="w-4 h-4 text-red-600" />
                              Deactivate Account
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-4 h-4 text-green-600" />
                              Activate Account
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleEditMerchant(merchant)}>
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => openDeleteModal(merchant)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4 text-xs sm:text-sm text-gray-600">
                  No merchants found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredMerchants.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 sm:mt-4 gap-3 sm:gap-4">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 min-w-[40px] sm:min-w-[80px]"
          >
            <span className="sm:hidden"><ChevronLeft className="w-4 h-4" /></span>
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="text-xs sm:text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 min-w-[40px] sm:min-w-[80px]"
          >
            <span className="sm:hidden"><ChevronRight className="w-4 h-4" /></span>
            <span className="hidden sm:inline">Next</span>
          </Button>
        </div>
      )}

      {selectedMerchant && (
        <div ref={detailsRef} className="mt-4 sm:mt-6">
          <MerchantDetails 
            merchant={selectedMerchant} 
            open={!!selectedMerchant} 
            onClose={closeDetails} 
            onRefresh={fetchMerchants} 
          />
        </div>
      )}

      {editingMerchant && (
        <div className="mt-4 sm:mt-6" ref={detailsRef}>
          <EditMerchantForm
            key={editingMerchant._id}
            merchant={editingMerchant}
            onSave={handleSaveEdit}
            open={!!editingMerchant}
            onClose={closeEdit}
          />
        </div>
      )}
    </div>
  );
};

export default MerchantList;
