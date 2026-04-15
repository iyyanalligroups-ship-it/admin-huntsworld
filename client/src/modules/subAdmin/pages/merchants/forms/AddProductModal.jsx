// import { useState, useEffect, forwardRef } from "react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Trash2, Loader2 } from "lucide-react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import AttributeForm from "@/modules/admin/pages/merchants/reusable/AttributeForm";
// import {
//   useUploadProductImageMutation,
//   useDeleteProductImageMutation,
// } from "@/redux/api/ProductImageApi";
// import {
//   useCreateProductMutation,
//   useUpdateProductMutation,
//   useGetCategoriesQuery,
//   useGetSubCategoriesQuery,
//   useGetSuperSubCategoriesQuery,
//   useGetDeepSubCategoriesQuery,
// } from "@/redux/api/ProductApi";
// import { skipToken } from "@reduxjs/toolkit/query";
// import { useMerchant } from "@/modules/admin/context/MerchantContext";
// import showToast from "@/toast/showToast";
// import ProductNameAutocomplete from "@/modules/admin/pages/merchants/ProductNameAutocomplete";

// const formatText = (text = "") => {
//   return text
//     .replace(/-/g, " ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());
// };

// const StepperProductForm = forwardRef(({ editingProduct, onClose }, ref) => {
//   const [step, setStep] = useState(1);
//   const { selectedMerchant } = useMerchant();
//   const [isInitialLoad, setIsInitialLoad] = useState(true);
//   const [errors, setErrors] = useState({
//     product_name: "",
//     price: "",
//     stock_quantity: "",
//     description: "",
//     unitOfMeasurement: "",
//   });
//   const [touched, setTouched] = useState({
//     product_name: false,
//     price: false,
//     stock_quantity: false,
//     description: false,
//     unitOfMeasurement: false,
//   });
//   const [customUnit, setCustomUnit] = useState("");
//   const [selectedUnit, setSelectedUnit] = useState("");

//   const unitOptions = [
//     { label: "Kilogram", value: "kg" },
//     { label: "Gram", value: "g" },
//     { label: "Ton", value: "ton" },
//     { label: "Piece", value: "pcs" },
//     { label: "Liter", value: "ltr" },
//     { label: "Meter", value: "m" },
//     { label: "Centimeter", value: "cm" },
//     { label: "Dozen", value: "dz" },
//     { label: "Pack", value: "pk" },
//     { label: "Other", value: "other" },
//   ];

//   const [formData, setFormData] = useState({
//     seller_id: selectedMerchant?._id || "",
//     sellerModel: "Merchant",
//     product_name: "",
//     price: "",
//     stock_quantity: "",
//     description: "",
//     product_image: [],
//     unitOfMeasurement: "",
//   });

//   const [categoryData, setCategoryData] = useState({
//     category_id: "",
//     sub_category_id: "",
//     super_sub_category_id: "",
//     deep_sub_category_id: "",
//   });

//   const [attributes, setAttributes] = useState([{ key: "", value: "" }]);

//   // Global "Others" hierarchy state
//   const [globalOthers, setGlobalOthers] = useState(null);
//   const [isInitializingOthers, setIsInitializingOthers] = useState(false);

//   const [uploadImage] = useUploadProductImageMutation();
//   const [deleteImage] = useDeleteProductImageMutation();
//   const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
//   const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

//   const { data: categories, isLoading: isCategoriesLoading } = useGetCategoriesQuery();

//   const { data: subCategories, isLoading: isSubCategoriesLoading } =
//     useGetSubCategoriesQuery(categoryData.category_id || skipToken);

//   const { data: superSubCategories, isLoading: isSuperSubCategoriesLoading } =
//     useGetSuperSubCategoriesQuery(categoryData.sub_category_id || skipToken);

//   const { data: deepSubCategories, isLoading: isDeepSubCategoriesLoading } =
//     useGetDeepSubCategoriesQuery(categoryData.super_sub_category_id || skipToken);

