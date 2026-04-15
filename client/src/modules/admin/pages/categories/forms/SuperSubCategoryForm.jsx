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

  const { data: categories, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const { data: subCategories, isLoading: isSubCategoriesLoading } = useGetSubCategoriesQuery(
    formState.category_id || skipToken
  );

  useEffect(() => {
    if (data) {
      const categoryId = data.category_id?._id || data.category_id || "";
      const superSubCategoryName = data.super_sub_category_name || "";
      console.log("Edit data:", data); // Debug: Log incoming data
      setFormState({
        category_id: categoryId,
        sub_category_id: "", // Intentionally not setting here; set after subCategories load
        super_sub_category_name: superSubCategoryName,
      });
    } else {
      setFormState({
        category_id: "",
        sub_category_id: "",
        super_sub_category_name: "",
      });
    }
  }, [data]);

  // Set sub_category_id only after subCategories have loaded (avoids timing issues)
  useEffect(() => {
    if (isEdit && !isSubCategoriesLoading && subCategories && formState.sub_category_id === "") {
      const subCategoryId = data.sub_category_id?._id || data.sub_category_id || "";
      console.log("Setting sub_category_id after load:", subCategoryId); // Debug: Verify ID
      if (subCategories.data.some((sub) => sub._id === subCategoryId)) {
        setFormState((prev) => ({ ...prev, sub_category_id: subCategoryId }));
      } else {
        console.warn("sub_category_id not found in loaded subCategories for category:", formState.category_id);
      }
    }
  }, [isSubCategoriesLoading, subCategories, isEdit, data, formState.sub_category_id, formState.category_id]);

  // Reset form when opening for add mode
  useEffect(() => {
    if (open && !data) {
      setFormState({
        category_id: "",
        sub_category_id: "",
        super_sub_category_name: "",
      });
    }
  }, [open, data]);

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting formState:", formState); // Debug: Log form data on submit
    onSave(formState);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Update" : "Add"} Super Sub-Category
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2">Category</Label>
            <Select
              value={formState.category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  category_id: value,
                  sub_category_id: "", // Reset sub_category_id when category changes
                }))
              }
              required
              disabled={isCategoriesLoading}
            >
              <SelectTrigger className="w-full border-2 border-slate-300">
                <SelectValue placeholder={isCategoriesLoading ? "Loading..." : "e.g. Select Category"} />
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

          <div>
            <Label className="mb-2">Sub-Category</Label>
            <Select
              value={formState.sub_category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({ ...prev, sub_category_id: value }))
              }
              required
              disabled={!formState.category_id || isSubCategoriesLoading}
            >
              <SelectTrigger className="w-full border-2 border-slate-300">
                <SelectValue
                  placeholder={
                    isSubCategoriesLoading
                      ? "Loading..."
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

          <div>
            <Label className="mb-2">Super Sub-Category Name</Label>
            <Input
              name="super_sub_category_name"
              placeholder="e.g. Apple iPhone"
              value={formState.super_sub_category_name}
              onChange={handleChange}
              required
              className="border-2 border-slate-300"
            />
          </div>
          <Button type="submit" className="w-full cursor-pointer" disabled={isSubCategoriesLoading || isCategoriesLoading}>
            {isEdit ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SuperSubCategoryForm;