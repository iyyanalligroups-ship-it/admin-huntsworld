import { useState, useEffect } from "react";
import CategoryItem from "./CategoryItem";
import DeleteDialog from "@/model/DeleteModel";
import {
  useGetCategoriesQuery,
  useDeleteCategoryMutation,
} from "@/redux/api/CategoryApi";
import { useDeleteCategoryImageMutation } from "@/redux/api/CategoryImageApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import showToast from "@/toast/showToast";

export default function CategoryList({ onEdit, setRefetch }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const limit = 10;

  const { data, isLoading, refetch } = useGetCategoriesQuery({
    page,
    limit,
    search,
  });

  const [deleteCategory] = useDeleteCategoryMutation();
  const [deleteImage] = useDeleteCategoryImageMutation();
  const [deleteId, setDeleteId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (setRefetch) {
      setRefetch(() => refetch);
    }
  }, [refetch, setRefetch]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const selectedCategory = data?.data?.find((item) => item.categoryId === deleteId);
    try {
      if (selectedCategory?.categoryImage) {
        try {
          const imageName = selectedCategory.categoryImage.split("/").pop();
          console.log(imageName, "imageName");
          const category_name = imageName;
          await deleteImage(category_name).unwrap();
        } catch (imageErr) {
          console.error("Image deletion failed, proceeding with category deletion:", imageErr);
        }
      }
      const response = await deleteCategory(deleteId).unwrap();
      if (response.success) {
        showToast(response.message || "Category Deleted Successfully", "success");
      } else {
        showToast(response.message || "Failed to Delete", "error");
      }
      await refetch();
    } catch (err) {
      console.error("Deletion failed:", err);
      showToast(err?.data?.message || "Failed to Delete", "error");
    }
    setDeleteId(null);
    setIsDialogOpen(false);
  };

  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <Input
          type="text"
          placeholder="e.g. Electronics, Fashion"
          className="px-4 py-2 rounded-md w-full max-w-sm border-2 border-slate-300"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
         <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className={
              viewMode === "list"
                ? "bg-[#0c1f4d] hover:bg-[#0c204df6] cursor-pointer"
                : "cursor-pointer"
            }
          >
            List View
          </Button>

          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
            className={
              viewMode === "grid"
                ? "bg-[#0c1f4d] hover:bg-[#0c204df6] cursor-pointer"
                : "cursor-pointer"
            }
          >
            Grid View
          </Button>
        </div>

      </div>

      {isLoading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div
          className={`${
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
              : "flex flex-col gap-2"
          }`}
        >
          {data?.data?.map((cat) => (
            <CategoryItem
              key={cat.categoryId}
              category={cat}
              onEdit={onEdit}
              onDelete={() => {
                setDeleteId(cat.categoryId);
                setIsDialogOpen(true);
              }}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center mt-6">
        <div className="text-sm text-gray-600">
          Total Records: {data?.pagination?.totalItems || 0}
        </div>
        <div className="flex justify-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            variant="outline"
            className="cursor-pointer"
          >
            Previous
          </Button>
          <span className="font-semibold text-gray-700">
            Page {page} of {data?.pagination?.totalPages || 1}
          </span>
          <Button
            disabled={page === data?.pagination?.totalPages}
            onClick={() => setPage((p) => p + 1)}
            variant="outline"
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      </div>

      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category?"
        description="This action will permanently remove the category."
      />
    </div>
  );
}