//   // Function to fetch/initialize global "Others"
//   const initializeGlobalOthers = async () => {
//     if (isInitializingOthers) return;

//     setIsInitializingOthers(true);
//     try {
//       const apiUrl = import.meta.env.VITE_API_URL;
//       const response = await fetch(`${apiUrl}/categories/global-others-ids`);

//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}`);
//       }

//       const data = await response.json();

//       if (data.success && data.data) {
//         setGlobalOthers(data.data);
//         showToast("Category system initialized successfully!", "success");
//       } else {
//         throw new Error(data.message || "Invalid response");
//       }
//     } catch (err) {
//       console.error("Failed to initialize global others:", err);
//       showToast("Failed to initialize category system. Retrying...", "error");
//     } finally {
//       setIsInitializingOthers(false);
//     }
//   };

//   // Load global others on component mount
//   useEffect(() => {
//     initializeGlobalOthers();
//   }, []);

//   // Reset form when modal is used for adding (not editing)
//   useEffect(() => {
//     if (!editingProduct) {
//       setCategoryData({
//         category_id: "",
//         sub_category_id: "",
//         super_sub_category_id: "",
//         deep_sub_category_id: "",
//       });
//       setFormData({
//         seller_id: selectedMerchant?._id || "",
//         sellerModel: "Merchant",
//         product_name: "",
//         price: "",
//         stock_quantity: "",
//         description: "",
//         product_image: [],
//         unitOfMeasurement: "",
//       });
//       setAttributes([{ key: "", value: "" }]);
//       setErrors({
//         product_name: "",
//         price: "",
//         stock_quantity: "",
//         description: "",
//         unitOfMeasurement: "",
//       });
//       setTouched({
//         product_name: false,
//         price: false,
//         stock_quantity: false,
//         description: false,
//         unitOfMeasurement: false,
//       });
//       setCustomUnit("");
//       setSelectedUnit("");
//       setIsInitialLoad(true);
//     }
//   }, [editingProduct, selectedMerchant]);

//   // Populate form when editing an existing product
//   useEffect(() => {
//     if (editingProduct) {
//       const newFormData = {
//         seller_id: selectedMerchant?._id || editingProduct.seller_id || "",
//         sellerModel: "Merchant",
//         product_name: editingProduct.product_name || "",
//         price: parseFloat(editingProduct.price?.$numberDecimal || 0),
//         stock_quantity: editingProduct.stock_quantity || "",
//         description: editingProduct.description || "",
//         product_image: Array.isArray(editingProduct.product_image)
//           ? editingProduct.product_image
//           : [],
//         unitOfMeasurement: editingProduct.unitOfMeasurement || "",
//       };
//       const newCategoryData = {
//         category_id: editingProduct.category_id?._id || "",
//         sub_category_id: editingProduct.sub_category_id?._id || "",
//         super_sub_category_id: editingProduct.super_sub_category_id?._id || "",
//         deep_sub_category_id: editingProduct.deep_sub_category_id?._id || "",
//       };
//       const newAttributes = editingProduct.attributes?.map((attr) => ({
//         key: attr.attribute_key,
//         value: attr.attribute_value,
//       })) || [{ key: "", value: "" }];

//       setFormData(newFormData);
//       setCategoryData(newCategoryData);
//       setAttributes(newAttributes);
//       setSelectedUnit(
//         unitOptions.some((unit) => unit.value === editingProduct.unitOfMeasurement)
//           ? editingProduct.unitOfMeasurement
//           : editingProduct.unitOfMeasurement
//             ? "other"
//             : ""
//       );
//       setCustomUnit(
//         unitOptions.some((unit) => unit.value === editingProduct.unitOfMeasurement)
//           ? ""
//           : editingProduct.unitOfMeasurement || ""
//       );
//       setIsInitialLoad(false);
//     }
//   }, [editingProduct, selectedMerchant]);

