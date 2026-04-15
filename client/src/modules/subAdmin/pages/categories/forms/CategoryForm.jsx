import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import {
  useUploadCategoryImageMutation,
  useDeleteCategoryImageMutation,
} from "@/redux/api/CategoryImageApi";
import showToast from "@/toast/showToast";
import noImage from "@/assets/images/no-image.jpg";

export default function CategoryForm({ open, onClose, editingCategory, onSave }) {
  const [form, setForm] = useState({ category_name: "", category_image: "" });
  const [error, setError] = useState("");
  const [uploadImage, { isLoading: uploading }] = useUploadCategoryImageMutation();
  const [deleteImage, { isLoading: deleting }] = useDeleteCategoryImageMutation();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setForm({
        category_name: editingCategory.category_name || "",
        category_image: editingCategory.category_image || "",
      });
    } else {
      setForm({ category_name: "", category_image: "" });
    }
    setError("");
  }, [editingCategory, open]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(""); // Clear error on input change
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("category_name", form.category_name || "category");
    formData.append("category_image", file);

    try {
      const res = await uploadImage(formData).unwrap();
      const newImageUrl = res?.imageUrl || "";
      setForm((prev) => ({ ...prev, category_image: newImageUrl }));
      showToast("Image uploaded successfully", "success");
      setError("");
    } catch (err) {
      console.error("Image upload failed:", err);
      showToast(err?.data?.message || "Image upload failed. Please try again.", "error");
    }
  };

  const handleDeleteImage = async () => {
    if (!form.category_image) return;

    try {
      const imageName = form.category_image.split("/").pop();
      await deleteImage(imageName).unwrap();
      setForm((prev) => ({ ...prev, category_image: "" }));
      showToast("Image deleted successfully", "success");
    } catch (err) {
      console.error("Image delete failed:", err);
      showToast(err?.data?.message || "Failed to delete image", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category_name.trim()) {
      setError("⚠️ Category name is required");
      return;
    }
    if (!form.category_image.trim()) {
      setError("⚠️ Please upload a category image");
      return;
    }

    try {
      setSaving(true);
      await onSave(form);
      showToast(
        editingCategory ? "Category updated successfully" : "Category created successfully",
        "success"
      );
      setSaving(false);
    } catch (error) {
      console.error("Save failed:", error);
      showToast(error?.data?.message || "Operation failed. Please try again.", "error");
      setSaving(false);
    }
  };

  const isFormValid =
    form.category_name.trim() !== "" && form.category_image.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Edit" : "Add"} Category
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            placeholder="Category Name"
            name="category_name"
            value={form.category_name}
            onChange={handleChange}
            required
          />

          <div className="cursor-pointer">
            <label className="block text-sm font-medium mb-1">
              Category Image
            </label>
            <Input
              type="file"
              className="cursor-pointer"
              accept="image/*"
              onChange={handleFileChange}
            />
            {form.category_image && (
              <div className="mt-2 relative w-fit">
                <img
                  src={`${encodeURI(form.category_image)}?t=${Date.now()}`}
                  alt="Preview"
                  className="w-24 h-24 rounded-md border object-cover"
                  onError={(e) => {
                    e.target.src = noImage;
                  }}
                />
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="absolute top-0 right-0 bg-white p-1 rounded-full shadow-md hover:bg-red-100"
                  disabled={deleting}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2 cursor-pointer"
            disabled={!isFormValid || uploading || deleting || saving}
          >
            {(uploading || deleting || saving) && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {editingCategory
              ? saving
                ? "Updating..."
                : "Update"
              : saving
                ? "Creating..."
                : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
