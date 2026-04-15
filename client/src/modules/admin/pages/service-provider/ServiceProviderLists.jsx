import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, MoreVertical, ToggleLeft, ToggleRight, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSidebar } from "../../hooks/useSidebar";
import { validateEmail } from "@/modules/validation/emailvalidation";
import { validateLicence } from "@/modules/validation/licenceValidation";
import { validatePhoneNumber } from "@/modules/validation/phoneValidation";
import { validateDescription } from "@/modules/validation/descriptionValidation";
import showToast from "@/toast/showToast";
import AddServiceProvider from "./AddServiceProvider";
import ServiceProviderDetails from "./ServiceProviderDetails";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useGetServiceProvidersQuery, useUpdateServiceProviderMutation } from "@/redux/api/ServiceProviderApi";

const ProviderDetails = ({ provider }) => (
  <div className=" sm:p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-900">Provider Details</h3>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">User ID:</span> {provider.user_id?._id || "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Email:</span> {provider.company_email || "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Phone Number:</span> {provider.company_phone_number || "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Verified:</span> {provider.verified_status ? "Yes" : "No"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Trust Shield:</span> {provider.trust_shield ? "Yes" : "No"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Travels Name:</span> {provider.travels_name || "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">License Number:</span> {provider.license_number || "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Number of Vehicles:</span> {provider.number_of_vehicles || "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Vehicle Type:</span> {provider.vehicle_type || "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Description:</span> {provider.description || "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Company Logo:</span> {provider.company_logo ? <img src={provider.company_logo} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-md mt-2" /> : "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Company Images:</span> {provider.company_images?.length > 0 ? provider.company_images.join(", ") : "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Created At:</span> {new Date(provider.created_at).toLocaleString() || "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Updated At:</span> {new Date(provider.updated_at).toLocaleString() || "-"}</p>
    <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Address:</span> {provider.address_id ? `${provider.address_id.address_line1}, ${provider.address_id.city}, ${provider.address_id.state}, ${provider.address_id.country}, ${provider.address_id.postal_code}` : "-"}</p>
  </div>
);

const EditServiceProviderForm = ({ provider, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    company_email: provider.company_email || "",
    company_phone_number: provider.company_phone_number || "",
    travels_name: provider.travels_name || "",
    license_number: provider.license_number || "",
    verified_status: !!provider.verified_status,
    trust_shield: !!provider.trust_shield,
    number_of_vehicles: provider.number_of_vehicles || "",
    vehicle_type: provider.vehicle_type || "",
    description: provider.description || "",
    company_logo: provider.company_logo || "",
  });
  const [companyImages, setCompanyImages] = useState(provider.company_images || []);
  const [logoFile, setLogoFile] = useState(null);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [errors, setErrors] = useState({
    company_email: "",
    company_phone_number: "",
    travels_name: "",
    license_number: "",
    description: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const API_IMAGE_URL = import.meta.env.VITE_API_IMAGE_URL || "http://localhost:8080/api/v1";
  const [updateServiceProvider] = useUpdateServiceProviderMutation();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    setFormData(newFormData);

    let error = "";
    if (name === "company_email") {
      const validation = validateEmail(value);
      error = validation.errorMessage;
    } else if (name === "company_phone_number") {
      const validation = validatePhoneNumber(value);
      error = validation.errorMessage;
    } else if (name === "license_number") {
      const validation = validateLicence(value);
      error = validation.errorMessage;
    } else if (name === "description") {
      const validation = validateDescription(value);
      error = validation.errorMessage;
    } else if (name === "travels_name") {
      error = value.trim() ? "" : "Travels name is required";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleVehicleTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, vehicle_type: value }));
  };

  const handleRemoveImage = (index, url) => {
    setCompanyImages(companyImages.filter((_, i) => i !== index));
    setDeletedImages((prev) => [...prev, url]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!provider || !provider._id) {
      showToast("Invalid provider selected for editing.", "error");
      return;
    }

    let newErrors = {
      company_email: "",
      company_phone_number: "",
      travels_name: "",
      license_number: "",
      description: "",
    };

    if (formData.company_email) {
      const emailValidation = validateEmail(formData.company_email);
      newErrors.company_email = emailValidation.errorMessage;
    }
    if (formData.company_phone_number) {
      const phoneValidation = validatePhoneNumber(formData.company_phone_number);
      newErrors.company_phone_number = phoneValidation.errorMessage;
    }
    if (formData.travels_name) {
      newErrors.travels_name = formData.travels_name.trim()
        ? ""
        : "Travels name is required";
    }
    if (formData.license_number) {
      const licenceValidation = validateLicence(formData.license_number);
      newErrors.license_number = licenceValidation.errorMessage;
    }
    if (formData.description) {
      const descriptionValidation = validateDescription(formData.description);
      newErrors.description = descriptionValidation.errorMessage;
    }

    const hasErrors = Object.values(newErrors).some((error) => error);
    if (hasErrors) {
      setErrors(newErrors);
      showToast("Please correct the errors in the form before submitting.", "error");
      return;
    }

    let updatedData = {};
    const fieldsToCheck = [
      "company_email",
      "company_phone_number",
      "travels_name",
      "license_number",
      "verified_status",
      "trust_shield",
      "number_of_vehicles",
      "vehicle_type",
      "description",
    ];

    fieldsToCheck.forEach((key) => {
      const originalValue = provider[key] ?? (typeof formData[key] === "boolean" ? false : "");
      if (formData[key] !== originalValue && (typeof formData[key] === "boolean" || formData[key] !== "")) {
        updatedData[key] = formData[key];
      }
    });

    let hasFileChanges = false;

    if (logoFile) {
      const uploadFormData = new FormData();
      uploadFormData.append("logo", logoFile);
      uploadFormData.append("company_name", formData.travels_name);

      try {
        const response = await fetch(`${API_IMAGE_URL}/service-provider-images/update-logo`, {
          method: "PUT",
          body: uploadFormData,
        });
        const data = await response.json();
        if (!response.ok || !data.logoUrl) {
          throw new Error(data.message || "Logo upload failed");
        }
        updatedData.company_logo = data.logoUrl;
        hasFileChanges = true;
      } catch (error) {
        console.error("Logo upload error:", error);
        showToast("Failed to upload logo. Please try again.", "error");
        return;
      }
    }

    let updatedCompanyImages = [...companyImages];

    if (deletedImages.length > 0) {
      hasFileChanges = true;
      for (const delUrl of deletedImages) {
        try {
          const response = await fetch(`${API_IMAGE_URL}/service-provider-images/delete-company-image`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity_type: "service_provider",
              company_name: formData.travels_name.replace(/\s+/g, "_"),
              filename: delUrl.split("/").pop(),
            }),
          });
          if (!response.ok) {
            console.warn(`Failed to delete image: ${delUrl}`);
          }
        } catch (error) {
          console.error("Image delete error:", error);
        }
      }
      updatedCompanyImages = updatedCompanyImages.filter((url) => !deletedImages.includes(url));
    }

    if (newImageFiles.length > 0) {
      hasFileChanges = true;
      const imagesFormData = new FormData();
      newImageFiles.forEach((file) => imagesFormData.append("files", file));
      imagesFormData.append("entity_type", "service_provider");
      imagesFormData.append("company_name", formData.travels_name);

      try {
        const response = await fetch(`${API_IMAGE_URL}/service-provider-images/upload-company-image`, {
          method: "POST",
          body: imagesFormData,
        });
        const data = await response.json();
        if (!response.ok || !data.files || data.files.length === 0) {
          throw new Error(data.message || "Images upload failed");
        }
        const newUrls = data.files.map((f) => f.fileUrl);
        updatedCompanyImages = [...updatedCompanyImages, ...newUrls];
      } catch (error) {
        console.error("Images upload error:", error);
        showToast("Failed to upload company images. Please try again.", "error");
        return;
      }
    }

    if (updatedCompanyImages.length > 0 || deletedImages.length > 0) {
      updatedData.company_images = updatedCompanyImages;
    }

    if (Object.keys(updatedData).length > 0 || hasFileChanges) {
      setIsUpdating(true);
      try {
        await updateServiceProvider({
          userId: provider._id,
          updatedProvider: updatedData,
        }).unwrap();
        showToast("Service provider updated successfully!", "success");
        onSave(updatedData);
      } catch (error) {
        console.error("Update failed:", error);
        showToast(`Failed to update: ${error?.data?.message || "An unexpected error occurred"}`, "error");
      } finally {
        setIsUpdating(false);
      }
    } else {
      showToast("No changes detected.", "info");
      onCancel();
    }
  };

  return (
    <div className=" sm:p-4 md:p-6 border border-gray-200 bg-white rounded-lg shadow-sm space-y-4">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">Edit Service Provider</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company_email" className="text-xs sm:text-sm font-medium text-gray-700">Email</Label>
          <Input
            id="company_email"
            name="company_email"
            type="email"
            value={formData.company_email}
            onChange={handleChange}
            className={`border-gray-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm ${errors.company_email ? "border-red-500" : ""}`}
            placeholder="Company Email"
          />
          {errors.company_email && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.company_email}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_phone_number" className="text-xs sm:text-sm font-medium text-gray-700">Phone Number</Label>
          <Input
            id="company_phone_number"
            name="company_phone_number"
            value={formData.company_phone_number}
            onChange={handleChange}
            className={`border-gray-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm ${errors.company_phone_number ? "border-red-500" : ""}`}
            placeholder="Phone Number"
          />
          {errors.company_phone_number && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.company_phone_number}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="travels_name" className="text-xs sm:text-sm font-medium text-gray-700">Travels Name</Label>
          <Input
            id="travels_name"
            name="travels_name"
            value={formData.travels_name}
            onChange={handleChange}
            className={`border-gray-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm ${errors.travels_name ? "border-red-500" : ""}`}
            placeholder="Travels Name"
          />
          {errors.travels_name && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.travels_name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="license_number" className="text-xs sm:text-sm font-medium text-gray-700">License Number</Label>
          <Input
            id="license_number"
            name="license_number"
            value={formData.license_number}
            onChange={handleChange}
            className={`border-gray-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm ${errors.license_number ? "border-red-500" : ""}`}
            placeholder="License Number"
          />
          {errors.license_number && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.license_number}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="number_of_vehicles" className="text-xs sm:text-sm font-medium text-gray-700">Number of Vehicles</Label>
          <Input
            id="number_of_vehicles"
            name="number_of_vehicles"
            type="number"
            value={formData.number_of_vehicles}
            onChange={handleChange}
            className="border-gray-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm"
            placeholder="Number of Vehicles"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle_type" className="text-xs sm:text-sm font-medium text-gray-700">Vehicle Type</Label>
          <Select
            value={formData.vehicle_type}
            onValueChange={handleVehicleTypeChange}
          >
            <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm">
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2-wheeler">2-Wheeler</SelectItem>
              <SelectItem value="3-wheeler">3-Wheeler</SelectItem>
              <SelectItem value="4-wheeler">4-Wheeler</SelectItem>
              <SelectItem value="8-wheeler">8-Wheeler</SelectItem>
              <SelectItem value="12-wheeler">12-Wheeler</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs sm:text-sm font-medium text-gray-700">Description</Label>
          <Input
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`border-gray-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm ${errors.description ? "border-red-500" : ""}`}
            placeholder="Description"
          />
          {errors.description && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.description}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-medium text-gray-700">Company Logo</Label>
          <div>
            {formData.company_logo && !logoFile ? (
              <img src={formData.company_logo} alt="Current Logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-md mb-2" />
            ) : null}
            {logoFile ? (
              <img src={URL.createObjectURL(logoFile)} alt="New Logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-md mb-2" />
            ) : null}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files[0])}
              className="text-xs sm:text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-medium text-gray-700">Company Images</Label>
          <div className="flex flex-wrap gap-4 mb-4">
            {companyImages.map((url, index) => (
              <div key={index} className="relative">
                <img src={url} alt={`Image ${index}`} className="w-16 h-16 sm:w-20 sm:h-20 rounded-md" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-0 right-0 text-xs p-1"
                  onClick={() => handleRemoveImage(index, url)}
                >
                  X
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
            {newImageFiles.map((file, index) => (
              <img
                key={index}
                src={URL.createObjectURL(file)}
                alt={`New Image ${index}`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-md"
              />
            ))}
          </div>
          <Input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setNewImageFiles(Array.from(e.target.files))}
            className="text-xs sm:text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isUpdating}
          className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[80px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isUpdating}
          onClick={handleSubmit}
          className="bg-[#0c1f4d] hover:bg-[#153171] text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[80px]"
        >
          {isUpdating ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

const ServiceProviderList = () => {
  const { isSidebarOpen } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editProvider, setEditProvider] = useState(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);

  const pageSize = 10;
  const editRef = useRef(null);
  const detailsRef = useRef(null);

  const {
    data: serviceProviders = [],
    isLoading,
    isFetching,  // <-- Add this
    error,
    refetch
  } = useGetServiceProvidersQuery();
  const [updateServiceProvider] = useUpdateServiceProviderMutation();

  const filteredProviders = serviceProviders.filter((provider) => {
    const email = provider.company_email || "";
    const phoneNumber = provider.company_phone_number || "";
    const travelsName = provider.travels_name || "";
    return (
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phoneNumber.includes(searchQuery) ||
      travelsName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalProviders = filteredProviders.length;
  const totalPages = Math.ceil(totalProviders / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const displayedProviders = filteredProviders.slice(startIndex, startIndex + pageSize);

  const handleViewDetails = (provider) => {
    setSelectedProvider(provider);
    setSelectedProviderId(provider._id);
    setIsViewingDetails(true); // ✅ show detail card
  };

  const handleEdit = (provider) => {
    if (!provider || !provider._id) {
      showToast("Invalid provider selected for editing.", "error");
      return;
    }
    setEditProvider(provider);
    setIsViewingDetails(true); // 🚫 make sure detail card stays hidden
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await updateServiceProvider({
        userId: editProvider._id,
        updatedProvider: updatedData,
      }).unwrap();
      setEditProvider(null);
      showToast("Service provider updated successfully!", "success");
    } catch (error) {
      console.error("Update failed:", error);
      showToast(`Failed to update: ${error?.data?.message || "An unexpected error occurred"}`, "error");
    }
  };

  const handleDelete = (providerId) => {
    const provider = serviceProviders.find((p) => p._id === providerId);
    setSelectedProvider(provider);
    setIsDeleteModalOpen(true);
    setIsViewingDetails(false); // 🚫 make sure detail card stays hidden
  };

  const handleToggleVerified = async (provider) => {
    if (!provider || !provider._id) return;
    try {
      await updateServiceProvider({
        userId: provider._id,
        updatedProvider: { verified_status: !provider.verified_status },
      }).unwrap();
      showToast("Verified status updated successfully!", "success");
    } catch (error) {
      console.error("Error updating verified status:", error);
      showToast("Failed to update verified status.", "error");
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  useEffect(() => {
    if (editProvider && editRef.current) {
      editRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editProvider]);

  useEffect(() => {
    if (selectedProvider && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedProvider]);

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 text-gray-600 text-center text-xs sm:text-sm">
        Loading service providers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-4 md:p-6 text-red-500 text-center text-xs sm:text-sm">
        Error fetching service providers: {error.message}{" "}
        <Button
          onClick={refetch}
          disabled={isFetching}
          className="flex items-center bg-[#0c1f4d] hover:bg-[#153171] text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[100px] disabled:opacity-50"
        >
          {isFetching ? (
            <RefreshCw className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
          )}
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div

    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h1 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold">Service Provider List</h1>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search by Email, Phone, or Travels Name..."
            className="w-full sm:w-48 md:w-64 lg:w-72 border-gray-300 focus:ring-2 focus:ring-[#0c1f4d] text-xs sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-2 sm:gap-3">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center bg-[#0c1f4d] hover:bg-[#153171] text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[100px]"
            >
              <PlusCircle className="w-4 h-4 mr-1 sm:mr-2" /> Add Provider
            </Button>
            <Button
              onClick={refetch}
              disabled={isFetching}
              className="flex items-center bg-[#0c1f4d] hover:bg-[#153171] text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 min-w-[100px] disabled:opacity-50"
            >
              {isFetching ? (
                <RefreshCw className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <AddServiceProvider
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onProviderAdded={() => refetch()}
        />
      </Dialog>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        provider={selectedProvider}
      />

      <div className="block sm:hidden space-y-4">
        {displayedProviders.length > 0 ? (
          displayedProviders.map((provider, index) => (
            <div
              key={provider._id}
              className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-900">
                  {startIndex + index + 1}. {provider.travels_name || "-"}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <MoreVertical className="w-5 h-5 text-gray-500 hover:text-[#0c1f4d]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white shadow-lg">
                    <DropdownMenuItem
                      onClick={() => handleViewDetails(provider)}
                      className="text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEdit(provider)}
                      className="text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(provider._id)}
                      className="text-xs sm:text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <p><span className="font-medium">Email:</span> {provider.company_email || "-"}</p>
                <p><span className="font-medium">Phone:</span> {provider.company_phone_number || "-"}</p>
                <p><span className="font-medium">Vehicles:</span> {provider.number_of_vehicles || "-"}</p>
                <p><span className="font-medium">Vehicle Type:</span> {provider.vehicle_type || "-"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-medium">Verified:</span>
                  <Switch
                    checked={provider.verified_status}
                    onCheckedChange={() => handleToggleVerified(provider)}
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600"
                    thumbIcon={
                      provider.verified_status ? (
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
          <div className="text-center py-4 text-xs text-gray-600">
            No service providers found
          </div>
        )}
      </div>

      <div className="hidden sm:block overflow-x-auto bg-white border border-gray-200  shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#0c1f4d] border-b hover:bg-[#153171] border-gray-300">
              <TableHead className="w-[60px] sm:w-[80px] text-xs sm:text-sm font-medium text-white">
                S.No
              </TableHead>

              <TableHead className="text-xs sm:text-sm font-medium text-white">
                Travels Name
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">
                Email
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">
                Phone Number
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">
                Vehicles
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">
                Vehicle Type
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">
                Verified
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-medium text-white">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedProviders.length > 0 ? (
              displayedProviders.map((provider, index) => (
                <TableRow key={provider._id} className="hover:bg-gray-50">
                  <TableCell className="text-xs sm:text-sm text-gray-600">
                    {startIndex + index + 1}
                  </TableCell>

                  <TableCell className="text-xs sm:text-sm text-gray-900 font-medium">
                    {provider.travels_name || "-"}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm text-gray-600">
                    {provider.company_email || "-"}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm text-gray-600">
                    {provider.company_phone_number || "-"}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm text-gray-600">
                    {provider.number_of_vehicles || "-"}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm text-gray-600">
                    {provider.vehicle_type || "-"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={provider.verified_status}
                      onCheckedChange={() => handleToggleVerified(provider)}
                      className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600"
                      thumbIcon={
                        provider.verified_status ? (
                          <ToggleRight className="h-4 w-4 text-white" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-white" />
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertical className="w-5 h-5 text-gray-500 hover:text-[#0c1f4d]" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white shadow-lg">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(provider)}
                          className="text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEdit(provider)}
                          className="text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(provider._id)}
                          className="text-xs sm:text-sm text-red-600 hover:bg-red-50"
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
                <TableCell
                  colSpan={9}
                  className="text-center py-4 text-xs sm:text-sm text-gray-600"
                >
                  No service providers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredProviders.length > 0 && (
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

      {editProvider && (
        <div ref={editRef} className="mt-4 sm:mt-6">
          <EditServiceProviderForm
            key={editProvider._id}
            provider={editProvider}
            onSave={handleSaveEdit}
            onCancel={() => setEditProvider(null)}
          />
        </div>
      )}

      {isViewingDetails && selectedProvider && (
        <div ref={detailsRef} className="mt-4 sm:mt-6">
          <ServiceProviderDetails
            providerId={selectedProviderId}
            onClose={() => {
              setSelectedProvider(null);
              setIsViewingDetails(false);
            }}
          />
        </div>
      )}

    </div>
  );
};

export default ServiceProviderList;