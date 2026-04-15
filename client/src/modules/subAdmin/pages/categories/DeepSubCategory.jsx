import { Button } from "@/components/ui/button";
import {
  useCreateDeepSubCategoryMutation,
  useUpdateDeepSubCategoryMutation,
} from "@/redux/api/DeepSubCategoryApi";
import DeepSubCategoryList from "./pages/DeepSubCategoryList";
import DeepSubCategoryForm from "./forms/DeepSubCategoryForm";
import { useState, useEffect } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import showToast from "@/toast/showToast";

const DeepSubCategory = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [createDeepSubCategory] = useCreateDeepSubCategoryMutation();
  const [updateDeepSubCategory] = useUpdateDeepSubCategoryMutation();
  const { isSidebarOpen } = useSidebar();
  const [refetchListFn, setRefetchListFn] = useState(null);

  const handleSave = async (formData) => {
    try {
      let response;
      if (editingData) {
        response = await updateDeepSubCategory({ id: editingData._id, ...formData }).unwrap();
        showToast(response.message || "Deep Sub-Category Updated Successfully", "success");
      } else {
        response = await createDeepSubCategory(formData).unwrap();
        showToast(response.message || "Deep Sub-Category Added Successfully", "success");
      }
    } catch (error) {
      console.error("Save failed:", error);
      showToast(error?.data?.message || "Operation Failed", "error");
    } finally {
      setModalOpen(false); // Always close modal, success or failure
      setEditingData(null);
      refetchListFn?.(); // Refetch after operation
    }
  };

  useEffect(() => {
    if (!modalOpen && refetchListFn) {
      refetchListFn(); // Refetch when modal closes
    }
  }, [modalOpen, refetchListFn]);

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <div className="mt-10">
        <div className="flex justify-between flex-wrap items-center mb-4">
          <h2 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold">Manage Deep SubCategories</h2>
          <Button
            onClick={() => {
              setModalOpen(true);
              setEditingData(null);
            }}
            className="cursor-pointer bg-[#0c1f4d] group-hover:bg-[#0c204de2] mt-2 lg:mt-0"
          >
            + Add Deep SubCategory
          </Button>
        </div>

        <DeepSubCategoryList
          onEdit={(item) => {
            setEditingData(item);
            setModalOpen(true);
          }}
          setRefetchFn={setRefetchListFn}
        />

        <DeepSubCategoryForm
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingData(null);
          }}
          data={editingData}
          onSave={handleSave}
          refetchList={refetchListFn}
        />
      </div>
    </div>
  );
};

export default DeepSubCategory;

