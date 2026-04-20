import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateAadhar } from "@/modules/validation/aadharValidation";
import { validatePhoneNumber } from "@/modules/validation/phoneValidation";
import { validateEmail } from "@/modules/validation/emailvalidation";
import { validateDescription } from "@/modules/validation/descriptionValidation";
import { validateGST } from "@/modules/validation/gstValidation";
import { validateMSME } from "@/modules/validation/msmeValidation";
import { validatePAN } from "@/modules/validation/panValidation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import showToast from "@/toast/showToast";
import {Label} from "@/components/ui/label";

const EditMerchantForm = ({ merchant, onSave, open, onClose }) => {
  const [formData, setFormData] = useState({
    _id: merchant?._id || "",
    company_name: merchant?.company_name || "",
    company_email: merchant?.company_email || "",
    company_phone_number: merchant?.company_phone_number || "",
    company_type: merchant?.company_type?.name || merchant?.company_type || "",
    gst_number: merchant?.gst_number || "",
    msme_certificate_number: merchant?.msme_certificate_number || "",
    pan: merchant?.pan || "",
    aadhar: merchant?.aadhar || "",
    number_of_employees: merchant?.number_of_employees || "",
    year_of_establishment: merchant?.year_of_establishment || "",
    description: merchant?.description || "",
    company_video: merchant?.company_video || "",
    company_logo: merchant?.company_logo || "",
    company_images: merchant?.company_images || [],
  });

  const [logoPreview, setLogoPreview] = useState(merchant?.company_logo || "");
  const [imagePreviews, setImagePreviews] = useState(merchant?.company_images || []);
  const [uploadError, setUploadError] = useState(null);
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  // ── Dynamic Company Types ───────────────────────────────────────────────
  const [companyTypes, setCompanyTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  const imageApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_IMAGE_URL || "http://localhost:8080/api/v1"}/merchant-images`,
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    },
  });

  useEffect(() => {
    if (!open) return;

    const fetchCompanyTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/company-types`, {
          params: { page: 1, limit: 100 },
        });

        if (response.data.success) {
          setCompanyTypes(response.data.data || []);
        } else {
          showToast("Failed to load company types", "error");
        }
      } catch (error) {
        console.error("Error fetching company types:", error);
        showToast("Could not load company types. Please try again.", "error");
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchCompanyTypes();
  }, [open]);

  // All fields are essentially optional in terms of presence, but validated by format if provided
  const validateField = (name, value) => {
    let result = { isValid: true, errorMessage: "" };

    if (!value && name !== "company_type") {
      return result; // Empty allowed if not explicitly required elsewhere
    }

    switch (name) {
      case "company_email":
        if (value) result = validateEmail(value);
        break;
      case "company_phone_number":
        if (value) result = validatePhoneNumber(value);
        break;
      case "gst_number":
        if (value) result = validateGST(value);
        break;
      case "msme_certificate_number":
        if (value) result = validateMSME(value);
        break;
      case "pan":
        if (value) result = validatePAN(value);
        break;
      case "aadhar":
        if (value) result = validateAadhar(value);
        break;
      case "description":
        if (value) result = validateDescription(value);
        break;
      case "number_of_employees":
        if (value) {
          result = {
            isValid: !isNaN(value) && Number(value) >= 0,
            errorMessage: isNaN(value) || Number(value) < 0 ? "Must be a positive number" : "",
          };
        }
        break;
      case "year_of_establishment":
        if (value) {
          const currentYear = new Date().getFullYear();
          result = {
            isValid: !isNaN(value) && Number(value) >= 1800 && Number(value) <= currentYear,
            errorMessage:
              isNaN(value) || Number(value) < 1800 || Number(value) > currentYear
                ? `Year must be between 1800 and ${currentYear}`
                : "",
          };
        }
        break;
      case "company_video":
        if (value) {
          const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
          result = {
            isValid: urlRegex.test(value),
            errorMessage: "Please enter a valid URL (http:// or https://)",
          };
        }
        break;
      case "company_type":
        result = {
          isValid: !!value,
          errorMessage: value ? "" : "Company type is required",
        };
        break;
      default:
        break;
    }

    return result;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    const { isValid, errorMessage } = validateField(name, value);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: !isValid ? errorMessage : undefined,
    }));
  };

  const handleCompanyTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, company_type: value }));
    setTouched((prev) => ({ ...prev, company_type: true }));

    const { isValid, errorMessage } = validateField("company_type", value);
    setValidationErrors((prev) => ({
      ...prev,
      company_type: !isValid ? errorMessage : undefined,
    }));
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(formData).forEach((field) => {
      const { isValid, errorMessage } = validateField(field, formData[field]);
      if (!isValid) errors[field] = errorMessage;
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (uploadError) {
      showToast("Please resolve upload errors before saving.", "error");
      return;
    }

    if (!validateForm()) {
      showToast("Please fix the validation errors before updating.", "warning");
      return;
    }

    const payload = { ...formData };
    onSave(payload);
  };

  // Image Upload Handlers
  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      showToast("Logo must be JPEG, PNG, GIF, or WebP.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Logo must be under 5MB.", "error");
      return;
    }

    setUploadError(null);
    setLogoPreview(URL.createObjectURL(file));

    try {
      const uploadData = new FormData();
      uploadData.append("logo", file);
      uploadData.append("company_name", formData.company_name);

      const endpoint = formData.company_logo ? "/update-logo" : "/upload-logo";
      const response = await imageApi[formData.company_logo ? "put" : "post"](
        endpoint,
        uploadData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setFormData((prev) => ({ ...prev, company_logo: response.data.logoUrl }));
      setLogoPreview(response.data.logoUrl); // Update preview state as well
      showToast("Logo uploaded successfully", "success");
    } catch (error) {
      console.error("Logo upload error:", error);
      showToast("Failed to upload logo. Please try again.", "error");
    }
  };

  const removeLogo = async () => {
    if (!formData.company_logo) return;

    try {
      const filename = formData.company_logo.split("/").pop();
      await imageApi.delete("/delete-logo", {
        data: { company_name: formData.company_name, filename },
      });

      setFormData((prev) => ({ ...prev, company_logo: "" }));
      setLogoPreview("");
      showToast("Logo removed successfully", "success");
    } catch (error) {
      console.error("Delete logo error:", error);
      showToast("Failed to delete logo.", "error");
    }
  };

  const handleImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = files.filter(
      (f) => allowedImageTypes.includes(f.type) && f.size <= 5 * 1024 * 1024
    );
    if (validFiles.length !== files.length) {
      showToast("Some images are invalid. Use JPEG/PNG/WebP under 5MB.", "error");
      return;
    }

    setUploadError(null);
    const previews = validFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...previews]);

    try {
      const uploadData = new FormData();
      validFiles.forEach((f) => uploadData.append("files", f));
      uploadData.append("entity_type", "merchant");
      uploadData.append("company_name", formData.company_name);

      const response = await imageApi.post("/upload-company-image", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newUrls = response.data.files.map((f) => f.fileUrl);
      setFormData((prev) => ({
        ...prev,
        company_images: [...prev.company_images, ...newUrls],
      }));
      showToast("Images uploaded successfully", "success");
    } catch (error) {
      console.error("Images upload error:", error);
      showToast("Failed to upload images.", "error");
    }
  };

  const removeImage = async (index) => {
    const imageUrl = formData.company_images[index];
    const filename = imageUrl.split("/").pop();

    try {
      await imageApi.delete("/delete-company-image", {
        data: { entity_type: "merchant", company_name: formData.company_name, filename },
      });

      setFormData((prev) => ({
        ...prev,
        company_images: prev.company_images.filter((_, i) => i !== index),
      }));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
      showToast("Image removed successfully", "success");
    } catch (error) {
      console.error("Delete image error:", error);
      showToast("Failed to delete image.", "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="p-0 bg-white overflow-hidden shadow-2xl border-none"
        style={{
          width: "80vw",
          maxWidth: "80vw",
          height: "80vh",
          maxHeight: "80vh",
        }}
      >
        <div className="flex items-center justify-between p-5 sm:p-6 bg-gradient-to-r from-[#0c1f4d] to-[#1e3a8a] text-white sticky top-0 z-10 border-b border-white/20">
          <div className="flex justify-between w-full items-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Edit Merchant Information
            </h1>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white cursor-pointer hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto h-full">
          {uploadError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2 border border-red-100">
              <span className="font-medium">Error:</span> {uploadError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Company Name</Label>
                <Input
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-700">
                  Company Email <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </Label>
                <Input
                  name="company_email"
                  value={formData.company_email}
                  placeholder="email@example.com"
                  onChange={handleChange}
                  className={`mt-1 ${validationErrors.company_email ? "border-red-500" : ""}`}
                />
                {validationErrors.company_email && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.company_email}</p>
                )}
              </div>

              <div>
                <Label className="text-gray-700">Phone Number</Label>
                <Input
                  name="company_phone_number"
                  value={formData.company_phone_number}
                  onChange={handleChange}
                  className={`mt-1 ${validationErrors.company_phone_number ? "border-red-500" : ""}`}
                />
                {validationErrors.company_phone_number && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.company_phone_number}</p>
                )}
              </div>

              <div>
                <Label className="text-gray-700">Company Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.company_type}
                  onValueChange={handleCompanyTypeChange}
                  disabled={loadingTypes}
                >
                  <SelectTrigger className={`mt-1 ${validationErrors.company_type ? "border-red-500" : ""}`}>
                    <SelectValue placeholder={loadingTypes ? "Loading types..." : "Select type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {companyTypes.map((type) => (
                      <SelectItem key={type._id || type.name} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.company_type && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.company_type}</p>
                )}
              </div>
            </div>

            {/* Legal & Other Info */}
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">GST Number</Label>
                <Input
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={handleChange}
                  placeholder="GSTIN"
                  className={`mt-1 ${validationErrors.gst_number ? "border-red-500" : ""}`}
                />
              </div>

              <div>
                <Label className="text-gray-700">PAN</Label>
                <Input
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="PAN Number"
                  className={`mt-1 ${validationErrors.pan ? "border-red-500" : ""}`}
                />
              </div>

              <div>
                <Label className="text-gray-700">Aadhaar</Label>
                <Input
                  name="aadhar"
                  value={formData.aadhar}
                  onChange={handleChange}
                  placeholder="Aadhaar Number"
                  className={`mt-1 ${validationErrors.aadhar ? "border-red-500" : ""}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-700 text-xs">Employees</Label>
                  <Input
                    name="number_of_employees"
                    type="number"
                    placeholder="number of employee count"
                    value={formData.number_of_employees}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 text-xs">Est. Year</Label>
                  <Input
                    name="year_of_establishment"
                    type="number"
                    placeholder="year of establishment"
                    value={formData.year_of_establishment}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Label className="text-gray-700">Description</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full mt-1 p-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Tell us about the business..."
            />
          </div>

          <div className="mt-5">
            <Label className="text-gray-700">Company Video</Label>
            <Input
              name="company_video"
              value={formData.company_video}
              onChange={handleChange}
              placeholder="e.g. https://youtube.com/watch?v=..."
              className={`mt-1 ${validationErrors.company_video ? "border-red-500" : ""}`}
            />
            {validationErrors.company_video && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.company_video}</p>
            )}
          </div>

          {/* Media Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-700 block mb-2">Company Logo</Label>
              <div className="flex items-center gap-4 border p-3 rounded-lg bg-gray-50">
                {logoPreview ? (
                  <div className="relative group">
                    <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded shadow-sm object-cover" />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center pointer-events-none">
                       <p className="text-[10px] text-white font-medium">Preview</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                    Logo
                  </div>
                )}
                <div className="flex-1">
                  <Input type="file" accept="image/*" onChange={handleLogoChange} className="text-xs h-8" />
                  <p className="text-[10px] text-gray-500 mt-1">Recommended: Square, max 5MB</p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-gray-700 block mb-2">Company Images</Label>
              <div className="border p-3 rounded-lg bg-gray-50">
                <div className="flex flex-wrap gap-2 mb-3">
                  {imagePreviews.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="Business" className="w-12 h-12 rounded object-cover border" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                    <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
                    <span className="text-gray-400 font-bold">+</span>
                  </label>
                </div>
                <p className="text-[10px] text-gray-500">Max 5 images, JPEG/PNG/WebP</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <Button variant="ghost" onClick={onClose} className="text-gray-600">Cancel</Button>
            <Button onClick={handleSubmit} className="bg-[#0c1f4d] hover:bg-[#153171] text-white px-8">
              Update Merchant
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMerchantForm;
