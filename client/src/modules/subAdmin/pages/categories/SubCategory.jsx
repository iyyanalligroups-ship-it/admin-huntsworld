
import { Button } from "@/components/ui/button";
import {
  useCreateSubCategoryMutation,
  useUpdateSubCategoryMutation,
} from "@/redux/api/SubCategoryApi";
import CategoryList from "./pages/SubCategoryList";
import CategoryFormModal from "./forms/SubCategoryForm";
import { useState } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import showToast from "@/toast/showToast";


const SubCategory = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [createSubCategory] = useCreateSubCategoryMutation();
  const [updateSubCategory] = useUpdateSubCategoryMutation();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [categoryRefetch, setCategoryRefetch] = useState(null);

  const handleSave = async (form) => {
    if (editingCategory) {
    const response=  await updateSubCategory({ id: editingCategory._id, ...form }).unwrap();
      if (response.success == true) {
        showToast(response.message || "SubCategory Updated Successfully",'success');
      } else {
        showToast(response.message || "Failed to Update",'error');
      }
    } else {
      const response= await createSubCategory(form).unwrap();
      if (response.success == true) {
        showToast(response.message || "SubCategory Added Successfully",'success');
      } else {
        showToast(response.message || "Failed to Add",'error');
      }
    }
    setModalOpen(false);
    setEditingCategory(null);
    categoryRefetch?.();
  };

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <div className="max-w-6xl w-full mx-auto mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold">Manage SubCategories</h2>
          <Button onClick={() => setModalOpen(true)}  className="cursor-pointer bg-[#0c1f4d] group-hover:bg-[#0c204de2]">+ Add SubCategory</Button>
        </div>

        <CategoryList
          onEdit={(cat) => {
            setEditingCategory(cat);
            setModalOpen(true);
          }}
        />

        <CategoryFormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingCategory(null);
          }}
          editingCategory={editingCategory}
          onSave={handleSave}
          refetchList={categoryRefetch} 
        />
      </div>
    </div>
  );
};

export default SubCategory;