//   const validateStep = () => {
//     if (step === 1) return !!categoryData.category_id;
//     if (step === 2) {
//       const newErrors = {
//         product_name: formData.product_name.trim() ? "" : "Product name is required",
//         price: formData.price && parseFloat(formData.price) > 0 ? "" : "Price must be greater than 0",
//         stock_quantity: formData.stock_quantity && parseInt(formData.stock_quantity) >= 0 ? "" : "Stock quantity must be 0 or greater",
//         description: formData.description.trim() ? "" : "Description is required",
//         unitOfMeasurement: formData.unitOfMeasurement ? "" : "Unit of measurement is required",
//       };
//       return Object.values(newErrors).every((error) => !error);
//     }
//     if (step === 3) {
//       return attributes.every((attr) => attr.key.trim() && attr.value.trim());
//     }
//     return true;
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: name === "price" || name === "stock_quantity" ? value : value.trim(),
//     }));
//     setTouched((prev) => ({ ...prev, [name]: true }));
//   };

//   const handleBlur = (e) => {
//     const { name } = e.target;
//     setTouched((prev) => ({ ...prev, [name]: true }));
//     const newErrors = { ...errors };
//     if (name === "product_name") {
//       newErrors.product_name = formData.product_name.trim() ? "" : "Product name is required";
//     } else if (name === "price") {
//       newErrors.price = formData.price && parseFloat(formData.price) > 0 ? "" : "Price must be greater than 0";
//     } else if (name === "stock_quantity") {
//       newErrors.stock_quantity = formData.stock_quantity && parseInt(formData.stock_quantity) >= 0 ? "" : "Stock quantity must be 0 or greater";
//     } else if (name === "description") {
//       newErrors.description = formData.description.trim() ? "" : "Description is required";
//     }
//     setErrors(newErrors);
//   };

//   const handleUnitChange = (value) => {
//     setSelectedUnit(value);
//     if (value !== "other") {
//       setCustomUnit("");
//       setFormData((prev) => ({ ...prev, unitOfMeasurement: value }));
//     } else {
//       setFormData((prev) => ({ ...prev, unitOfMeasurement: customUnit.trim() || "" }));
//     }
//     setTouched((prev) => ({ ...prev, unitOfMeasurement: true }));
//   };

//   const handleCustomUnitChange = (e) => {
//     const value = e.target.value.replace(/[^A-Za-z]/g, "");
//     setCustomUnit(value);
//     setFormData((prev) => ({ ...prev, unitOfMeasurement: value.trim() }));
//   };

//   const handleFileChange = async (e) => {
//     const files = Array.from(e.target.files);
//     if (!files.length) return;

//     const formDataUpload = new FormData();
//     formDataUpload.append("product_name", formData.product_name || "default");
//     files.forEach((file) => formDataUpload.append("product_image", file));

//     try {
//       const res = await uploadImage(formDataUpload).unwrap();
//       const newImageUrls = res?.imageUrls || [];

//       if (newImageUrls.length > 0) {
//         setFormData((prev) => ({
//           ...prev,
//           product_image: [...(prev.product_image || []), ...newImageUrls],
//         }));

//         if (editingProduct) {
//           await updateProduct({
//             id: editingProduct._id,
//             ...formData,
//             product_image: [...(formData.product_image || []), ...newImageUrls],
//             ...categoryData,
//             attributes,
//             unitOfMeasurement: formData.unitOfMeasurement,
//           }).unwrap();
//           showToast("Image uploaded and product updated", "success");
//         }
//       }
//     } catch (err) {
//       showToast(err?.data?.message || "Failed to upload images", "error");
//     }
//     e.target.value = null;
//   };

//   const handleImageDelete = async (url) => {
//     const fileName = url.split("/").pop();
//     try {
//       await deleteImage({
//         file_names: [fileName],
//         product_name: editingProduct?.product_name || formData.product_name,
//       }).unwrap();

//       const updatedImages = formData.product_image.filter((img) => img !== url);
//       setFormData((prev) => ({ ...prev, product_image: updatedImages }));

