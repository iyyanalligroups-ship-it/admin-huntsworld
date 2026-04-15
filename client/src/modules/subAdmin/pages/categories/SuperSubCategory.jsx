import { Button } from "@/components/ui/button";
import {
  useCreateSuperSubCategoryMutation,
  useUpdateSuperSubCategoryMutation,
} from "@/redux/api/SuperSubCategoryApi";
import SuperSubCategoryList from "./pages/SuperSubCategoryList";
import SuperSubCategoryForm from "./forms/SuperSubCategoryForm";
import { useState } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import showToast from "@/toast/showToast";

const SuperSubCategory = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [createSuperSubCategory] = useCreateSuperSubCategoryMutation();
  const [updateSuperSubCategory] = useUpdateSuperSubCategoryMutation();
  const { isSidebarOpen } = useSidebar();
  const [refetchListFn, setRefetchListFn] = useState(null);

  const handleSave = async (formData) => {
    try {
      let response;
      if (editingData) {
        response = await updateSuperSubCategory({ id: editingData._id, ...formData }).unwrap();
        showToast(response.message || "SuperSubCategory Updated Successfully", "success");
      } else {
        response = await createSuperSubCategory(formData).unwrap();
        showToast(response.message || "SuperSubCategory Added Successfully", "success");
      }
    } catch (error) {
      showToast(error?.data?.message || "Operation Failed", "error");
    }
    setModalOpen(false);
    setEditingData(null);
    refetchListFn?.();
  };
  console.log(editingData,'edititnvaleu');
  

  return (
    <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>
      <div className="p-2 mt-10">
        <div className="flex justify-between items-center mb-4 flex-wrap">
          <h2 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold">Manage Super SubCategories</h2>
          <Button onClick={() => setModalOpen(true)}  className="cursor-pointer mt-2 lg:mt-0 bg-[#0c1f4d] group-hover:bg-[#0c204de2]">+ Add Super SubCategory</Button>
        </div>

        <SuperSubCategoryList
          onEdit={(item) => {
            setEditingData(item);
            setModalOpen(true);
          }}
          setRefetchFn={setRefetchListFn}
        />

        <SuperSubCategoryForm
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingData(null);
          }}
          data={editingData}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default SuperSubCategory;