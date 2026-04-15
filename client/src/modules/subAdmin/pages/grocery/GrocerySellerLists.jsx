import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from "@/components/ui/switch";
import {
  MoreVertical,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ToggleLeft,
  ToggleRight,
  FileEdit, UserX, BadgeCheck, Eye
} from "lucide-react";
import { io } from "socket.io-client";
import MultiStepModalGrocery from "./MultiStepModalGrocery";
import SellerDetailsModal from "./SellerDetailsModal";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import showToast from "@/toast/showToast";
import { validatePhoneNumber } from "@/modules/validation/phoneValidation";
import { validateEmail } from "@/modules/validation/emailvalidation";
import { validateGST } from "@/modules/validation/gstValidation";
import { validateMSME } from "@/modules/validation/msmeValidation";
import { validatePAN } from "@/modules/validation/panValidation";
import { validateAadhar } from "@/modules/validation/aadharValidation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs break-words p-2 bg-gray-900 text-white"
        >
          {formattedText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span className="inline-block max-w-[10ch] truncate">{formattedText}</span>
  );
};

function GrocerySellerList() {
  const { user } = useContext(AuthContext);
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    shop_name: "",
    shop_email: "",
    shop_phone_number: "",
    msme_certificate_number: "",
    gst_number: "",
    pan: "",
    aadhar: "",
    company_logo: "",
    company_images: [],
    verified_status: false,
  });
  const [validationErrors, setValidationErrors] = useState({
    shop_name: "",
    shop_email: "",
    shop_phone_number: "",
    msme_certificate_number: "",
    gst_number: "",
    pan: "",
    aadhar: "",
    company_logo: "",
    company_images: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [companyImageFiles, setCompanyImageFiles] = useState([]);
  const [memberTypes, setMemberTypes] = useState([]);
  const [togglingId, setTogglingId] = useState(null);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);

  const itemsPerPage = 10;

  const userId = user?.user?._id;
  const {
    data: currentUser,
    isError: isUserError,
    error: userError,
  } = useGetUserByIdQuery(userId, { skip: !userId });

  const currentPagePath = "grocery-sellers";
  const pagePermissions = currentUser?.approved_permissions?.find(
    (p) => p.page === currentPagePath
  );
  const canEdit = pagePermissions?.actions?.includes("edit") || false;
  const canDelete = pagePermissions?.actions?.includes("delete") || false;

  const fetchMemberTypes = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/base-member-types/fetch-all-base-member-types`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setMemberTypes(res.data.data);
      }
    } catch (err) {
      showToast("Failed to load member types", "error");
    }
  };

  useEffect(() => {
    fetchMemberTypes();
  }, []);

  const handleMarkAsRead = async (sellerId) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/grocery-sellers/mark-read/${sellerId}`, {}, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      fetchSellers();
    } catch (err) {
      console.error("Error marking grocery seller as read:", err);
    }
  };

  const fetchSellers = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/grocery-sellers/fetch-all-grocery-seller`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const sellerData = Array.isArray(response.data.data) ? response.data.data : [];
      // Sort newest first
      const sortedData = [...sellerData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSellers(sortedData);
      setFilteredSellers(sortedData);

      // Automatically sync selectedSeller if it's currently open
      if (selectedSeller) {
        const updatedSeller = sortedData.find(s => s._id === selectedSeller._id);
        if (updatedSeller) {
          setSelectedSeller(updatedSeller);
        }
      }
      setLoading(false);
    } catch (err) {
      showToast(err.message || "Failed to fetch sellers", "error");
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Real-time notifications
    const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/admin-notifications`, {
      reconnection: true,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Grocery Sellers] Socket connected');
    });

    socket.on('new-grocery-seller', () => {
      console.log('[Grocery Sellers] New grocery seller event received, refreshing...');
      fetchSellers();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isUserError) {
      showToast(userError?.data?.message || "Failed to load user permissions", "error");
      setError("Failed to load user permissions");
    }
  }, [isUserError, userError]);

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    if (!Array.isArray(sellers)) {
      setFilteredSellers([]);
      return;
    }

    const filtered = sellers.filter((seller) => {
      const shopName = seller.shop_name || "";
      const shopEmail = seller.shop_email || "";
      const shopPhone = seller.shop_phone_number || "";
      const searchLower = searchTerm.toLowerCase();

      return (
        shopName.toLowerCase().includes(searchLower) ||
        shopEmail.toLowerCase().includes(searchLower) ||
        shopPhone.includes(searchLower)
      );
    });

    setFilteredSellers(filtered);
    setCurrentPage(1);
  }, [searchTerm, sellers]);

  const handleToggleVerified = async (sellerId, currentStatus) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/grocery-sellers/update-grocery-seller/${sellerId}`,
        { verified_status: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedSeller = response.data.data;
      setSellers((prev) =>
        prev.map((seller) => (seller._id === updatedSeller._id ? updatedSeller : seller))
      );
      setFilteredSellers((prev) =>
        prev.map((seller) => (seller._id === updatedSeller._id ? updatedSeller : seller))
      );
      showToast(
        `Seller ${updatedSeller.verified_status ? "verified" : "unverified"} successfully`,
        "success"
      );
    } catch (err) {
      showToast(err.message || "Failed to update verification status", "error");
    }
  };

  const handleToggle = async (userId) => {
    if (!userId) {
      showToast("User ID not found for this seller", "error");
      return;
    }

    setTogglingId(userId);

    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/toggle-status/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newActiveStatus = res.data.isActive;

      const updateSellerStatus = (seller) =>
        seller?.user_id?._id === userId
          ? {
            ...seller,
            user_id: {
              ...seller.user_id,
              isActive: newActiveStatus,
            },
          }
          : seller;

      setSellers((prev) => prev.map(updateSellerStatus));
      setFilteredSellers((prev) => prev.map(updateSellerStatus));

      showToast(
        `Account ${newActiveStatus ? "activated" : "deactivated"} successfully`,
        "success"
      );
    } catch (err) {
      console.error("Toggle status error:", err);
      showToast(err.response?.data?.message || "Failed to update account status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/grocery-sellers/delete-grocery-seller/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSellers((prev) => prev.filter((seller) => seller._id !== id));
      setFilteredSellers((prev) => prev.filter((seller) => seller._id !== id));
      setShowConfirmDialog(false);
      setSellerToDelete(null);
      showToast("Seller deleted successfully", "success");
    } catch (err) {
      showToast(err.message || "Failed to delete seller", "error");
    }
  };

  const confirmDelete = (id) => {
    setSellerToDelete(id);
    setShowConfirmDialog(true);
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setSellerToDelete(null);
  };

  const viewDetails = (seller) => {
    setSelectedSeller(seller);
    setIsEditFormOpen(false);
    setIsSellerModalOpen(true);

    // Automatically mark as read when viewing details
    if (seller.markAsRead !== true) {
      handleMarkAsRead(seller._id);
    }
  };

  const handleEditClick = (seller) => {
    setEditFormData({
      shop_name: seller.shop_name || "",
      shop_email: seller.shop_email || "",
      shop_phone_number: seller.shop_phone_number || "",
      msme_certificate_number: seller.msme_certificate_number || "",
      gst_number: seller.gst_number || "",
      pan: seller.pan || "",
      aadhar: seller.aadhar || "",
      company_logo: seller.company_logo || "",
      company_images: Array.isArray(seller.company_images) ? seller.company_images : [],
      verified_status: seller.verified_status || false,
      member_type: seller.member_type?._id || seller.member_type || '', // ✅ Ported from Admin
    });
    setValidationErrors({
      shop_name: "",
      shop_email: "",
      shop_phone_number: "",
      msme_certificate_number: "",
      gst_number: "",
      pan: "",
      aadhar: "",
      company_logo: "",
      company_images: "",
    });
    setLogoFile(null);
    setCompanyImageFiles([]);
    setSelectedSeller(seller);
    setIsEditFormOpen(true);
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "Please upload a valid image file",
      }));
      return;
    }

    if (field === "company_logo") {
      setLogoFile(file);
      setValidationErrors((prev) => ({ ...prev, company_logo: "" }));
    } else if (field === "company_images") {
      setCompanyImageFiles((prev) => [...prev, file]);
      setValidationErrors((prev) => ({ ...prev, company_images: "" }));
    }
  };

  const handleDeleteImage = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      company_images: prev.company_images.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteNewImage = (index) => {
    setCompanyImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteLogo = () => {
    setEditFormData((prev) => ({ ...prev, company_logo: "" }));
    setLogoFile(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    let error = "";
    if (name === "shop_name") error = value ? "" : "Shop name is required";
    else if (name === "shop_email")
      error = value
        ? validateEmail(value).isValid
          ? ""
          : validateEmail(value).errorMessage
        : "";
    else if (name === "shop_phone_number")
      error = value
        ? validatePhoneNumber(value).isValid
          ? ""
          : validatePhoneNumber(value).errorMessage
        : "Phone number is required";
    else if (name === "msme_certificate_number" && value)
      error = validateMSME(value).isValid ? "" : validateMSME(value).errorMessage;
    else if (name === "gst_number" && value)
      error = validateGST(value).isValid ? "" : validateGST(value).errorMessage;
    else if (name === "pan" && value)
      error = validatePAN(value).isValid ? "" : validatePAN(value).errorMessage;
    else if (name === "aadhar" && value)
      error = validateAadhar(value).isValid ? "" : validateAadhar(value).errorMessage;

    setValidationErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const errors = {
      shop_name: editFormData.shop_name ? "" : "Shop name is required",
      shop_email: editFormData.shop_email
        ? validateEmail(editFormData.shop_email).isValid
          ? ""
          : validateEmail(editFormData.shop_email).errorMessage
        : "",
      shop_phone_number: editFormData.shop_phone_number
        ? validatePhoneNumber(editFormData.shop_phone_number).isValid
          ? ""
          : validatePhoneNumber(editFormData.shop_phone_number).errorMessage
        : "Phone number is required",
      msme_certificate_number: editFormData.msme_certificate_number
        ? validateMSME(editFormData.msme_certificate_number).isValid
          ? ""
          : validateMSME(editFormData.msme_certificate_number).errorMessage
        : "",
      gst_number: editFormData.gst_number
        ? validateGST(editFormData.gst_number).isValid
          ? ""
          : validateGST(editFormData.gst_number).errorMessage
        : "",
      pan: editFormData.pan
        ? validatePAN(editFormData.pan).isValid
          ? ""
          : validatePAN(editFormData.pan).errorMessage
        : "",
      aadhar: editFormData.aadhar
        ? validateAadhar(editFormData.aadhar).isValid
          ? ""
          : validateAadhar(editFormData.aadhar).errorMessage
        : "",
      company_logo: "",
      company_images: "",
    };

    if (Object.values(errors).some((err) => err !== "")) {
      setValidationErrors(errors);
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");

      let logoUrl = editFormData.company_logo;
      let companyImages = [...editFormData.company_images];

      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        formData.append("shop_name", editFormData.shop_name);

        const logoEndpoint = editFormData.company_logo
          ? `${import.meta.env.VITE_API_IMAGE_URL}/grocery-seller-images/update-logo`
          : `${import.meta.env.VITE_API_IMAGE_URL}/grocery-seller-images/upload-logo`;

        const logoResponse = await axios.post(logoEndpoint, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        logoUrl = logoResponse.data.logoUrl;
      }

      if (companyImageFiles.length > 0) {
        const formData = new FormData();
        companyImageFiles.forEach((file) => formData.append("files", file));
        formData.append("entity_type", "grocery-seller");
        formData.append("shop_name", editFormData.shop_name);

        const imageResponse = await axios.post(
          `${import.meta.env.VITE_API_IMAGE_URL}/grocery-seller-images/upload-company-image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        companyImages = [...companyImages, ...imageResponse.data.files.map((f) => f.fileUrl)];
      }

      const payload = {
        ...editFormData,
        company_logo: logoUrl,
        company_images: companyImages,
      };

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/grocery-sellers/update-grocery-seller/${selectedSeller._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedSeller = response.data.data;
      setSellers((prev) =>
        prev.map((s) => (s._id === updatedSeller._id ? updatedSeller : s))
      );
      setFilteredSellers((prev) =>
        prev.map((s) => (s._id === updatedSeller._id ? updatedSeller : s))
      );

      setIsEditFormOpen(false);
      setSelectedSeller(null);
      setLogoFile(null);
      setCompanyImageFiles([]);
      setValidationErrors({});
      showToast("Seller updated successfully", "success");
    } catch (err) {
      showToast(err.message || "Failed to update seller", "error");
    }
  };

  const handleEditCancel = () => {
    setIsEditFormOpen(false);
    setSelectedSeller(null);
    setLogoFile(null);
    setCompanyImageFiles([]);
    setEditFormData({
      shop_name: "",
      shop_email: "",
      shop_phone_number: "",
      msme_certificate_number: "",
      gst_number: "",
      pan: "",
      aadhar: "",
      company_logo: "",
      company_images: [],
      member_type: "",
      verified_status: false,
    });
    setValidationErrors({});
  };

  const handleRefresh = async () => {
    setLoading(true);
    setSearchTerm("");
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/grocery-sellers/fetch-all-grocery-seller`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const sellerData = Array.isArray(response.data.data) ? response.data.data : [];
      setSellers(sellerData);
      setFilteredSellers(sellerData);
      setCurrentPage(1);
      setLoading(false);
      showToast("Sellers refreshed successfully", "success");
    } catch (err) {
      showToast(err.message || "Failed to refresh sellers", "error");
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSellers = filteredSellers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-600 text-sm">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500 text-sm">
        Error: {error}{" "}
        <button
          onClick={handleRefresh}
          className="underline text-gray-900 cursor-pointer hover:text-gray-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="lg:p-4">
      <h2 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold">
        Grocery Sellers List
      </h2>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mb-6">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full sm:w-64 rounded-md border-gray-300 focus:ring-2 focus:ring-gray-900 text-sm"
        />
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center bg-[#0c1f4d] cursor-pointer hover:bg-[#0c204ddc] text-white rounded-md text-sm px-4 py-2"
          >
            Add Grocery Seller
          </Button>
          <Button
            onClick={handleRefresh}
            className="flex items-center bg-[#0c1f4d] cursor-pointer hover:bg-[#0c204ddc] text-white rounded-md text-sm px-4 py-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      <div className="xl:col-span-1">

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
            Seller Protocol
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Guidelines for managing Grocery & Base Member accounts.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 space-y-4 mb-4 md:space-y-0">

          {/* SOP 1: Verification */}
          <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <BadgeCheck size={16} className="text-emerald-600" />
                1. Shop Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                The <span className="font-bold">Verified Switch</span> confirms a physical presence.
                <br /><br />
                Ensure the <span className="font-semibold">Shop Name</span> and address match provided documents (e.g., FSSAI, Shop Act) before enabling.
              </p>
            </CardContent>
          </Card>

          {/* SOP 2: Access Control */}
          <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <UserX size={16} className="text-amber-600" />
                2. Access Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                  <span><strong>Active:</strong> Shop is live and can receive orders.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                  <span><strong>Inactive:</strong> Use for temporary suspension due to disputes or non-payment.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* SOP 3: Data Hygiene */}
          <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <FileEdit size={16} className="text-blue-600" />
                3. Record Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                Use <strong>Edit</strong> to correct contact details (Email/Phone).
                <br />
                Use <strong>Delete</strong> only for duplicate entries. Deleting a Base Member removes all their localized requirements.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {currentSellers.length > 0 ? (
          currentSellers.map((seller, index) => (
            <Card key={seller._id} className="border rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Truncate text={seller.shop_name || "N/A"} />
                    {seller.markAsRead !== true && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                        New
                      </span>
                    )}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreVertical className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white shadow-lg">
                      <DropdownMenuItem
                        onClick={() => viewDetails(seller)}
                        className="text-sm text-gray-700 hover:bg-gray-100"
                      >
                        View More Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggle(seller?.user_id?._id)}
                        disabled={togglingId === seller?.user_id?._id}
                        className={`px-4 py-2 rounded-lg font-medium text-white cursor-pointer transition-all duration-300 shadow-md
                          ${seller?.user_id?.isActive
                            ? "text-green-500"
                            : "text-red-500"}
                          ${togglingId === seller?.user_id?._id ? "opacity-70 cursor-not-allowed" : "hover:shadow-lg transform hover:scale-105"}`}
                      >
                        {togglingId === seller?.user_id?._id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : seller?.user_id?.isActive ? (
                          <>
                            <ToggleLeft className="w-4 h-4 text-red" />
                            Deactivate Account
                          </>
                        ) : (
                          <>
                            <ToggleRight className="w-4 h-4 text-green" />
                            Activate Account
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditClick(seller)}
                        className="text-sm text-gray-700 hover:bg-gray-100"
                        disabled={!canEdit}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => confirmDelete(seller._id)}
                        className="text-sm text-red-600 hover:bg-red-50"
                        disabled={!canDelete}
                      >
                        Delete
                      </DropdownMenuItem>
                      {seller.markAsRead !== true && (
                        <DropdownMenuItem
                          onClick={() => handleMarkAsRead(seller._id)}
                          className="text-blue-600 font-medium"
                        >
                          Mark as Read
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">S.No:</span> {indexOfFirstItem + index + 1}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Shop Email:</span> {seller.shop_email || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Shop Phone:</span>{" "}
                    {seller.shop_phone_number || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="font-medium">Verified:</span>
                    <Switch
                      checked={seller.verified_status}
                      onCheckedChange={() => handleToggleVerified(seller._id, seller.verified_status)}
                      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                    />
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="font-medium">Account Status:</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${seller?.user_id?.isActive ? "bg-green-500" : "bg-red-500"
                          }`}
                      />
                      <span
                        className={`text-xs font-medium ${seller?.user_id?.isActive ? "text-green-700" : "text-red-700"
                          }`}
                      >
                        {seller?.user_id?.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-600 text-sm">No sellers found</p>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <Table className="w-full table-fixed min-w-[1000px]">
            <TableHeader className="bg-[#0c1f4d]">
              <TableRow>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[60px]">S.No</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[120px]">Owner Name</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[200px]">Shop Name</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[200px]">Shop Phone Number</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[200px]">Member Type</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[120px]">Account Status</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[100px]">Verified Status</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[90px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSellers.length > 0 ? (
                currentSellers.map((seller, index) => (
                  <TableRow key={seller._id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-600">
                      {indexOfFirstItem + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-600">
                      {seller?.user_id?.name || 'unknown'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-600 w-[200px] truncate">
                      <div className="flex items-center flex-wrap gap-2 justify-center">
                        <Truncate text={seller.shop_name || "N/A"} />
                        {seller.markAsRead !== true && (
                          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                            New
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-600 truncate">
                      {seller.shop_phone_number || "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-600">
                      {seller.member_type?.name ? seller.member_type.name.replace(/_/g, ' ') : "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center w-[120px]">
                      <div className="flex items-center gap-2 justify-center">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${seller?.user_id?.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                        />
                        <span
                          className={`text-xs sm:text-sm font-medium ${seller?.user_id?.isActive ? "text-green-700" : "text-red-700"
                            }`}
                        >
                          {seller?.user_id?.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Switch
                        checked={seller.verified_status}
                        onCheckedChange={() => handleToggleVerified(seller._id, seller.verified_status)}
                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 mx-auto"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center w-[90px]">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <MoreVertical className="h-5 w-5 text-gray-500 hover:text-gray-700 mx-auto" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white shadow-lg">
                          <DropdownMenuItem
                            onClick={() => viewDetails(seller)}
                            className="text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                          >
                            View More Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggle(seller?.user_id?._id)}
                            disabled={togglingId === seller?.user_id?._id}
                            className={`px-4 py-2 rounded-lg font-medium text-white cursor-pointer transition-all duration-300 shadow-md
                              ${seller?.user_id?.isActive
                                ? "text-red-500"
                                : "text-green-500"}
                              ${togglingId === seller?.user_id?._id ? "opacity-70 cursor-not-allowed" : "hover:shadow-lg transform hover:scale-105"}`}
                          >
                            {togglingId === seller?.user_id?._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                Updating...
                              </>
                            ) : seller?.user_id?.isActive ? (
                              <>
                                <ToggleLeft className="w-4 h-4 text-green" />
                                Deactivate Account
                              </>
                            ) : (
                              <>
                                <ToggleRight className="w-4 h-4 text-red" />
                                Activate Account
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(seller)}
                            className="text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                            disabled={!canEdit}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => confirmDelete(seller._id)}
                            className="text-xs sm:text-sm text-red-600 hover:bg-red-50"
                            disabled={!canDelete}
                          >
                            Delete
                          </DropdownMenuItem>
                          {seller.markAsRead !== true && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsRead(seller._id)}
                              className="text-blue-600 font-medium"
                            >
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-3 text-center text-sm text-gray-600">
                    No sellers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination with better feedback */}
      {filteredSellers.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="text-center text-sm text-gray-600">
            Showing <strong>{indexOfFirstItem + 1}</strong>–
            <strong>{Math.min(indexOfLastItem, filteredSellers.length)}</strong> of{" "}
            <strong>{filteredSellers.length}</strong> sellers
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
              className="bg-white border cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md p-2 min-w-[40px]"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || loading}
              className="bg-white border cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md p-2 min-w-[40px]"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent
          className="p-0 overflow-hidden bg-white rounded-xl overflow-y-scroll shadow-2xl"
          style={{ width: "80vw", maxWidth: "80vw", height: "80vh", maxHeight: "80vh" }}
        >
          <DialogHeader className="px-6 sticky top-0 z-10 py-5 bg-gradient-to-r from-[#0c1f4d] to-[#153171] text-white">
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              Edit Grocery Seller
              <button
                onClick={() => setIsEditFormOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-6">
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="shop_name"
                    value={editFormData.shop_name}
                    onChange={handleEditFormChange}
                    required
                    className={`text-sm ${validationErrors.shop_name ? "border-red-500" : ""}`}
                    placeholder="Enter shop name"
                  />
                  {validationErrors.shop_name && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.shop_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Shop Email
                  </label>
                  <Input
                    type="email"
                    name="shop_email"
                    value={editFormData.shop_email}
                    onChange={handleEditFormChange}
                    className={`text-sm ${validationErrors.shop_email ? "border-red-500" : ""}`}
                    placeholder="Enter shop email (optional)"
                  />
                  {validationErrors.shop_email && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.shop_email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Shop Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="shop_phone_number"
                    value={editFormData.shop_phone_number}
                    onChange={handleEditFormChange}
                    required
                    className={`text-sm ${validationErrors.shop_phone_number ? "border-red-500" : ""}`}
                    placeholder="+91 98765 43210"
                  />
                  {validationErrors.shop_phone_number && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.shop_phone_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    MSME Certificate Number
                  </label>
                  <Input
                    type="text"
                    name="msme_certificate_number"
                    value={editFormData.msme_certificate_number}
                    onChange={handleEditFormChange}
                    className="text-sm"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">GST Number</label>
                  <Input
                    type="text"
                    name="gst_number"
                    value={editFormData.gst_number}
                    onChange={handleEditFormChange}
                    className="text-sm"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">PAN</label>
                  <Input
                    type="text"
                    name="pan"
                    value={editFormData.pan}
                    onChange={handleEditFormChange}
                    className="text-sm"
                    placeholder="ABCDE1234F"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhar</label>
                  <Input
                    type="text"
                    name="aadhar"
                    value={editFormData.aadhar}
                    onChange={handleEditFormChange}
                    className="text-sm"
                    placeholder="1234 5678 9012"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Logo</label>
                  <div className="flex flex-wrap gap-4 mb-2">
                    {editFormData.company_logo && (
                      <div className="relative inline-block group">
                        <img src={editFormData.company_logo} alt="Current Logo" className="h-28 w-28 object-cover rounded-lg border-2 border-gray-200" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                          <p className="text-white text-[10px] font-bold">CURRENT LOGO</p>
                        </div>
                        <button type="button" onClick={handleDeleteLogo} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 shadow-lg transition-transform hover:scale-110 z-10"><X className="h-4 w-4" /></button>
                      </div>
                    )}
                    {logoFile && (
                      <div className="relative inline-block group">
                        <img src={URL.createObjectURL(logoFile)} alt="New Logo Preview" className="h-28 w-28 object-cover rounded-lg border-2 border-[#153171]" />
                        <div className="absolute inset-0 bg-[#153171]/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                          <p className="text-white text-[10px] font-bold">NEW LOGO</p>
                        </div>
                        <button type="button" onClick={() => setLogoFile(null)} className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-1.5 hover:bg-amber-600 shadow-lg transition-transform hover:scale-110 z-10"><X className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "company_logo")}
                    className="mt-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#0c1f4d] file:text-white hover:file:bg-[#153171]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Images</label>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {/* Existing Images */}
                    {editFormData.company_images.map((image, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <img src={image} alt={`Existing Img ${index}`} className="h-28 w-28 object-cover rounded-lg border-2 border-gray-200 shadow-md" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                          <p className="text-white text-[10px] font-bold uppercase">Stored Image</p>
                        </div>
                        <button type="button" onClick={() => handleDeleteImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 shadow-lg transition-transform hover:scale-110 z-10"><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                    {/* New Previews */}
                    {companyImageFiles.map((file, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <img src={URL.createObjectURL(file)} alt={`New Img ${index}`} className="h-28 w-28 object-cover rounded-lg border-2 border-[#153171]" />
                        <div className="absolute inset-0 bg-[#153171]/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                          <p className="text-white text-[10px] font-bold uppercase">New Upload</p>
                        </div>
                        <button type="button" onClick={() => handleDeleteNewImage(index)} className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-1.5 hover:bg-amber-600 shadow-lg transition-transform hover:scale-110 z-10"><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, "company_images")}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#0c1f4d] file:text-white hover:file:bg-[#153171]"
                  />
                  <p className="mt-2 text-xs text-slate-500 italic font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#153171]"></span>
                    Newly added images will have a blue border and amber 'X' button until saved.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Member Type
                  </label>

                  <select
                    name="member_type"
                    value={editFormData.member_type}
                    onChange={handleEditFormChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select Member Type</option>

                    {memberTypes.map((type) => (
                      <option key={type._id} value={type._id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </ScrollArea>

          <DialogFooter className="px-6 py-5 bg-gray-50 border-t flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleEditCancel}
              className="px-6 py-2.5 text-sm font-medium border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              className="px-8 py-2.5 text-sm font-medium bg-[#0c1f4d] hover:bg-[#153171] text-white rounded-md shadow-md"
            >
              Update Seller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SellerDetailsModal
        seller={selectedSeller}
        open={isSellerModalOpen}
        onClose={() => setIsSellerModalOpen(false)}
        onRefresh={fetchSellers}
      />

      {/* Delete Confirmation */}
      {showConfirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Confirm Deletion</h3>
            <p className="mb-4 text-gray-600 text-sm">
              Are you sure you want to delete this seller? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={cancelDelete}
                variant="outline"
                className="px-5 py-2 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(sellerToDelete)}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-sm"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <MultiStepModalGrocery
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

export default GrocerySellerList;