//       if (editingProduct) {
//         await updateProduct({
//           id: editingProduct._id,
//           ...formData,
//           product_image: updatedImages,
//           ...categoryData,
//           attributes,
//           unitOfMeasurement: formData.unitOfMeasurement,
//         }).unwrap();
//         showToast("Image deleted and product updated", "success");
//       } else {
//         showToast("Image deleted", "success");
//       }
//     } catch (error) {
//       showToast(error?.data?.message || "Failed to delete image", "error");
//     }
//   };

//   const handleAttrChange = (index, field, value) => {
//     const updated = [...attributes];
//     updated[index][field] = value;
//     setAttributes(updated);
//   };

//   const addAttribute = () => setAttributes([...attributes, { key: "", value: "" }]);
//   const removeAttribute = (index) => setAttributes(attributes.filter((_, i) => i !== index));

//   const handleNext = () => {
//     if (step === 2) {
//       const newErrors = {
//         product_name: formData.product_name.trim() ? "" : "Product name is required",
//         price: formData.price && parseFloat(formData.price) > 0 ? "" : "Price must be greater than 0",
//         stock_quantity: formData.stock_quantity && parseInt(formData.stock_quantity) >= 0 ? "" : "Stock quantity must be 0 or greater",
//         description: formData.description.trim() ? "" : "Description is required",
//         unitOfMeasurement: formData.unitOfMeasurement ? "" : "Unit of measurement is required",
//       };
//       setErrors(newErrors);
//       if (!Object.values(newErrors).every((error) => !error)) {
//         showToast("Please fill all required fields", "error");
//         return;
//       }
//     }

