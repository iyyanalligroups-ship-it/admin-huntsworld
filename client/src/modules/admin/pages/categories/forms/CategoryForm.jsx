import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  useUploadCategoryImageMutation,
  useDeleteCategoryImageMutation,
} from "@/redux/api/CategoryImageApi";
import showToast from "@/toast/showToast";

export default function CategoryForm({ open, onClose, editingCategory, onSave }) {
  const [form, setForm] = useState({ category_name: "", category_image: "" });
  const [uploadImage, { isLoading: uploading }] = useUploadCategoryImageMutation();
  const [deleteImage, { isLoading: deleting }] = useDeleteCategoryImageMutation();

  useEffect(() => {
    if (editingCategory) {
      setForm({
        category_name: editingCategory.category_name || "",
        category_image: editingCategory.category_image || "",
      });
    } else {
      setForm({ category_name: "", category_image: "" });
    }
  }, [editingCategory, open]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("category_name", form.category_name || "category"); // Fallback if name is empty
    formData.append("category_image", file);

    try {
      const res = await uploadImage(formData).unwrap();
      const newImageUrl = res?.imageUrl || "";
      setForm((prev) => ({ ...prev, category_image: newImageUrl }));
      showToast("Image uploaded successfully", "success");
    } catch (err) {
      console.error("Image upload failed:", err);
      showToast(err?.data?.message || "Image upload failed. Please try again.", "error");
    }
  };

  const handleDeleteImage = async () => {
    if (!form.category_image) return;

    try {
      const imageName = form.category_image.split("/").pop();
      const category_name=imageName;
      await deleteImage(category_name).unwrap();
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
      showToast("Category name is required", "error");
      return;
    }
    try {
      await onSave(form);
    } catch (error) {
      console.error("Save failed:", error);
      showToast(error?.data?.message || "Operation failed. Please try again.", "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingCategory ? "Edit" : "Add"} Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            placeholder="e.g. Electronics"
            name="category_name"
            value={form.category_name}
            onChange={handleChange}
            required
            className="border-2 border-slate-300"
          />

          <div>
            <label className="block text-sm font-medium mb-1">
              Category Image
            </label>
            <Input type="file" accept="image/*" onChange={handleFileChange} className="border-2 border-slate-300" />
            {form.category_image && (
              <div className="mt-2 relative w-fit">
                <img
                  src={`${encodeURI(form.category_image)}?t=${Date.now()}`}
                  alt="Preview"
                  className="w-24 h-24 rounded-md border object-cover"
                  onError={(e) => {
                    console.error("Image failed to load:", form.category_image);
                    e.target.style.display = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="absolute top-0 right-0 cursor-pointer bg-white p-1 rounded-full shadow-md hover:bg-red-100"
                  disabled={deleting}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={uploading || deleting}
          >
            {editingCategory ? (uploading || deleting ? "Processing..." : "Update") : (uploading || deleting ? "Processing..." : "Create")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}