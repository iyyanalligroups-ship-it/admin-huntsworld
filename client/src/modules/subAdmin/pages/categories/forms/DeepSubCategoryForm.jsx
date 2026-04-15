import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useUploadDeepSubCategoryImageMutation,
  useDeleteDeepSubCategoryImageMutation,
} from "@/redux/api/DeepSubCategoryImageApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
  useGetSuperSubCategoriesQuery,
} from "@/redux/api/ProductApi";
import { skipToken } from "@reduxjs/toolkit/query";
import showToast from "@/toast/showToast";
import noImage from "@/assets/images/no-image.jpg";

const DeepSubCategoryForm = ({ open, onClose, data, onSave, refetchList }) => {
  const isEdit = !!data?._id;

  const [formState, setFormState] = useState({
    category_id: "",
    sub_category_id: "",
    super_sub_category_id: "",
    deep_sub_category_name: "",
    deep_sub_category_image: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const { data: subCategories, isLoading: isSubCategoriesLoading } = useGetSubCategoriesQuery(
    formState.category_id || skipToken
  );
  const { data: superSubCategories, isLoading: isSuperSubCategoriesLoading } = useGetSuperSubCategoriesQuery(
    formState.sub_category_id || skipToken
  );

  const [uploadImage, { isLoading: uploading }] = useUploadDeepSubCategoryImageMutation();
  const [deleteImage] = useDeleteDeepSubCategoryImageMutation();

  // Reset form when data or open changes
  useEffect(() => {
    if (data && open) {
      setFormState({
        category_id: data.category_id?._id || data.category_id || "",
        sub_category_id: data.sub_category_id?._id || data.sub_category_id || "",
        super_sub_category_id: data.super_sub_category_id?._id || data.super_sub_category_id || "",
        deep_sub_category_name: data.deep_sub_category_name || "",
        deep_sub_category_image: data.deep_sub_category_image || "",
      });
    } else if (!data && open) {
      setFormState({
        category_id: "",
        sub_category_id: "",
        super_sub_category_id: "",
        deep_sub_category_name: "",
        deep_sub_category_image: "",
      });
    }
  }, [data, open]);

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("deep_sub_category_name", formState.deep_sub_category_name);
    formData.append("deep_sub_category_image", file);

    try {
      const res = await uploadImage(formData).unwrap();
      const newImageUrl = res?.imageUrl || "";

      setFormState((prev) => ({
        ...prev,
        deep_sub_category_image: newImageUrl,
      }));

      refetchList?.();
      showToast("Image uploaded successfully", "success", "upload-deep-subcategory");
    } catch (err) {
      console.error("Image upload failed:", err);
      showToast("Image upload failed. Please try again.", "error", "upload-deep-subcategory");
    }
  };

  const handleDeleteImage = async () => {
    const imageName = formState.deep_sub_category_image?.split("/").pop();
    if (!imageName) return;

    try {
      await deleteImage(imageName).unwrap();
      setFormState((prev) => ({ ...prev, deep_sub_category_image: "" }));
      refetchList?.();
      // showToast("Image deleted successfully", "success", "delete-deep-subcategory");
    } catch (err) {
      console.error("Image delete failed:", err);
      // showToast("Failed to delete image", "error", "delete-deep-subcategory");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await onSave(formState);
      // showToast(isEdit ? "Deep Sub-Category Updated" : "Deep Sub-Category Created", "success", "save-deep-subcategory");
      onClose();
    } catch (error) {
      console.error("Submit failed:", error);
      // showToast("Operation failed. Please try again.", "error", "save-deep-subcategory");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation
  const isFormValid =
    formState.category_id.trim() !== "" &&
    formState.sub_category_id.trim() !== "" &&
    formState.super_sub_category_id.trim() !== "" &&
    formState.deep_sub_category_name.trim() !== "" &&
    formState.deep_sub_category_image.trim() !== "";

  const isLoading = isCategoriesLoading || isSubCategoriesLoading || isSuperSubCategoriesLoading || uploading;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Update" : "Add"} Deep Sub-Category
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <Label className="mb-2">Category</Label>
            <Select
              value={formState.category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  category_id: value,
                  sub_category_id: "",
                  super_sub_category_id: "",
                }))
              }
              disabled={isCategoriesLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={isCategoriesLoading ? "Loading..." : "Select Category"}
                />
              </SelectTrigger>
              <SelectContent>
                {categories?.data?.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-Category */}
          <div>
            <Label className="mb-2">Sub-Category</Label>
            <Select
              value={formState.sub_category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  sub_category_id: value,
                  super_sub_category_id: "",
                }))
              }
              disabled={!formState.category_id || isSubCategoriesLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isSubCategoriesLoading
                      ? "Loading..."
                      : !formState.category_id
                        ? "Select a Category First"
                        : "Select Sub-Category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subCategories?.data?.map((sub) => (
                  <SelectItem key={sub._id} value={sub._id}>
                    {sub.sub_category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Super Sub-Category */}
          <div>
            <Label className="mb-2">Super Sub-Category</Label>
            <Select
              value={formState.super_sub_category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({ ...prev, super_sub_category_id: value }))
              }
              disabled={!formState.sub_category_id || isSuperSubCategoriesLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isSuperSubCategoriesLoading
                      ? "Loading..."
                      : !formState.sub_category_id
                        ? "Select a Sub-Category First"
                        : "Select Super Sub-Category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {superSubCategories?.data?.map((sup) => (
                  <SelectItem key={sup._id} value={sup._id}>
                    {sup.super_sub_category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deep Sub-Category Name */}
          <div>
            <Label className="mb-2">Deep Sub-Category Name</Label>
            <Input
              name="deep_sub_category_name"
              placeholder="Enter Deep Sub-Category Name"
              value={formState.deep_sub_category_name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label className="mb-2">Upload Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading && (
              <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
            )}
            {formState.deep_sub_category_image && (
              <div className="mt-2 relative w-fit">
                <img
                  src={`${formState.deep_sub_category_image}?t=${Date.now()}`}
                  alt="Preview"
                  className="h-24 w-24 rounded-md border object-cover"
                  onError={(e) => {
                    e.target.src = noImage;
                  }}
                />
                <Button
                  type="button"
                  onClick={handleDeleteImage}
                  className="absolute top-0 right-0 bg-white p-1 rounded-full shadow-md hover:bg-red-100"
                  disabled={uploading}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={!isFormValid || isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEdit ? "Update" : "Create"}</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeepSubCategoryForm;