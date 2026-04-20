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

const EditMerchantForm = ({ merchant, onSave, open, onClose }) => {

  console.log(merchant,'mechant edit log');
  
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

  // No more REQUIRED_FIELDS array — everything is optional now

  const validateField = (name, value) => {
    let result = { isValid: true, errorMessage: "" };

    // Only validate format / rules when field has value
    // No "is required" checks anymore

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
        // No required check anymore — only presence if you want to enforce it later
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
      [name]: !isValid && value ? errorMessage : undefined,
    }));
  };

  const handleCompanyTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, company_type: value }));
    setTouched((prev) => ({ ...prev, company_type: true }));

    // No required validation — only format if you add any later
    setValidationErrors((prev) => ({
      ...prev,
      company_type: undefined,
    }));
  };

  const validateForm = () => {
    const errors = {};

    // Validate only fields that have values (format validation)
    Object.keys(formData).forEach((field) => {
      if (formData[field] && typeof formData[field] === "string") {
        const { isValid, errorMessage } = validateField(field, formData[field]);
        if (!isValid) {
          errors[field] = errorMessage;
        }
      }
    });

    setValidationErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (uploadError) {
      showToast("Please resolve upload errors before saving.", "error");
      return;
    }

    if (!validateForm()) {
      showToast("Please fix the highlighted errors before saving.", "error");
      return;
    }

    const payload = { _id: formData._id };

    Object.keys(formData).forEach((key) => {
      if (key === "company_images" || key === "company_logo") {
        if (JSON.stringify(formData[key]) !== JSON.stringify(merchant?.[key] || [])) {
          payload[key] = formData[key];
        }
      } else if (formData[key] !== (merchant?.[key] ?? "")) {
        payload[key] = formData[key];
      }
    });

    onSave(payload);
  };

  // ── Logo upload ──────────────────────────────────────────────────────────
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
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
      const uploadFormData = new FormData();
      uploadFormData.append("logo", file);
      uploadFormData.append("company_name", merchant.company_name);

      const endpoint = merchant.company_logo ? "/update-logo" : "/upload-logo";
      const method = endpoint === "/upload-logo" ? "post" : "put";

      const response = await imageApi[method](
        endpoint,
        uploadFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setFormData((prev) => ({ ...prev, company_logo: response.data.logoUrl }));
      setLogoPreview(response.data.logoUrl);
      showToast("Logo uploaded successfully", "success");
    } catch (error) {
      console.error("Logo upload error:", error);
      showToast("Failed to upload logo. Please try again.", "error");
    }
  };

  // ── Multiple images upload ──────────────────────────────────────────────
  const handleImagesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(
      (f) => allowedImageTypes.includes(f.type) && f.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== files.length) {
      showToast("Some images are invalid. Use JPEG/PNG/GIF/WebP under 5MB.", "error");
      return;
    }

    setUploadError(null);

    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    try {
      const uploadFormData = new FormData();
      validFiles.forEach((file) => uploadFormData.append("files", file));
      uploadFormData.append("entity_type", "merchant");
      uploadFormData.append("company_name", merchant.company_name);

      const response = await imageApi.post("/upload-company-image", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newUrls = response.data.files?.map((f) => f.fileUrl) || [];

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

  // ── Remove single image ─────────────────────────────────────────────────
  const removeImage = async (index) => {
    const imageUrl = formData.company_images[index];
    if (!imageUrl) return;

    const filename = imageUrl.split("/").pop();

    try {
      await imageApi.delete("/delete-company-image", {
        data: {
          entity_type: "merchant",
          company_name: merchant.company_name,
          filename,
        },
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

  // ── Remove single logo ─────────────────────────────────────────────────
  const removeLogo = async () => {
    // If it's a new unsaved logo or just a preview, clear it
    if (!formData.company_logo) {
      setLogoPreview("");
      return;
    }

    try {
      await imageApi.delete("/delete-logo", {
        data: {
          company_name: merchant.company_name,
        },
      });

      setFormData((prev) => ({ ...prev, company_logo: "" }));
      setLogoPreview("");
      showToast("Logo removed successfully", "success");
    } catch (error) {
      console.error("Delete logo error:", error);
      showToast("Failed to delete logo.", "error");
    }
  };


  if (!merchant) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="p-0 bg-white overflow-hidden"
        style={{
          width: "80vw",
          maxWidth: "80vw",
          height: "80vh",
          maxHeight: "80vh",
        }}
      >
        <div className="flex items-center justify-between p-5 sm:p-6 bg-gradient-to-r from-[#0c1f4d] to-[#1e3a8a] text-white sticky top-0 z-10 border-b border-white/20">
          <div className="flex justify-between w-full items-center">
            <h1 className="text-2xl sm:text-2xl font-bold tracking-tight">
              {merchant.company_name}
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

        <div className="mt-1 p-4 overflow-y-scroll rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Edit Merchant</h2>

          {uploadError && (
            <p className="text-red-600 bg-red-50 p-3 rounded mb-4">{uploadError}</p>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <Input
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="e.g. Acme Corp"
                className="border-2 border-slate-300"
              />
            </div>

            {/* Email – no * */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
              <Input
                name="company_email"
                value={formData.company_email}
                placeholder="e.g. hello@acme.com"
                onChange={handleChange}
                onBlur={() => setTouched((prev) => ({ ...prev, company_email: true }))}
                className={`border-2 border-slate-300 ${validationErrors.company_email ? "border-red-500" : ""}`}
              />
              {touched.company_email && validationErrors.company_email && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.company_email}</p>
              )}
            </div>

            {/* Phone – no * */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Phone Number</label>
              <Input
                name="company_phone_number"
                value={formData.company_phone_number}
                placeholder="e.g. +91 98765 43210"
                onChange={handleChange}
                onBlur={() => setTouched((prev) => ({ ...prev, company_phone_number: true }))}
                className={`border-2 border-slate-300 ${validationErrors.company_phone_number ? "border-red-500" : ""}`}
              />
              {touched.company_phone_number && validationErrors.company_phone_number && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.company_phone_number}</p>
              )}
            </div>

            {/* Company Type – no * */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Type</label>

              {loadingTypes ? (
                <div className="text-gray-500 py-2.5">Loading company types...</div>
              ) : companyTypes.length === 0 ? (
                <div className="text-red-500 py-2.5">No company types available</div>
              ) : (
                <Select
                  value={formData.company_type}
                  onValueChange={handleCompanyTypeChange}
                  disabled={loadingTypes}
                >
                  <SelectTrigger
                    className={`border-2 border-slate-300 ${validationErrors.company_type ? "border-red-500" : ""}`}
                    onBlur={() => setTouched((prev) => ({ ...prev, company_type: true }))}
                  >
                    <SelectValue placeholder="e.g. Select company type" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyTypes.map((type) => (
                      <SelectItem key={type.name} value={type.name}>
                        {type.displayName || type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {touched.company_type && validationErrors.company_type && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.company_type}</p>
              )}
            </div>

            {/* GST – no * */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <Input
                name="gst_number"
                value={formData.gst_number}
                placeholder="e.g. 22ABCDE1234F1Z5"
                onChange={handleChange}
                onBlur={() => setTouched((prev) => ({ ...prev, gst_number: true }))}
                className={`border-2 border-slate-300 ${validationErrors.gst_number ? "border-red-500" : ""}`}
              />
              {touched.gst_number && validationErrors.gst_number && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.gst_number}</p>
              )}
            </div>

            {/* MSME – no * */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MSME Certificate Number</label>
              <Input
                name="msme_certificate_number"
                placeholder="e.g. UDYAM-TN-01-0000000"
                value={formData.msme_certificate_number}
                onChange={handleChange}
                onBlur={() => setTouched((prev) => ({ ...prev, msme_certificate_number: true }))}
                className={`border-2 border-slate-300 ${validationErrors.msme_certificate_number ? "border-red-500" : ""}`}
              />
              {touched.msme_certificate_number && validationErrors.msme_certificate_number && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.msme_certificate_number}</p>
              )}
            </div>

            {/* Remaining fields unchanged – already optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
              <Input
                name="pan"
                placeholder="e.g. ABCDE1234F"
                value={formData.pan}
                onChange={handleChange}
                className={`border-2 border-slate-300 ${validationErrors.pan ? "border-red-500" : ""}`}
              />
              {formData.pan && validationErrors.pan && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.pan}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar</label>
              <Input
                name="aadhar"
                placeholder="e.g. 1234 5678 9012"
                value={formData.aadhar}
                onChange={handleChange}
                className={`border-2 border-slate-300 ${validationErrors.aadhar ? "border-red-500" : ""}`}
              />
              {formData.aadhar && validationErrors.aadhar && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.aadhar}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Employees</label>
              <Input
                name="number_of_employees"
                type="number"
                value={formData.number_of_employees}
                placeholder="e.g. 50"
                onChange={handleChange}
                className={`border-2 border-slate-300 ${validationErrors.number_of_employees ? "border-red-500" : ""}`}
              />
              {formData.number_of_employees && validationErrors.number_of_employees && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.number_of_employees}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year of Establishment</label>
              <Input
                name="year_of_establishment"
                type="number"
                value={formData.year_of_establishment}
                placeholder="e.g. 2015"
                onChange={handleChange}
                className={`border-2 border-slate-300 ${validationErrors.year_of_establishment ? "border-red-500" : ""}`}
              />
              {formData.year_of_establishment && validationErrors.year_of_establishment && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.year_of_establishment}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                placeholder="e.g. Brief description about the company..."
                onChange={handleChange}
                onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                className={`w-full p-3 border-2 border-slate-300 rounded-md resize-y min-h-[90px] ${
                  validationErrors.description ? "border-red-500" : "border-gray-300"
                }`}
                rows={4}
              />
              {touched.description && validationErrors.description && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Video</label>
              <Input
                name="company_video"
                placeholder="e.g. https://youtube.com/watch?v=..."
                value={formData.company_video}
                onChange={handleChange}
                className={`border-2 border-slate-300 ${validationErrors.company_video ? "border-red-500" : ""}`}
              />
              {validationErrors.company_video && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.company_video}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
              {logoPreview && (
                <div className="relative inline-block group mb-3">
                  <img
                    src={logoPreview}
                    alt="Company logo preview"
                    className="w-28 h-28 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                    <p className="text-white text-[10px] font-bold">LOGO</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 shadow-lg transition-transform hover:scale-110 z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleLogoChange}
                className="border-2 border-slate-300"
              />
              <p className="text-xs text-gray-500 mt-1">Max 5MB • JPEG, PNG, GIF, WebP</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Images</label>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Company image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                        <p className="text-white text-[10px] font-bold uppercase">IMAGE</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 shadow-lg transition-transform hover:scale-110 z-10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImagesChange}
                className="border-2 border-slate-300"
              />
              <p className="text-xs text-gray-500 mt-1">Max 5MB per image • JPEG, PNG, GIF, WebP</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loadingTypes}
              className="bg-[#0c1f4d] hover:bg-[#1e3a8a] text-white order-1 sm:order-2"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMerchantForm;
