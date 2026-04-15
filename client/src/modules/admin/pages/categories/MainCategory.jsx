import { Button } from "@/components/ui/button";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/redux/api/CategoryApi";
import CategoryList from "./pages/CategoryList";
import CategoryFormModal from "./forms/CategoryForm";
import { useState } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import showToast from "@/toast/showToast";

const MainCategory = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const { isSidebarOpen } = useSidebar();
  const [categoryRefetch, setCategoryRefetch] = useState(null);

  const handleSave = async (form) => {
    try {
      const payload = {
        category_name: form.category_name,
        category_image: form.category_image,
      };

      if (editingCategory) {
        const response = await updateCategory({
          id: editingCategory.categoryId, // Use categoryId from API response
          ...payload,
        }).unwrap();
        if (response?.success) {
          showToast(response?.message || "Category Updated Successfully", "success");
        } else {
          showToast(response?.message || "Failed to Update", "error");
        }
      } else {
        const response = await createCategory(payload).unwrap();
        if (response?.success) {
          showToast(response?.message || "Category Added Successfully", "success");
        } else {
          showToast(response?.message || "Failed to Add", "error");
        }
      }

      setModalOpen(false);
      setEditingCategory(null);
      categoryRefetch?.();
    } catch (error) {
      console.error("Error in handleSave:", error);
      showToast(
        error?.data?.message || error?.message || "Something went wrong",
        "error"
      );
    }
  };

  return (
    <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>
      <div className="max-w-6xl w-full mx-auto mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage Categories</h2>
          <Button variant="default" onClick={() => setModalOpen(true)}>
            + Add Category
          </Button>
        </div>

        <CategoryList
          onEdit={(cat) => {
            setEditingCategory({
              categoryId: cat.categoryId,
              category_name: cat.categoryName,
              category_image: cat.categoryImage,
            });
            setModalOpen(true);
          }}
          setRefetch={setCategoryRefetch}
        />

        <CategoryFormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingCategory(null);
          }}
          editingCategory={editingCategory}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default MainCategory;