import { useState, useEffect } from "react";
import SubCategoryItem from "./SubCategoryItem";
import DeleteDialog from "@/model/DeleteModel";
import {
  useGetSubCategoriesQuery,
  useDeleteSubCategoryMutation,
} from "@/redux/api/SubCategoryApi";
import { useDeleteSubCategoryImageMutation } from "@/redux/api/SubCategoryImageApi";
import { Button } from "@/components/ui/button";
import showToast from "@/toast/showToast";
import { Input } from "@/components/ui/input";

const formatName = (value) => {
  if (!value) return "";

  return value
    .replace(/[-_]/g, " ") // replace hyphen & underscore
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize each word
};


export default function SubCategoryList({ onEdit, setRefetch }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'grid'
  const limit = 10;

  const {
    data,
    isLoading,
    refetch,
  } = useGetSubCategoriesQuery({ page, limit, search });
  console.log(data, "total");

  const [deleteCategory] = useDeleteSubCategoryMutation();
  const [deleteImage] = useDeleteSubCategoryImageMutation();
  const [deleteId, setDeleteId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (setRefetch) {
      setRefetch(() => refetch);
    }
  }, [refetch, setRefetch]);

 const confirmDelete = async () => {
  if (!deleteId) return;

  const selectedSubCategory = data?.data?.find((item) => item._id === deleteId);
  if (!selectedSubCategory) return;

  let imageDeleted = false;

  try {
    // Step 1: Try to delete the sub-category
    const response = await deleteCategory(deleteId).unwrap();

    // Step 2: If we reach here → deletion succeeded
    // Now safe to delete the image
    if (selectedSubCategory.sub_category_image) {
      try {
        const imageName = selectedSubCategory.sub_category_image.split("/").pop();
        await deleteImage(imageName).unwrap();
        imageDeleted = true;
      } catch (imageErr) {
        console.error("Image deletion failed, proceeding:", imageErr);
      }
    }

    // Step 3: Show success
    showToast(response.message || "SubCategory Deleted Successfully", "success");
    await refetch();

  } catch (err) {
    // Step 4: Handle backend validation or server error
    let errorMessage = "Failed to delete sub-category";

    // RTK Query wraps backend response in `data` if status < 500
    if (err?.data?.message) {
      errorMessage = err.data.message; // This is your exact message
    } else if (err?.message) {
      errorMessage = err.message;
    }

    // Only show toast — DO NOT delete image
    showToast(errorMessage, "error");
    console.error("Delete error:", err);
  } finally {
    // Always reset dialog
    setDeleteId(null);
    setIsDialogOpen(false);
  }
};
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="w-full">
      {/* Top Controls */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <Input
          type="text"
          placeholder="e.g. Smartphones, T-Shirts"
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

      {/* Items */}
      {isLoading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div
          className={`${viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
            : "flex flex-col gap-2"
            }`}
        >
          {data?.data?.map((cat) => (
            <SubCategoryItem
              key={cat._id}
              category={cat}
              onEdit={onEdit}
              onDelete={(id) => {
                setDeleteId(id);
                setIsDialogOpen(true);
              }}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center mt-6">
        {/* Total Records on the Left */}
        <div className="text-sm text-gray-600">
          Total Records: {data?.pagination?.total || 0}
        </div>

        {/* Pagination Controls at Center/Right */}
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
