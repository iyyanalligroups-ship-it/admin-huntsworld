import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, ToggleLeft, ToggleRight, FileEdit, UserX, BadgeCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MoreVertical, RefreshCw, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import MultiStepModalGrocery from './MultiStepModalGrocery';
import SellerDetails from './SellerDetails';
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import showToast from '@/toast/showToast';
import { validatePhoneNumber } from '@/modules/validation/phoneValidation';
import { validateEmail } from '@/modules/validation/emailvalidation';
import { validateGST } from '@/modules/validation/gstValidation';
import { validateMSME } from '@/modules/validation/msmeValidation';
import { validatePAN } from '@/modules/validation/panValidation';
import { validateAadhar } from '@/modules/validation/aadharValidation';
import SellerDetailsModal from './SellerDetailsModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

function GrocerySellerList() {
  const { user } = useContext(AuthContext);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    shop_name: '',
    shop_email: '',
    shop_phone_number: '',
    msme_certificate_number: '',
    gst_number: '',
    pan: '',
    aadhar: '',
    company_logo: '',
    company_images: [],
    member_type: '',
    verified_status: false,
  });
  const [validationErrors, setValidationErrors] = useState({
    shop_name: '',
    shop_email: '',
    shop_phone_number: '',
    msme_certificate_number: '',
    gst_number: '',
    pan: '',
    aadhar: '',
    company_logo: '',
    company_images: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [companyImageFiles, setCompanyImageFiles] = useState([]);
  const [memberTypes, setMemberTypes] = useState([]);
  const sellerDetailsRef = useRef(null);
  const editFormRef = useRef(null);
  const [sellers, setSellers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10; // or whatever you use
  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  useEffect(() => {
    if (isUserError) {
      handleRefresh(userError?.data?.message || "Failed to load user permissions", 'error');
      setError("Failed to load user permissions");
    }
  }, [currentUser, isUserError, userError]);


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

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Authentication token missing');

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/grocery-sellers/fetch-all-grocery-seller`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm.trim() || undefined,
          },
        }
      );

      const sellerData = res.data.data || [];
      setSellers(sellerData);
      setTotalPages(res.data.pagination.totalPages || 1);
      setTotalRecords(res.data.pagination.totalRecords || 0);

      // Automatically sync selectedSeller if it's currently open
      if (selectedSeller) {
        const updatedSeller = sellerData.find(s => s._id === selectedSeller._id);
        if (updatedSeller) {
          setSelectedSeller(updatedSeller);
        }
      }

    } catch (err) {
      showToast(err.message || 'Failed to fetch sellers', 'error');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const timer = setTimeout(fetchSellers, searchTerm ? 350 : 0);

    // Real-time notifications for grocery sellers
    const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/admin-notifications`, {
      reconnection: true,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Grocery Seller List] Socket connected');
    });

    socket.on('new-grocery', () => {
      console.log('[Grocery Seller List] New grocery seller event received, refreshing...');
      fetchSellers();
    });

    return () => {
      clearTimeout(timer);
      socket.disconnect();
    };
  }, [currentPage, searchTerm, itemsPerPage]);

  const handleMarkAsRead = async (sellerId) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.patch(`${import.meta.env.VITE_API_URL}/grocery-sellers/mark-read/${sellerId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSellers();
    } catch (err) {
      console.error("Error marking grocery seller as read:", err);
    }
  };

  // FIXED: Derived state using useMemo instead of separate state
  const filteredSellers = useMemo(() => {
    if (!Array.isArray(sellers)) return [];

    return sellers.filter(seller => {
      const shopName = seller.shop_name || '';
      const shopEmail = seller.shop_email || '';
      const shopPhone = seller.shop_phone_number || '';
      const searchLower = searchTerm.toLowerCase();

      return (
        shopName.toLowerCase().includes(searchLower) ||
        shopEmail.toLowerCase().includes(searchLower) ||
        shopPhone.includes(searchLower)
      );
    });
  }, [sellers, searchTerm]);

  // Only reset page if the search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleToggleVerified = async (sellerId, currentStatus) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");

      await axios.put(
        `${import.meta.env.VITE_API_URL}/grocery-sellers/update-grocery-seller/${sellerId}`,
        { verified_status: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast(
        `Seller ${!currentStatus ? 'verified' : 'unverified'} successfully`,
        'success'
      );

      // ✅ Refetch fresh data from DB
      fetchSellers();

    } catch (err) {
      showToast(err.message || "Failed to update verification status", 'error');
    }
  };


  const handleDelete = async (id) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_URL}/grocery-sellers/delete-grocery-seller/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update main sellers list; filteredSellers updates automatically via useMemo
      setSellers(sellers.filter(seller => seller._id !== id));

      setShowConfirmDialog(false);
      setSellerToDelete(null);
      showToast("Seller deleted successfully", 'success');
    } catch (err) {
      showToast(err.message || "Failed to delete seller", 'error');
      setError(err.message);
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

    setTimeout(() => {
      if (sellerDetailsRef.current) {
        sellerDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleEditClick = (seller) => {
    setEditFormData({
      shop_name: seller.shop_name || '',
      shop_email: seller.shop_email || '',
      shop_phone_number: seller.shop_phone_number || '',
      msme_certificate_number: seller.msme_certificate_number || '',
      gst_number: seller.gst_number || '',
      pan: seller.pan || '',
      aadhar: seller.aadhar || '',
      company_logo: seller.company_logo || '',
      company_images: Array.isArray(seller.company_images) ? seller.company_images : [],
      verified_status: seller.verified_status || false,
      member_type: seller.member_type?._id || seller.member_type || '', // ✅ IMPORTANT
    });
    setValidationErrors({
      shop_name: '',
      shop_email: '',
      shop_phone_number: '',
      msme_certificate_number: '',
      gst_number: '',
      pan: '',
      aadhar: '',
      company_logo: '',
      company_images: '',

    });
    setLogoFile(null);
    setCompanyImageFiles([]);
    setSelectedSeller(seller);
    setIsEditFormOpen(true);
    // Automatically mark as read when editing
    if (seller.markAsRead !== true) {
      handleMarkAsRead(seller._id);
    }

    setTimeout(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleFileChange = (e, field) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: 'Please upload only valid image files',
      }));
      return;
    }

    if (field === 'company_logo') {
      setLogoFile(files[0]);
      setValidationErrors(prev => ({
        ...prev,
        company_logo: '',
      }));
    } else if (field === 'company_images') {
      setCompanyImageFiles(prev => [...prev, ...files]);
      setValidationErrors(prev => ({
        ...prev,
        company_images: '',
      }));
    }
  };

  const handleDeleteImage = (index) => {
    setEditFormData(prev => ({
      ...prev,
      company_images: prev.company_images.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteNewImage = (index) => {
    setCompanyImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteLogo = () => {
    setEditFormData(prev => ({
      ...prev,
      company_logo: '',
    }));
    setLogoFile(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    let error = '';
    if (name === 'shop_name') {
      error = value ? '' : 'Shop name is required';
    } else if (name === 'shop_email') {
      error = value ? (validateEmail(value).isValid ? '' : validateEmail(value).errorMessage) : '';
    } else if (name === 'shop_phone_number') {
      error = value ? validatePhoneNumber(value).isValid ? '' : validatePhoneNumber(value).errorMessage : 'Phone number is required';
    } else if (name === 'msme_certificate_number' && value) {
      error = validateMSME(value).isValid ? '' : validateMSME(value).errorMessage;
    } else if (name === 'gst_number' && value) {
      error = validateGST(value).isValid ? '' : validateGST(value).errorMessage;
    } else if (name === 'pan' && value) {
      error = validatePAN(value).isValid ? '' : validatePAN(value).errorMessage;
    } else if (name === 'aadhar' && value) {
      error = validateAadhar(value).isValid ? '' : validateAadhar(value).errorMessage;
    }

    setValidationErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const errors = {
      shop_name: editFormData.shop_name ? '' : 'Shop name is required',
      shop_email: editFormData.shop_email ? (validateEmail(editFormData.shop_email).isValid ? '' : validateEmail(editFormData.shop_email).errorMessage) : '',
      shop_phone_number: editFormData.shop_phone_number ? validatePhoneNumber(editFormData.shop_phone_number).isValid ? '' : validatePhoneNumber(editFormData.shop_phone_number).errorMessage : 'Phone number is required',
      msme_certificate_number: editFormData.msme_certificate_number ? validateMSME(editFormData.msme_certificate_number).isValid ? '' : validateMSME(editFormData.msme_certificate_number).errorMessage : '',
      gst_number: editFormData.gst_number ? validateGST(editFormData.gst_number).isValid ? '' : validateGST(editFormData.gst_number).errorMessage : '',
      pan: editFormData.pan ? validatePAN(editFormData.pan).isValid ? '' : validatePAN(editFormData.pan).errorMessage : '',
      aadhar: editFormData.aadhar ? validateAadhar(editFormData.aadhar).isValid ? '' : validateAadhar(editFormData.aadhar).errorMessage : '',
      company_logo: '',
      company_images: '',
    };

    if (Object.values(errors).some(error => error !== '')) {
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
        formData.append('logo', logoFile);
        formData.append('shop_name', editFormData.shop_name);

        const logoEndpoint = editFormData.company_logo
          ? `${import.meta.env.VITE_API_IMAGE_URL}/grocery-seller-images/update-logo`
          : `${import.meta.env.VITE_API_IMAGE_URL}/grocery-seller-images/upload-logo`;

        const logoResponse = await axios.post(logoEndpoint, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        logoUrl = logoResponse.data.logoUrl;
      } else if (!logoFile && !editFormData.company_logo) {
        if (selectedSeller.company_logo) {
          await axios.delete(`${import.meta.env.VITE_API_IMAGE_URL}/grocery-seller-images/delete-logo`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { shop_name: editFormData.shop_name },
          });
        }
      }

      if (companyImageFiles.length > 0) {
        const formData = new FormData();
        companyImageFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('entity_type', 'grocery-seller');
        formData.append('shop_name', editFormData.shop_name);

        const imageResponse = await axios.post(
          `${import.meta.env.VITE_API_IMAGE_URL}/grocery-seller-images/upload-company-image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        companyImages = [...companyImages, ...imageResponse.data.files.map(file => file.fileUrl)];
      }

      const formDataToSubmit = {
        ...editFormData,
        company_logo: logoUrl,
        company_images: companyImages,
      };

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/grocery-sellers/update-grocery-seller/${selectedSeller._id}`,
        formDataToSubmit,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedSeller = response.data.data;

      // Update main sellers list; filteredSellers updates automatically via useMemo
      setSellers(sellers.map(seller => seller._id === updatedSeller._id ? updatedSeller : seller));

      setIsEditFormOpen(false);
      setSelectedSeller(null);
      setLogoFile(null);
      setCompanyImageFiles([]);
      setValidationErrors({
        shop_name: '',
        shop_email: '',
        shop_phone_number: '',
        msme_certificate_number: '',
        gst_number: '',
        pan: '',
        aadhar: '',
        company_logo: '',
        company_images: '',
      });
      showToast("Seller updated successfully", 'success');
    } catch (err) {
      showToast(err.message || "Failed to update seller", 'error');
      setError(err.message);
    }
  };

  const handleEditCancel = () => {
    setIsEditFormOpen(false);
    setSelectedSeller(null);
    setLogoFile(null);
    setCompanyImageFiles([]);
    setValidationErrors({
      shop_name: '',
      shop_email: '',
      shop_phone_number: '',
      msme_certificate_number: '',
      gst_number: '',
      pan: '',
      aadhar: '',
      company_logo: '',
      company_images: '',
    });
  };

  const handleRefresh = async () => {
    setLoading(true);
    setSearchTerm('');
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/grocery-sellers/fetch-all-grocery-seller`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sellerData = Array.isArray(response.data.data) ? response.data.data : [];
      setSellers(sellerData);
      setCurrentPage(1);
      setLoading(false);
      showToast("Sellers refreshed successfully", 'success');
    } catch (err) {
      showToast(err.message || "Failed to refresh sellers", 'error');
      setError(err.message);
      setLoading(false);
    }
  };



  const currentSellers = sellers;

  // 2. Then define handlers using those values
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleToggle = async (selectedUserId) => {
    if (!selectedUserId) return;

    const token = sessionStorage.getItem("token");
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/toggle-status/${selectedUserId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setSellers(prev => prev.map(s =>
          s.user_id?._id === selectedUserId
            ? { ...s, user_id: { ...s.user_id, isActive: res.data.isActive } }
            : s
        ));
        showToast(res.data.message, 'success');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Update failed', 'error');
    }
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
      <h2 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold">Grocery Sellers List</h2>
      {/* ---------------------------------------------------------------------------
            LEFT PANEL: BASE MEMBER SOP
           --------------------------------------------------------------------------- */}
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mb-6">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g. Shop name"
          className="w-full sm:w-64 rounded-md border-2 border-slate-300 focus:ring-2 focus:ring-gray-900 text-sm"
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {currentSellers.length > 0 ? (
          currentSellers.map((seller, index) => (
            <Card key={seller._id} className="border rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {seller.shop_name || "N/A"}
                    {seller.markAsRead !== true && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreVertical className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-md shadow-lg bg-white">
                      <DropdownMenuItem onClick={() => viewDetails(seller)} className="text-sm text-gray-700 hover:bg-gray-100">
                        View More Details
                      </DropdownMenuItem>
                      {seller.markAsRead !== true && (
                        <DropdownMenuItem onClick={() => handleMarkAsRead(seller._id)} className="text-sm text-blue-600 hover:bg-blue-50">
                          Mark as Read
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => handleToggle(seller?.user_id?._id)}
                        disabled={togglingId === seller?.user_id?._id}
                        className={`
    px-4 py-2 my-1 rounded-lg font-medium text-white cursor-pointer
    transition-all duration-300 shadow-md
    ${seller?.user_id?.isActive
                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                          }
    hover:shadow-lg transform hover:scale-105
  `}
                      >
                        {togglingId === seller?.user_id?._id ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Updating...
                          </div>
                        ) : seller?.user_id?.isActive ? (
                          'Deactivate Account'
                        ) : (
                          'Activate Account'
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditClick(seller)} className="text-sm text-gray-700 hover:bg-gray-100">
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => confirmDelete(seller._id)} className="text-sm text-red-600 hover:bg-red-50">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">S.No:</span> {(currentPage - 1) * itemsPerPage + index + 1}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Account Status:</span>{" "}
                    <span className={seller?.user_id?.isActive ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                      {seller?.user_id?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Shop Email:</span> {seller.shop_email || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Shop Phone:</span> {seller.shop_phone_number || "N/A"}
                  </p>

                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Member Type:</span> {seller.member_type?.name ? seller.member_type.name.replace(/_/g, ' ') : "N/A"}
                  </p>


                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="font-medium">Verified Status:</span>
                    <Switch
                      checked={seller.verified_status}
                      onCheckedChange={() => handleToggleVerified(seller._id, seller.verified_status)}
                      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                    />
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
      <div className="hidden md:block mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-[#0c1f4d]">
              <TableRow>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[60px]">S.No</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[120px]">Owner Name</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[180px]">Shop Name</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[150px]">Shop Phone Number</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[150px]">Address</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[150px]">Member Type</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[100px]">Account Status</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[90px]">Verified Status</TableHead>
                <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white w-[70px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSellers.length > 0 ? (
                currentSellers.map((seller, index) => (
                  <TableRow key={seller._id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-600">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-600">{seller?.user_id?.name || 'unknown'}</TableCell>
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-600 truncate">
                      <div className="flex items-center justify-center gap-2">
                        {seller.shop_name || 'N/A'}
                        {seller.markAsRead !== true && (
                          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                            New
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-600 truncate">{seller.shop_phone_number || 'N/A'}</TableCell>
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-600 truncate">
                      {seller.address_id ? `${seller.address_id.city || ''}, ${seller.address_id.state || ''}` : 'N/A'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-600">
                      {seller.member_type?.name ? seller.member_type.name.replace(/_/g, ' ') : "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5  text-xs font-medium ${seller?.user_id?.isActive ? ' text-green-800' : ' text-red-800'
                        }`}>
                        <span className={`mr-1.5 h-2 w-2 rounded-full ${seller?.user_id?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {seller?.user_id?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Switch
                        checked={seller.verified_status}
                        onCheckedChange={() => handleToggleVerified(seller._id, seller.verified_status)}
                        className="data-[state=checked]:bg-green-500 cursor-pointer data-[state=unchecked]:bg-red-500 mx-auto"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <MoreVertical className="h-5 w-5 text-gray-500 hover:text-gray-700 mx-auto cursor-pointer" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-md shadow-lg bg-white">
                          <DropdownMenuItem onClick={() => viewDetails(seller)} className="text-sm text-gray-700 hover:bg-gray-100">
                            View More Details
                          </DropdownMenuItem>
                          {seller.markAsRead !== true && (
                            <DropdownMenuItem onClick={() => handleMarkAsRead(seller._id)} className="text-sm text-blue-600 hover:bg-blue-50">
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleToggle(seller?.user_id?._id)}
                            disabled={togglingId === seller?.user_id?._id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            {togglingId === seller?.user_id?._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating...
                              </>
                            ) : seller?.user_id?.isActive === true ? (
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
                          <DropdownMenuItem onClick={() => handleEditClick(seller)} className="text-sm text-gray-700 hover:bg-gray-100">
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => confirmDelete(seller._id)} className="text-sm text-red-600 hover:bg-red-50">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="px-4 py-3 text-center text-sm text-gray-600">No sellers found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1 || loading}
            className="min-w-[100px]"
          >
            <ChevronLeft className="mr-2 h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="text-sm text-muted-foreground">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            {totalRecords > 0 && (
              <span className="ml-2 text-xs">
                ({totalRecords} total)
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || loading}
            className="min-w-[100px]"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="ml-2 h-4 w-4 sm:ml-2" />
          </Button>
        </div>
      )}

      {!loading && sellers.length === 0 && searchTerm && (
        <div className="text-center py-8 text-muted-foreground">
          No sellers match your search "{searchTerm}"
        </div>
      )}
      {/* Edit Form Modal */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent
          className="p-0 overflow-hidden bg-white rounded-xl shadow-2xl"
          style={{ width: "80vw", maxWidth: "80vw", height: "80vh", maxHeight: "80vh" }}
        >
          <DialogHeader className="px-6 py-5 bg-gradient-to-r from-[#0c1f4d] to-[#153171] text-white sticky top-0 z-10">
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              Edit Grocery Seller
              <button onClick={() => setIsEditFormOpen(false)} className="text-white cursor-pointer hover:bg-white/20 rounded-full p-1 transition">
                <X className="h-5 w-5" />
              </button>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-6" style={{ height: "calc(80vh - 140px)" }}>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Name <span className="text-red-500">*</span></label>
                  <Input type="text" name="shop_name" value={editFormData.shop_name} onChange={handleEditFormChange} placeholder="e.g. My Grocery Shop" required className={`border-2 border-slate-300 ${validationErrors.shop_name ? 'border-red-500' : ''}`} />
                  {validationErrors.shop_name && <p className="mt-1 text-xs text-red-500">{validationErrors.shop_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Email</label>
                  <Input type="email" name="shop_email" value={editFormData.shop_email} onChange={handleEditFormChange} placeholder="e.g. shop@example.com" className={`border-2 border-slate-300 ${validationErrors.shop_email ? 'border-red-500' : ''}`} />
                  {validationErrors.shop_email && <p className="mt-1 text-xs text-red-500">{validationErrors.shop_email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Phone Number <span className="text-red-500">*</span></label>
                  <Input type="text" name="shop_phone_number" value={editFormData.shop_phone_number} onChange={handleEditFormChange} placeholder="e.g. 9876543210" required className={`border-2 border-slate-300 ${validationErrors.shop_phone_number ? 'border-red-500' : ''}`} />
                  {validationErrors.shop_phone_number && <p className="mt-1 text-xs text-red-500">{validationErrors.shop_phone_number}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">MSME Number</label>
                  <Input type="text" name="msme_certificate_number" value={editFormData.msme_certificate_number} placeholder="e.g. MSME123456" onChange={handleEditFormChange} className="border-2 border-slate-300" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">GST Number</label>
                  <Input type="text" name="gst_number" value={editFormData.gst_number} placeholder="e.g. 22AAAAA0000A1Z5" onChange={handleEditFormChange} className="border-2 border-slate-300" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">PAN</label>
                  <Input type="text" name="pan" value={editFormData.pan} placeholder="e.g. ABCDE1234F" onChange={handleEditFormChange} className="border-2 border-slate-300" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhar</label>
                  <Input type="text" name="aadhar" value={editFormData.aadhar} placeholder="e.g. 123456789012" onChange={handleEditFormChange} className="border-2 border-slate-300" />
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
                  <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'company_logo')} className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Images</label>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {/* Existing Images */}
                    {editFormData.company_images.map((image, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <img src={image} alt={`Existing Img ${index}`} className="h-28 w-28 object-cover rounded-lg border-2 border-gray-200" />
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
                  <Input type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'company_images')} />
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
                    className="w-full border-2 border-slate-300 rounded-md px-3 py-2 text-sm"
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
            <DialogFooter className="px-6 py-5 bg-gray-50 border-t mb-10 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditFormOpen(false)}>Cancel</Button>
              <Button onClick={handleEditSubmit} className="bg-[#0c1f4d] hover:bg-[#153171] text-white">Update Seller</Button>
            </DialogFooter>
          </ScrollArea>


        </DialogContent>
      </Dialog>

      <SellerDetailsModal 
        seller={selectedSeller} 
        open={isSellerModalOpen} 
        onClose={() => setIsSellerModalOpen(false)} 
        onRefresh={fetchSellers}
      />

      {/* Delete Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800/60">
          <div className="bg-white p-6 rounded-xl shadow-md max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Confirm Deletion</h3>
            <p className="mb-4 text-gray-600 text-sm">Are you sure you want to delete this seller?</p>
            <div className="flex justify-end space-x-2">
              <Button onClick={cancelDelete} className="bg-white border border-gray-300 text-gray-700">Cancel</Button>
              <Button onClick={() => handleDelete(sellerToDelete)} className="bg-[#a00505] text-white hover:bg-[#ea2525]">Confirm</Button>
            </div>
          </div>
        </div>
      )}

      <MultiStepModalGrocery open={isAddModalOpen} onOpenChange={setIsAddModalOpen} onRefresh={handleRefresh} />
    </div>
  );
}

export default GrocerySellerList;
