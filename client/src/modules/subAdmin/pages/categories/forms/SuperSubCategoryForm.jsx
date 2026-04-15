import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
} from "@/redux/api/ProductApi";
import { skipToken } from "@reduxjs/toolkit/query";

const SuperSubCategoryForm = ({ open, onClose, data, onSave }) => {
  const isEdit = !!data?._id;

  const [formState, setFormState] = useState({
    category_id: "",
    sub_category_id: "",
    super_sub_category_name: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const { data: subCategories, isLoading: isSubCategoriesLoading } = useGetSubCategoriesQuery(
    formState.category_id || skipToken
  );

  // Reset form when dialog opens or data changes
  useEffect(() => {
    if (data && open) {
      const categoryId = data.category_id?._id || data.category_id || "";
      const superSubName = data.super_sub_category_name || "";

      setFormState({
        category_id: categoryId,
        sub_category_id: "", // Will be set after subcategories load
        super_sub_category_name: superSubName,
      });
    } else if (!data && open) {
      setFormState({
        category_id: "",
        sub_category_id: "",
        super_sub_category_name: "",
      });
    }
  }, [data, open]);

  // Set sub_category_id after subcategories are loaded (edit mode)
  useEffect(() => {
    if (
      isEdit &&
      !isSubCategoriesLoading &&
      subCategories &&
      formState.sub_category_id === ""
    ) {
      const subCategoryId = data.sub_category_id?._id || data.sub_category_id || "";
      if (subCategories.data.some((sub) => sub._id === subCategoryId)) {
        setFormState((prev) => ({ ...prev, sub_category_id: subCategoryId }));
      }
    }
  }, [isSubCategoriesLoading, subCategories, isEdit, data, formState.sub_category_id]);

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await onSave(formState); // Assume onSave returns a Promise
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation
  const isFormValid =
    formState.category_id.trim() !== "" &&
    formState.sub_category_id.trim() !== "" &&
    formState.super_sub_category_name.trim() !== "";

  const isLoading = isCategoriesLoading || isSubCategoriesLoading;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Update" : "Add"} Super Sub-Category
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Select */}
          <div>
            <Label className="mb-2">Category</Label>
            <Select
              value={formState.category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  category_id: value,
                  sub_category_id: "", // Reset sub-category
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

          {/* Sub-Category Select */}
          <div>
            <Label className="mb-2">Sub-Category</Label>
            <Select
              value={formState.sub_category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({ ...prev, sub_category_id: value }))
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

          {/* Super Sub-Category Name */}
          <div>
            <Label className="mb-2">Super Sub-Category Name</Label>
            <Input
              name="super_sub_category_name"
              value={formState.super_sub_category_name}
              onChange={handleChange}
              placeholder="Enter name"
              required
            />
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

export default SuperSubCategoryForm;