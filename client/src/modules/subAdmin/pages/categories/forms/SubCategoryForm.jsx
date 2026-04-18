import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useCreateSubCategoryMutation,
  useUpdateSubCategoryMutation,
} from "@/redux/api/SubCategoryApi";
import {
  useUploadSubCategoryImageMutation,
  useDeleteSubCategoryImageMutation,
} from "@/redux/api/SubCategoryImageApi";
import showToast from "@/toast/showToast";
import { useGetCategoriesQuery } from "@/redux/api/SubCategoryApi";
import noImage from "@/assets/images/no-image.jpg";

export default function SubCategoryForm({ open, onClose, editingCategory, refetchList }) {
  const [form, setForm] = useState({
    sub_category_name: "",
    sub_category_image: "",
    category_id: "",
  });

  const { data: categories, isLoading: loadingCategories } = useGetCategoriesQuery();

  const [uploadImage, { isLoading: uploading }] = useUploadSubCategoryImageMutation();
  const [deleteImage] = useDeleteSubCategoryImageMutation();
  const [createCategory, { isLoading: creating, isSuccess: createSuccess }] = useCreateSubCategoryMutation();
  const [updateCategory, { isLoading: updating, isSuccess: updateSuccess }] = useUpdateSubCategoryMutation();

  // Reset form when dialog opens/closes or editingCategory changes
  useEffect(() => {
    if (editingCategory) {
      setForm({
        sub_category_name: editingCategory.sub_category_name || "",
        sub_category_image: editingCategory.sub_category_image || "",
        category_id: editingCategory.category_id?._id || editingCategory.category_id || "",
      });
    } else {
      setForm({
        sub_category_name: "",
        sub_category_image: "",
        category_id: "",
      });
    }
  }, [editingCategory, open]);

  // Toast handling (same as Contact/Brands – dismiss old, show new)
  useEffect(() => {
    if (createSuccess) {
      const toastId = 'create-subcategory';
      showToast("Sub Category Created Successfully", "success", toastId);
      handleClose();
    }
  }, [createSuccess]);

  useEffect(() => {
    if (updateSuccess) {
      const toastId = 'update-subcategory';
      showToast("Sub Category Updated Successfully", "success", toastId);
      handleClose();
    }
  }, [updateSuccess]);

  const handleClose = () => {
    setForm({ sub_category_name: "", sub_category_image: "", category_id: "" });
    onClose();
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("sub_category_name", form.sub_category_name);
    formData.append("sub_category_image", file);

    try {
      const res = await uploadImage(formData).unwrap();
      const newImageUrl = res?.imageUrl || "";

      setForm((prev) => ({
        ...prev,
        sub_category_image: newImageUrl,
      }));

      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          ...form,
          sub_category_image: newImageUrl,
        }).unwrap();
        refetchList?.();
        showToast("Image updated successfully", "success", 'upload-image');
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      showToast("Image upload failed. Please try again.", "error", 'upload-image');
    }
  };

  const handleDeleteImage = async () => {
    const filename = form.sub_category_image?.split("/").pop();
    if (!filename) return;

    try {
      await deleteImage(filename).unwrap();

      setForm((prev) => ({ ...prev, sub_category_image: "" }));

      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          ...form,
          sub_category_image: "",
        }).unwrap();
        refetchList?.();
        showToast("Image deleted successfully", "success", 'delete-image');
      }
    } catch (err) {
      console.error("Image delete failed:", err);
      showToast("Failed to delete image", "error", 'delete-image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          ...form,
        }).unwrap();
      } else {
        await createCategory(form).unwrap();
      }
    } catch (error) {
      console.error("Save failed:", error);
      showToast("Operation failed. Please try again.", "error", 'save-subcategory');
    }
  };

  // Form validation
  const isFormValid =
    form.sub_category_name.trim() !== "" &&
    form.category_id !== "" &&
    form.sub_category_image !== "";

  const isSubmitting = creating || updating || uploading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Edit" : "Add"} Sub Category
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Parent Category */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Parent Category
            </label>
            <Select
              value={form.category_id}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, category_id: value }))
              }
              disabled={loadingCategories}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub Category Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Sub Category Name
            </label>
            <Input
              placeholder="Sub Category Name"
              name="sub_category_name"
              value={form.sub_category_name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Sub Category Image
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading && (
              <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
            )}
            {form.sub_category_image && (
              <div className="mt-2 relative w-fit">
                <img
                  src={`${form.sub_category_image}?t=${new Date().getTime()}`}
                  alt="Preview"
                  className="w-24 h-24 rounded-md border object-cover"
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
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingCategory ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{editingCategory ? "Update" : "Create"}</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}