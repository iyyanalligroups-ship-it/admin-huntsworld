import { useState, useEffect, useRef, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AttributeForm from "@/modules/admin/pages/merchants/reusable/AttributeForm";
import {
  useUploadProductImageMutation,
  useDeleteProductImageMutation,
} from "@/redux/api/ProductImageApi";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
  useGetSuperSubCategoriesQuery,
  useGetDeepSubCategoriesQuery,
} from "@/redux/api/ProductApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useMerchant } from "@/modules/admin/context/MerchantContext";
import showToast from "@/toast/showToast";
import ProductNameAutocomplete from "../ProductNameAutocomplete";

const formatText = (text = "") => {
  return text
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const StepperProductForm = forwardRef(({ editingProduct, onClose }, ref) => {
  const [step, setStep] = useState(1);
  const { selectedMerchant } = useMerchant();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [errors, setErrors] = useState({
    product_name: "",
    price: "",

    description: "",
    unitOfMeasurement: "",
  });
  const [touched, setTouched] = useState({
    product_name: false,
    price: false,

    description: false,
    unitOfMeasurement: false,
  });
  const [customUnit, setCustomUnit] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [tagInput, setTagInput] = useState("");

  const unitOptions = [
    { label: "Kilogram", value: "kg" },
    { label: "Gram", value: "g" },
    { label: "Ton", value: "ton" },
    { label: "Piece", value: "pcs" },
    { label: "Liter", value: "ltr" },
    { label: "Meter", value: "m" },
    { label: "Centimeter", value: "cm" },
    { label: "Dozen", value: "dz" },
    { label: "Pack", value: "pk" },
    { label: "Other", value: "other" },
  ];

  const [formData, setFormData] = useState({
    seller_id: selectedMerchant?._id || "",
    sellerModel: "Merchant",
    product_name: "",
    price: "",
    stock_quantity: "",
    description: "",
    video_url: "",
    search_tags: [],
    product_image: [],
    unitOfMeasurement: "",
    askPrice: false,
  });


  const [categoryData, setCategoryData] = useState({
    category_id: "",
    sub_category_id: "",
    super_sub_category_id: "",
    deep_sub_category_id: "",
  });

  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);

  // Global "Others" hierarchy state
  const [globalOthers, setGlobalOthers] = useState(null);
  const [isInitializingOthers, setIsInitializingOthers] = useState(false);

  const [uploadImage] = useUploadProductImageMutation();
  const [deleteImage] = useDeleteProductImageMutation();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const fileInputRef = useRef(null);

  const { data: categories, isLoading: isCategoriesLoading } = useGetCategoriesQuery();

  const { data: subCategories, isLoading: isSubCategoriesLoading } =
    useGetSubCategoriesQuery(categoryData.category_id || skipToken);

  const { data: superSubCategories, isLoading: isSuperSubCategoriesLoading } =
    useGetSuperSubCategoriesQuery(categoryData.sub_category_id || skipToken);

  const { data: deepSubCategories, isLoading: isDeepSubCategoriesLoading } =
    useGetDeepSubCategoriesQuery(categoryData.super_sub_category_id || skipToken);

  // Function to fetch/initialize global "Others"
  const initializeGlobalOthers = async () => {
    if (isInitializingOthers) return;

    setIsInitializingOthers(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/categories/global-others-ids`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setGlobalOthers(data.data);
        showToast("Category system initialized successfully!", "success");
      } else {
        throw new Error(data.message || "Invalid response");
      }
    } catch (err) {
      console.error("Failed to initialize global others:", err);
      showToast("Failed to initialize category system. Retrying...", "error");
    } finally {
      setIsInitializingOthers(false);
    }
  };

  // Load global others on component mount
  useEffect(() => {
    initializeGlobalOthers();
  }, []);

  // Reset form when modal is used for adding (not editing)
  useEffect(() => {
    if (!editingProduct) {
      setCategoryData({
        category_id: "",
        sub_category_id: "",
        super_sub_category_id: "",
        deep_sub_category_id: "",
      });
      setFormData({
        seller_id: selectedMerchant?._id || "",
        sellerModel: "Merchant",
        product_name: "",
        price: "",
        stock_quantity: "",
        description: "",
        video_url: "",
        search_tags: [],
        product_image: [],
        unitOfMeasurement: "",
        askPrice: false,
      });
      setAttributes([{ key: "", value: "" }]);
      setErrors({
        product_name: "",
        price: "",
        description: "",
        unitOfMeasurement: "",
      });
      setTouched({
        product_name: false,
        price: false,
        description: false,
        unitOfMeasurement: false,
      });
      setCustomUnit("");
      setSelectedUnit("");
      setIsInitialLoad(true);
    }
  }, [editingProduct, selectedMerchant]);

  // Populate form when editing an existing product
  useEffect(() => {
    if (editingProduct) {
      const newFormData = {
        seller_id: selectedMerchant?._id || editingProduct.seller_id || "",
        sellerModel: "Merchant",
        product_name: editingProduct.product_name || "",
        price: parseFloat(editingProduct.price?.$numberDecimal || 0),
        stock_quantity: editingProduct.stock_quantity ?? editingProduct.quantity ?? "", 
        description: editingProduct.description || "",
        video_url: editingProduct.video_url || "",
        search_tags: Array.isArray(editingProduct.search_tags) ? editingProduct.search_tags : [],
        product_image: Array.isArray(editingProduct.product_image)
          ? editingProduct.product_image
          : [],
        unitOfMeasurement: editingProduct.unitOfMeasurement || "",
        askPrice: editingProduct.askPrice || false,
      };
      const newCategoryData = {
        category_id: editingProduct.category_id?._id || "",
        sub_category_id: editingProduct.sub_category_id?._id || "",
        super_sub_category_id: editingProduct.super_sub_category_id?._id || "",
        deep_sub_category_id: editingProduct.deep_sub_category_id?._id || "",
      };
      const newAttributes = editingProduct.attributes?.length > 0
        ? editingProduct.attributes.map((attr) => ({
            key: attr.attribute_key || attr.key || "",
            value: attr.attribute_value || attr.value || "",
          }))
        : [{ key: "", value: "" }];

      setFormData(newFormData);
      setCategoryData(newCategoryData);
      setAttributes(newAttributes);
      setSelectedUnit(
        unitOptions.some((unit) => unit.value === editingProduct.unitOfMeasurement)
          ? editingProduct.unitOfMeasurement
          : editingProduct.unitOfMeasurement
            ? "other"
            : ""
      );
      setCustomUnit(
        unitOptions.some((unit) => unit.value === editingProduct.unitOfMeasurement)
          ? ""
          : editingProduct.unitOfMeasurement || ""
      );
      setIsInitialLoad(false);
    }
  }, [editingProduct, selectedMerchant]);

  const validateStep = () => {
    if (step === 1) return !!categoryData.category_id;
    if (step === 2) {
      return (
        formData.product_name.trim() &&
        (formData.askPrice || (formData.price && parseFloat(formData.price) > 0)) &&
        parseFloat(formData.stock_quantity) >= 0 &&
        formData.description.trim() &&
        formData.unitOfMeasurement
      );
    }

    if (step === 3) {
      return attributes.every((attr) => {
        const hasKey = !!attr.key.trim();
        const hasValue = !!attr.value.trim();
        return (hasKey && hasValue) || (!hasKey && !hasValue);
      });
    }
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const newErrors = { ...errors };
    if (name === "product_name") {
      newErrors.product_name = formData.product_name.trim() ? "" : "Product name is required";
    } else if (name === "price") {
      const priceValue = parseFloat(formData.price);
      newErrors.price =
        formData.askPrice
          ? ""
          : (!priceValue || priceValue <= 0
            ? "Price must be greater than 0"
            : "");
    }

    else if (name === "description") {
      newErrors.description = formData.description.trim() ? "" : "Description is required";
    }
    setErrors(newErrors);
  };

  const handleUnitChange = (value) => {
    setSelectedUnit(value);
    if (value !== "other") {
      setCustomUnit("");
      setFormData((prev) => ({ ...prev, unitOfMeasurement: value }));
    } else {
      setFormData((prev) => ({ ...prev, unitOfMeasurement: customUnit.trim() || "" }));
    }
    setTouched((prev) => ({ ...prev, unitOfMeasurement: true }));
  };

  const handleCustomUnitChange = (e) => {
    const value = e.target.value.replace(/[^A-Za-z]/g, "");
    setCustomUnit(value);
    setFormData((prev) => ({ ...prev, unitOfMeasurement: value.trim() }));
  };

  const resizeImageTo500 = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 500;
        canvas.height = 500;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 500, 500);


        canvas.toBlob(
          (blob) => {
            const resizedFile = new File(
              [blob],
              file.name,
              { type: "image/jpeg" }
            );
            resolve(resizedFile);
          },
          "image/jpeg",
          0.9
        );
      };

      reader.readAsDataURL(file);
    });
  };


  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const formDataUpload = new FormData();
    formDataUpload.append("product_name", formData.product_name || "default");
    // files.forEach((file) => formDataUpload.append("product_image", file));
    for (const file of files) {
      const resizedFile = await resizeImageTo500(file);
      formDataUpload.append("product_image", resizedFile);
    }


    try {
      const res = await uploadImage(formDataUpload).unwrap();
      const newImageUrls = res?.imageUrls || [];

      if (newImageUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          product_image: [...(prev.product_image || []), ...newImageUrls],
        }));

        if (editingProduct) {
          await updateProduct({
            id: editingProduct._id,
            ...formData,
            product_image: [...(formData.product_image || []), ...newImageUrls],
            ...categoryData,
            attributes,
            unitOfMeasurement: formData.unitOfMeasurement,
          }).unwrap();
          showToast("Image uploaded and product updated", "success");
        }
      }
    } catch (err) {
      showToast(err?.data?.message || "Failed to upload images", "error");
    }
    e.target.value = null;
  };

  const handleImageDelete = async (url) => {
    const fileName = url.split("/").pop();
    try {
      await deleteImage({
        file_names: [fileName],
        product_name: editingProduct?.product_name || formData.product_name,
      }).unwrap();

      const updatedImages = formData.product_image.filter((img) => img !== url);
      setFormData((prev) => ({ ...prev, product_image: updatedImages }));

      if (editingProduct) {
        await updateProduct({
          id: editingProduct._id,
          ...formData,
          product_image: updatedImages,
          ...categoryData,
          attributes,
          unitOfMeasurement: formData.unitOfMeasurement,
        }).unwrap();
        showToast("Image deleted and product updated", "success");
      } else {
        showToast("Image deleted", "success");
      }
    } catch (error) {
      showToast(error?.data?.message || "Failed to delete image", "error");
    }
  };

  const handleAttrChange = (index, field, value) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  const addAttribute = () => setAttributes([...attributes, { key: "", value: "" }]);
  const removeAttribute = (index) => setAttributes(attributes.filter((_, i) => i !== index));

  const handleNext = () => {
    if (step === 2) {
      const newErrors = {
        product_name: formData.product_name.trim() ? "" : "Product name is required",
        price: formData.askPrice || (formData.price && parseFloat(formData.price) > 0) ? "" : "Price must be greater than 0",

        description: formData.description.trim() ? "" : "Description is required",
        unitOfMeasurement: formData.unitOfMeasurement ? "" : "Unit of measurement is required",
      };
      setErrors(newErrors);
      if (!Object.values(newErrors).every((error) => !error)) {
        showToast("Please fill all required fields", "error");
        return;
      }
    }

    if (validateStep()) {
      setStep(step + 1);
    } else {
      showToast("Please fill all required fields", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.seller_id) {
      showToast("Merchant not selected", "info");
      return;
    }

    if (!validateStep()) {
      showToast("Please fill all required fields", "error");
      return;
    }

    if (!globalOthers) {
      showToast("Category system not ready. Please wait or retry initialization.", "error");
      return;
    }

    // Auto-fill missing category levels with "Others"
    const filledCategoryData = {
      category_id: categoryData.category_id,
      sub_category_id: categoryData.sub_category_id || globalOthers.subCategoryId,
      super_sub_category_id: categoryData.super_sub_category_id || globalOthers.superSubCategoryId,
      deep_sub_category_id: categoryData.deep_sub_category_id || globalOthers.deepSubCategoryId,
    };

    const cleanAttributes = attributes
      .filter(attr => attr.key?.trim() && attr.value?.trim())
      .map(attr => ({ key: attr.key.trim(), value: attr.value.trim() }));

    const productPayload = {
      ...formData,
      ...filledCategoryData,
      attributes: cleanAttributes,
      price: formData.askPrice ? 0 : (parseFloat(formData.price) || 0),
      askPrice: formData.askPrice,
    };

    try {
      let res;
      if (editingProduct) {
        res = await updateProduct({
          id: editingProduct._id,
          ...productPayload,
        }).unwrap();
      } else {
        res = await createProduct(productPayload).unwrap();
      }

      if (res.success) {
        showToast(res.message || (editingProduct ? "Product Updated Successfully" : "Product Added Successfully"), "success");
        onClose?.();

        // Reset form after success
        setStep(1);
        setFormData({
          seller_id: selectedMerchant?._id || "",
          sellerModel: "Merchant",
          product_name: "",
          price: "",
          stock_quantity: "",
          description: "",
          video_url: "",
          search_tags: [],
          product_image: [],
          unitOfMeasurement: "",
          askPrice: false,
        });
        setCategoryData({
          category_id: "",
          sub_category_id: "",
          super_sub_category_id: "",
          deep_sub_category_id: "",
        });
        setAttributes([{ key: "", value: "" }]);
        setErrors({
          product_name: "",
          price: "",

          description: "",
          unitOfMeasurement: "",
        });
        setTouched({
          product_name: false,
          price: false,

          description: false,
          unitOfMeasurement: false,
          askPrice: false,
        });
        setCustomUnit("");
        setSelectedUnit("");
      } else {
        showToast(res.message || "Operation failed", "error");
      }
    } catch (error) {
      console.error("Create/Update Product Error:", error);
      showToast(error?.data?.message || "Error processing product", "error");
    }
  };

  // Loading / Initialization UI
  if (isInitializingOthers) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#0c1f4d]" />
        <p className="text-lg text-gray-700">Initializing category system...</p>
        <p className="text-sm text-gray-500">This may take a few seconds</p>
      </div>
    );
  }

  if (!globalOthers) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-6">
        <p className="text-xl font-medium text-red-600">Category system not initialized</p>
        <p className="text-center text-gray-600 max-w-md">
          The required "Others" category hierarchy is missing. Click the button below to create it.
        </p>
        <Button
          onClick={initializeGlobalOthers}
          disabled={isInitializingOthers}
          className="bg-[#0c1f4d] hover:bg-[#153171]"
        >
          {isInitializingOthers ? "Initializing..." : "Initialize Category System"}
        </Button>
      </div>
    );
  }

  // Main Form (only shown when globalOthers is ready)
  return (
    <div ref={ref}>
      <form className="p-6 bg-white rounded-2xl shadow-md max-w-2xl mx-auto">
        <div className="flex justify-between mb-6">
          {["Category", "Basic Info", "Attributes"].map((label, index) => (
            <div
              key={index}
              className={`w-full text-center py-2 border-b-2 ${step === index + 1
                ? "border-blue-600 font-semibold"
                : "border-gray-300"
                }`}
            >
              Step {index + 1}: {label}
            </div>
          ))}
        </div>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Note: If you don't select lower categories, they will be automatically set to "Others".
            </p>

            {isCategoriesLoading ? (
              <p>Loading categories...</p>
            ) : (
              <>
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select
                  value={categoryData.category_id}
                  onValueChange={(value) =>
                    setCategoryData((prev) => ({
                      ...prev,
                      category_id: value,
                      sub_category_id: "",
                      super_sub_category_id: "",
                      deep_sub_category_id: "",
                    }))
                  }
                >
                  <SelectTrigger className="w-full border-2 border-slate-300">
                    <SelectValue placeholder="e.g. Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.data?.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {formatText(cat.category_name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {categoryData.category_id && (
              <>
                {isSubCategoriesLoading ? (
                  <p>Loading sub-categories...</p>
                ) : (
                  <>
                    <Label>Sub Category</Label>
                    <Select
                      value={categoryData.sub_category_id}
                      onValueChange={(value) =>
                        setCategoryData((prev) => ({
                          ...prev,
                          sub_category_id: value,
                          super_sub_category_id: "",
                          deep_sub_category_id: "",
                        }))
                      }
                      disabled={!subCategories?.data?.length}
                    >
                      <SelectTrigger className="w-full border-2 border-slate-300">
                        <SelectValue placeholder="e.g. Select Sub Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {subCategories?.data?.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {formatText(cat.sub_category_name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </>
            )}

            {categoryData.sub_category_id && (
              <>
                {isSuperSubCategoriesLoading ? (
                  <p>Loading super sub-categories...</p>
                ) : (
                  <>
                    <Label>Super Sub Category</Label>
                    <Select
                      value={categoryData.super_sub_category_id}
                      onValueChange={(value) =>
                        setCategoryData((prev) => ({
                          ...prev,
                          super_sub_category_id: value,
                          deep_sub_category_id: "",
                        }))
                      }
                      disabled={!superSubCategories?.data?.length}
                    >
                      <SelectTrigger className="w-full border-2 border-slate-300">
                        <SelectValue placeholder="e.g. Select Super Sub Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {superSubCategories?.data?.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {formatText(cat.super_sub_category_name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </>
            )}

            {categoryData.super_sub_category_id && (
              <>
                {isDeepSubCategoriesLoading ? (
                  <p>Loading deep sub-categories...</p>
                ) : (
                  <>
                    <Label>Deep Sub Category</Label>
                    <Select
                      value={categoryData.deep_sub_category_id}
                      onValueChange={(value) =>
                        setCategoryData((prev) => ({
                          ...prev,
                          deep_sub_category_id: value,
                        }))
                      }
                      disabled={!deepSubCategories?.data?.length}
                    >
                      <SelectTrigger className="w-full border-2 border-slate-300">
                        <SelectValue placeholder="e.g. Select Deep Sub Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {deepSubCategories?.data?.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {formatText(cat.deep_sub_category_name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="product_name">Product Name <span className="text-red-500">*</span></Label>
              <ProductNameAutocomplete
                value={formData.product_name}
                onChange={handleInputChange}
              />
            </div>




            <div>
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Input
                id="description"
                name="description"
                placeholder="e.g. High-performance smartphone with 128GB storage"
                value={formData.description}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={isCreating || isUpdating}
                className="border-2 border-slate-300"
              />
              {touched.description && errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="video_url">Video URL (optional)</Label>
              <Input
                id="video_url"
                name="video_url"
                placeholder="e.g. https://youtu.be/abc"
                value={formData.video_url}
                onChange={handleInputChange}
                disabled={isCreating || isUpdating}
                className="border-2 border-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Price */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="price">
                  Price {!formData.askPrice && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 15000"
                  value={formData.price}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isCreating || isUpdating || formData.askPrice}
                  className={`border-2 border-slate-300 ${formData.askPrice ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="askPrice"
                    name="askPrice"
                    checked={formData.askPrice}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="askPrice" className="text-sm text-gray-700 cursor-pointer select-none">
                    Ask Price from User
                  </label>
                </div>
                {touched.price && errors.price && !formData.askPrice && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="stock_quantity">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="stock_quantity"
                  name="stock_quantity"
                  type="number"
                  min="0"
                  placeholder="e.g. 100"
                  value={formData.stock_quantity ?? ""}
                  onChange={handleInputChange}
                  disabled={isCreating || isUpdating}
                  className="border-2 border-slate-300"
                />
              </div>

              {/* Unit */}
              <div>
                <Label htmlFor="unitOfMeasurement">
                  Unit <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedUnit}
                  onValueChange={handleUnitChange}
                  disabled={isCreating || isUpdating}
                >
                  <SelectTrigger className="w-full border-2 border-slate-300">
                    <SelectValue placeholder="e.g. Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedUnit === "other" && (
                  <Input
                    type="text"
                    placeholder="e.g. Box"
                    value={customUnit}
                    onChange={handleCustomUnitChange}
                    className="mt-2 border-2 border-slate-300"
                  />
                )}
              </div>

            </div>


            <div>
              <Label>Search Tags (Optional)</Label>
              <div className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 rounded-lg min-h-12 bg-gray-50 mt-2">
                {formData.search_tags?.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    {tag}
                    <button type="button" onClick={() => setFormData(p => ({ ...p, search_tags: p.search_tags.filter((_, idx) => idx !== i) }))} className="ml-2 hover:bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-lg">×</button>
                  </span>
                ))}
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const val = tagInput.trim().toLowerCase();
                    if (val && !formData.search_tags.includes(val)) {
                      setFormData(p => ({ ...p, search_tags: [...p.search_tags, val] }));
                      setTagInput("");
                    }
                  }
                }} placeholder="Type keyword and press Enter..." className="flex-1 min-w-64 outline-none bg-transparent text-sm placeholder-gray-500" disabled={isCreating || isUpdating} />
              </div>
            </div>

            <div className="mt-6">
              <Label>Product Images</Label>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={isCreating || isUpdating}
              />

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-4">

                {/* Existing Images */}
                {formData.product_image?.map((url, index) => (
                  <div
                    key={index}
                    className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200"
                  >
                    <img
                      src={`${encodeURI(url)}?t=${Date.now()}`}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Delete Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => handleImageDelete(url)}
                        disabled={isCreating || isUpdating}
                        className="h-9 w-9 bg-white/20 hover:bg-red-500 text-white backdrop-blur-sm rounded-full"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCreating || isUpdating}
                  className="flex flex-col cursor-pointer items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors group disabled:opacity-50"
                >
                  <div className="p-2 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 mt-2 group-hover:text-blue-600">
                    Add Image
                  </span>
                </button>

              </div>
            </div>

          </div>
        )}

        {/* Step 3: Attributes */}
        {step === 3 && (
          <AttributeForm
            attributes={attributes}
            handleAttrChange={handleAttrChange}
            addAttribute={addAttribute}
            removeAttribute={removeAttribute}
          />
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => setStep(step - 1)}
              disabled={isCreating || isUpdating}
            >
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isCreating || isUpdating || !validateStep()}
              className="bg-[#0c1f4d] cursor-pointer hover:bg-[#153171] text-white flex items-center gap-2"
            >
              {isCreating || isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Next"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isCreating || isUpdating || !validateStep()}
              className="bg-[#0c1f4d] hover:bg-[#153171] text-white flex items-center gap-2"
            >
              {isCreating || isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {editingProduct ? "Updating..." : "Creating..."}
                </>
              ) : editingProduct ? (
                "Update Product"
              ) : (
                "Add Product"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
});

StepperProductForm.displayName = "StepperProductForm";

export default StepperProductForm;
