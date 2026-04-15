import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
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

const DeepSubCategoryForm = ({ open, onClose, data, onSave, refetchList }) => {
  const isEdit = !!data?._id;

  const [formState, setFormState] = useState({
    category_id: "",
    sub_category_id: "",
    super_sub_category_id: "",
    deep_sub_category_name: "",
    deep_sub_category_image: "",
  });

  const { data: categories, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const { data: subCategories, isLoading: isSubCategoriesLoading } = useGetSubCategoriesQuery(
    formState.category_id || skipToken
  );
  const { data: SuperSubCategories, isLoading: isSuperSubCategoriesLoading } = useGetSuperSubCategoriesQuery(
    formState.sub_category_id || skipToken
  );

  const [uploadImage] = useUploadDeepSubCategoryImageMutation();
  const [deleteImage] = useDeleteDeepSubCategoryImageMutation();

  // Async patching for edit mode
  useEffect(() => {
    const patchValues = async () => {
      if (!data) return;

      // Step 1: set category first
      setFormState((prev) => ({
        ...prev,
        category_id: data.category_id?._id || data.category_id || "",
      }));

      // Step 2: wait until subCategories load, then set sub_category_id
      if (data.sub_category_id) {
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (subCategories?.data?.length) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
        });

        setFormState((prev) => ({
          ...prev,
          sub_category_id: data.sub_category_id?._id || data.sub_category_id || "",
        }));
      }

      // Step 3: wait until superSubCategories load, then set super_sub_category_id
      if (data.super_sub_category_id) {
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (SuperSubCategories?.data?.length) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
        });

        setFormState((prev) => ({
          ...prev,
          super_sub_category_id: data.super_sub_category_id?._id || data.super_sub_category_id || "",
          deep_sub_category_name: data.deep_sub_category_name || "",
          deep_sub_category_image: data.deep_sub_category_image || "",
        }));
      }
    };

    patchValues();
  }, [data, subCategories, SuperSubCategories]);

  // Reset form for add mode
  useEffect(() => {
    if (open && !data) {
      setFormState({
        category_id: "",
        sub_category_id: "",
        super_sub_category_id: "",
        deep_sub_category_name: "",
        deep_sub_category_image: "",
      });
    }
  }, [open, data]);

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(formState);
    } catch (error) {
      console.error("Submit failed:", error);
      showToast("Operation failed. Please try again.", "error");
    }
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("deep_sub_category_name", formState.deep_sub_category_name);
    formData.append("deep_sub_category_image", file);

    try {
      const res = await uploadImage(formData).unwrap();
      setFormState((prev) => ({
        ...prev,
        deep_sub_category_image: res?.imageUrl || "",
      }));
      refetchList?.();
      showToast("Image uploaded successfully", "success");
    } catch (err) {
      console.error("Image upload failed:", err);
      showToast("Image upload failed. Please try again.", "error");
    }
  };

  const handleDeleteImage = async () => {
    const imageName = formState.deep_sub_category_image?.split("/").pop();
    if (!imageName) return;

    try {
      await deleteImage(imageName).unwrap();
      setFormState((prev) => ({ ...prev, deep_sub_category_image: "" }));
      refetchList?.();
      showToast("Image deleted successfully", "success");
    } catch (err) {
      console.error("Image delete failed:", err);
      showToast("Failed to delete image", "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
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
              required
              disabled={isCategoriesLoading}
            >
              <SelectTrigger className="w-full border-2 border-slate-300">
                <SelectValue
                  placeholder={
                    isCategoriesLoading
                      ? (isEdit ? data?.category_id?.category_name || "Loading..." : "Loading...")
                      : "e.g. Select Category"
                  }
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

          {/* Sub Category */}
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
              required
              disabled={!formState.category_id || isSubCategoriesLoading}
            >
              <SelectTrigger className="w-full border-2 border-slate-300">
                <SelectValue
                  placeholder={
                    isSubCategoriesLoading
                      ? (isEdit ? data?.sub_category_id?.sub_category_name || "Loading..." : "Loading...")
                      : !formState.category_id
                      ? "Select a Category First"
                      : "e.g. Select Sub-Category"
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

          {/* Super Sub Category */}
          <div>
            <Label className="mb-2">Super Sub-Category</Label>
            <Select
              value={formState.super_sub_category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  super_sub_category_id: value,
                }))
              }
              required
              disabled={!formState.sub_category_id || isSuperSubCategoriesLoading}
            >
              <SelectTrigger className="w-full border-2 border-slate-300">
                <SelectValue
                  placeholder={
                    isSuperSubCategoriesLoading
                      ? (isEdit ? data?.super_sub_category_id?.super_sub_category_name || "Loading..." : "Loading...")
                      : !formState.sub_category_id
                      ? "Select a Sub-Category First"
                      : "e.g. Select Super Sub-Category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {SuperSubCategories?.data?.map((sup) => (
                  <SelectItem key={sup._id} value={sup._id}>
                    {sup.super_sub_category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deep Sub Category Name */}
          <div>
            <Label className="mb-2">Deep Sub-Category Name</Label>
            <Input
              name="deep_sub_category_name"
              placeholder="e.g. iPhone 15 Pro Max"
              value={formState.deep_sub_category_name}
              onChange={handleChange}
              required
              className="border-2 border-slate-300"
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label className="mb-2">Upload Image</Label>
            <Input type="file" onChange={handleFileChange} className="border-2 border-slate-300" />
            {formState.deep_sub_category_image && (
              <div className="mt-2 space-y-2 relative w-fit">
                <img
                  src={formState.deep_sub_category_image}
                  alt="preview"
                  className="h-24 rounded border object-cover"
                />
                <Button
                  type="button"
                  onClick={handleDeleteImage}
                  className="absolute top-0 right-0 bg-white p-1 rounded-full cursor-pointer shadow-md hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isCategoriesLoading || isSubCategoriesLoading || isSuperSubCategoriesLoading}
          >
            {isEdit ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeepSubCategoryForm;