//     if (validateStep()) {
//       setStep(step + 1);
//     } else {
//       showToast("Please fill all required fields", "error");
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.seller_id) {
//       showToast("Merchant not selected", "info");
//       return;
//     }

//     if (!validateStep()) {
//       showToast("Please fill all required fields", "error");
//       return;
//     }

//     if (!globalOthers) {
//       showToast("Category system not ready. Please wait or retry initialization.", "error");
//       return;
//     }

//     // Auto-fill missing category levels with "Others"
//     const filledCategoryData = {
//       category_id: categoryData.category_id,
//       sub_category_id: categoryData.sub_category_id || globalOthers.subCategoryId,
//       super_sub_category_id: categoryData.super_sub_category_id || globalOthers.superSubCategoryId,
//       deep_sub_category_id: categoryData.deep_sub_category_id || globalOthers.deepSubCategoryId,
//     };

//     const productPayload = {
//       ...formData,
//       ...filledCategoryData,
//       attributes,
//       unitOfMeasurement: formData.unitOfMeasurement,
//     };

//     try {
//       let res;
//       if (editingProduct) {
//         res = await updateProduct({
//           id: editingProduct._id,
//           ...productPayload,
//         }).unwrap();
//       } else {
//         res = await createProduct(productPayload).unwrap();
//       }

//       if (res.success) {
//         showToast(res.message || (editingProduct ? "Product Updated Successfully" : "Product Added Successfully"), "success");
//         onClose?.();

//         // Reset form after success
//         setStep(1);
//         setFormData({
//           seller_id: selectedMerchant?._id || "",
//           sellerModel: "Merchant",
//           product_name: "",
//           price: "",
//           stock_quantity: "",
//           description: "",
//           product_image: [],
//           unitOfMeasurement: "",
//         });
//         setCategoryData({
//           category_id: "",
//           sub_category_id: "",
//           super_sub_category_id: "",
//           deep_sub_category_id: "",
//         });
//         setAttributes([{ key: "", value: "" }]);
//         setErrors({
//           product_name: "",
//           price: "",
//           stock_quantity: "",
//           description: "",
//           unitOfMeasurement: "",
//         });
//         setTouched({
//           product_name: false,
//           price: false,
//           stock_quantity: false,
//           description: false,
//           unitOfMeasurement: false,
//         });
//         setCustomUnit("");
//         setSelectedUnit("");
//       } else {
//         showToast(res.message || "Operation failed", "error");
//       }
//     } catch (error) {
//       console.error("Create/Update Product Error:", error);
//       showToast(error?.data?.message || "Error processing product", "error");
//     }
//   };

//   // Loading / Initialization UI
//   if (isInitializingOthers) {
//     return (
//       <div className="flex flex-col items-center justify-center p-12 space-y-4">
//         <Loader2 className="h-10 w-10 animate-spin text-[#0c1f4d]" />
//         <p className="text-lg text-gray-700">Initializing category system...</p>
//         <p className="text-sm text-gray-500">This may take a few seconds</p>
//       </div>
//     );
//   }

//   if (!globalOthers) {
//     return (
//       <div className="flex flex-col items-center justify-center p-12 space-y-6">
//         <p className="text-xl font-medium text-red-600">Category system not initialized</p>
//         <p className="text-center text-gray-600 max-w-md">
//           The required "Others" category hierarchy is missing. Click the button below to create it.
//         </p>
//         <Button
//           onClick={initializeGlobalOthers}
//           disabled={isInitializingOthers}
//           className="bg-[#0c1f4d] hover:bg-[#153171]"
//         >
//           {isInitializingOthers ? "Initializing..." : "Initialize Category System"}
//         </Button>
//       </div>
//     );
//   }

//   // Main Form (only shown when globalOthers is ready)
//   return (
//     <div ref={ref}>
//       <form className="p-6 bg-white rounded-2xl shadow-md max-w-2xl mx-auto">
//         <div className="flex justify-between mb-6">
//           {["Category", "Basic Info", "Attributes"].map((label, index) => (
//             <div
//               key={index}
//               className={`w-full text-center py-2 border-b-2 ${
//                 step === index + 1
//                   ? "border-blue-600 font-semibold"
//                   : "border-gray-300"
//               }`}
//             >
//               Step {index + 1}: {label}
//             </div>
//           ))}
//         </div>

//         {/* Step 1: Category Selection */}
//         {step === 1 && (
//           <div className="space-y-4">
//             <p className="text-xs text-gray-500">
//               Note: If you don't select lower categories, they will be automatically set to "Others".
//             </p>

//             {isCategoriesLoading ? (
//               <p>Loading categories...</p>
//             ) : (
//               <>
//                 <Label>Category <span className="text-red-500">*</span></Label>
//                 <Select
//                   value={categoryData.category_id}
//                   onValueChange={(value) =>
//                     setCategoryData((prev) => ({
//                       ...prev,
//                       category_id: value,
//                       sub_category_id: "",
//                       super_sub_category_id: "",
//                       deep_sub_category_id: "",
//                     }))
//                   }
//                 >
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select Category" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {categories?.data?.map((cat) => (
//                       <SelectItem key={cat._id} value={cat._id}>
//                         {formatText(cat.category_name)}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </>
//             )}

//             {categoryData.category_id && (
//               <>
//                 {isSubCategoriesLoading ? (
//                   <p>Loading sub-categories...</p>
//                 ) : (
//                   <>
//                     <Label>Sub Category</Label>
//                     <Select
//                       value={categoryData.sub_category_id}
//                       onValueChange={(value) =>
//                         setCategoryData((prev) => ({
//                           ...prev,
//                           sub_category_id: value,
//                           super_sub_category_id: "",
//                           deep_sub_category_id: "",
//                         }))
//                       }
//                       disabled={!subCategories?.data?.length}
//                     >
//                       <SelectTrigger className="w-full">
//                         <SelectValue placeholder="Select Sub Category (Optional)" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {subCategories?.data?.map((cat) => (
//                           <SelectItem key={cat._id} value={cat._id}>
//                             {formatText(cat.sub_category_name)}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </>
//                 )}
//               </>
//             )}

//             {categoryData.sub_category_id && (
//               <>
//                 {isSuperSubCategoriesLoading ? (
//                   <p>Loading super sub-categories...</p>
//                 ) : (
//                   <>
//                     <Label>Super Sub Category</Label>
//                     <Select
//                       value={categoryData.super_sub_category_id}
//                       onValueChange={(value) =>
//                         setCategoryData((prev) => ({
//                           ...prev,
//                           super_sub_category_id: value,
//                           deep_sub_category_id: "",
//                         }))
//                       }
//                       disabled={!superSubCategories?.data?.length}
//                     >
//                       <SelectTrigger className="w-full">
//                         <SelectValue placeholder="Select Super Sub Category (Optional)" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {superSubCategories?.data?.map((cat) => (
//                           <SelectItem key={cat._id} value={cat._id}>
//                             {formatText(cat.super_sub_category_name)}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </>
//                 )}
//               </>
//             )}

//             {categoryData.super_sub_category_id && (
//               <>
//                 {isDeepSubCategoriesLoading ? (
//                   <p>Loading deep sub-categories...</p>
//                 ) : (
//                   <>
//                     <Label>Deep Sub Category</Label>
//                     <Select
//                       value={categoryData.deep_sub_category_id}
//                       onValueChange={(value) =>
//                         setCategoryData((prev) => ({
//                           ...prev,
//                           deep_sub_category_id: value,
//                         }))
//                       }
//                       disabled={!deepSubCategories?.data?.length}
//                     >
//                       <SelectTrigger className="w-full">
//                         <SelectValue placeholder="Select Deep Sub Category (Optional)" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {deepSubCategories?.data?.map((cat) => (
//                           <SelectItem key={cat._id} value={cat._id}>
//                             {formatText(cat.deep_sub_category_name)}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </>
//                 )}
//               </>
//             )}
//           </div>
//         )}

//         {/* Step 2: Basic Info */}
//         {step === 2 && (
//           <div className="space-y-4">
//             <div>
//               <Label htmlFor="product_name">Product Name <span className="text-red-500">*</span></Label>
//               <ProductNameAutocomplete
//                 value={formData.product_name}
//                 onChange={handleInputChange}
//               />
//             </div>

//             <div>
//               <Label htmlFor="price">Price <span className="text-red-500">*</span></Label>
//               <Input
//                 id="price"
//                 name="price"
//                 type="number"
//                 placeholder="Enter price"
//                 value={formData.price}
//                 onChange={handleInputChange}
//                 onBlur={handleBlur}
//                 disabled={isCreating || isUpdating}
//               />
//               {touched.price && errors.price && (
//                 <p className="text-red-500 text-sm mt-1">{errors.price}</p>
//               )}
//             </div>

//             <div>
//               <Label htmlFor="stock_quantity">Stock Quantity</Label>
//               <Input
//                 id="stock_quantity"
//                 name="stock_quantity"
//                 type="number"
//                 placeholder="Enter stock quantity"
//                 value={formData.stock_quantity}
//                 onChange={handleInputChange}
//                 onBlur={handleBlur}
//                 disabled={isCreating || isUpdating}
//               />
//               {touched.stock_quantity && errors.stock_quantity && (
//                 <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>
//               )}
//             </div>

//             <div>
//               <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
//               <Input
//                 id="description"
//                 name="description"
//                 placeholder="Enter product description"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 onBlur={handleBlur}
//                 disabled={isCreating || isUpdating}
//               />
//               {touched.description && errors.description && (
//                 <p className="text-red-500 text-sm mt-1">{errors.description}</p>
//               )}
//             </div>

//             <div>
//               <Label htmlFor="unitOfMeasurement">Unit of Measurement <span className="text-red-500">*</span></Label>
//               <Select
//                 value={selectedUnit}
//                 onValueChange={handleUnitChange}
//                 disabled={isCreating || isUpdating}
//               >
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder="Select Unit" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {unitOptions.map((unit) => (
//                     <SelectItem key={unit.value} value={unit.value}>
//                       {unit.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               {selectedUnit === "other" && (
//                 <Input
//                   type="text"
//                   placeholder="Enter custom unit (e.g. Box)"
//                   value={customUnit}
//                   onChange={handleCustomUnitChange}
//                   className="mt-2"
//                   disabled={isCreating || isUpdating}
//                 />
//               )}
//               {touched.unitOfMeasurement && errors.unitOfMeasurement && (
//                 <p className="text-red-500 text-sm mt-1">{errors.unitOfMeasurement}</p>
//               )}
//             </div>

//             <div>
//               <Label htmlFor="product_image">Product Images</Label>
//               <Input
//                 id="product_image"
//                 type="file"
//                 multiple
//                 onChange={handleFileChange}
//                 accept="image/*"
//                 disabled={isCreating || isUpdating}
//               />
//               {formData.product_image?.length > 0 && (
//                 <div className="flex flex-wrap gap-3 mt-4">
//                   {formData.product_image.map((url, index) => (
//                     <div key={index} className="relative w-fit">
//                       <img
//                         src={`${encodeURI(url)}?t=${new Date().getTime()}`}
//                         alt={`Preview ${index}`}
//                         className="w-24 h-24 rounded-md border object-cover"
//                       />
//                       <Button
//                         type="button"
//                         size="icon"
//                         onClick={() => handleImageDelete(url)}
//                         className="absolute -top-2 -right-2 bg-white p-1 rounded-full shadow hover:bg-red-100"
//                         disabled={isCreating || isUpdating}
//                       >
//                         <Trash2 className="w-4 h-4 text-red-600" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Step 3: Attributes */}
//         {step === 3 && (
//           <AttributeForm
//             attributes={attributes}
//             handleAttrChange={handleAttrChange}
//             addAttribute={addAttribute}
//             removeAttribute={removeAttribute}
//           />
//         )}

//         {/* Navigation Buttons */}
//         <div className="mt-6 flex justify-between">
//           {step > 1 && (
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => setStep(step - 1)}
//               disabled={isCreating || isUpdating}
//             >
//               Back
//             </Button>
//           )}

//           {step < 3 ? (
//             <Button
//               type="button"
//               onClick={handleNext}
//               disabled={isCreating || isUpdating || !validateStep()}
//               className="bg-[#0c1f4d] hover:bg-[#153171] text-white flex items-center gap-2"
//             >
//               {isCreating || isUpdating ? (
//                 <>
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   Loading...
//                 </>
//               ) : (
//                 "Next"
//               )}
//             </Button>
//           ) : (
//             <Button
//               type="button"
//               onClick={handleSubmit}
//               disabled={isCreating || isUpdating || !validateStep()}
//               className="bg-[#0c1f4d] hover:bg-[#153171] text-white flex items-center gap-2"
//             >
//               {isCreating || isUpdating ? (
//                 <>
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   {editingProduct ? "Updating..." : "Creating..."}
//                 </>
//               ) : editingProduct ? (
//                 "Update Product"
//               ) : (
//                 "Add Product"
//               )}
//             </Button>
//           )}
//         </div>
//       </form>
//     </div>
//   );
// });

// StepperProductForm.displayName = "StepperProductForm";

// export default StepperProductForm;

// src/components/modals/AddProductModal.jsx

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import MerchantProductForm from "./MerchantProductForm";

const AddProductModal = ({ open, onClose, editingProduct }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* This allows: click outside + Esc to close */}

      <DialogContent
        // Hide default close button completely
        className="p-0 bg-white overflow-hidden [&>button]:hidden"
        style={{
          width: "50vw",
          maxWidth: "50vw",
          height: "90vh",
          maxHeight: "90vh",
        }}
      >
        {/* Custom Header with Title (Left) + Close Button (Right) */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 bg-gradient-to-r from-[#0c1f4d] to-[#1e3a8a] text-white border-b border-white/20">
          <DialogTitle className="text-2xl font-bold">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>

          {/* Your Custom Close Button - Only One Visible */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        {/* Scrollable Form */}
        <div className="overflow-y-auto h-[calc(90vh-90px)] p-6 bg-gray-50">
          <MerchantProductForm
            editingProduct={editingProduct}
            onSuccess={onClose} // Close after save
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
