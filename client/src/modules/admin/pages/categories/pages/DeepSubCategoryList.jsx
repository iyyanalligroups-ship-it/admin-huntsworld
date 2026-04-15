import { useState, useEffect } from "react";
import {
  useGetDeepSubCategoriesQuery,
  useDeleteDeepSubCategoryMutation,
} from "@/redux/api/DeepSubCategoryApi";
import { useDeleteDeepSubCategoryImageMutation } from "@/redux/api/DeepSubCategoryImageApi";
import DeleteDialog from "@/model/DeleteModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import showToast from "@/toast/showToast";
import noImage from "@/assets/images/no-image.jpg";

const formatName = (value) => {
  if (!value) return "";

  return value
    .replace(/[-_]/g, " ") // replace hyphen & underscore
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize each word
};


const DeepSubCategoryList = ({ onEdit, setRefetchFn }) => {
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const itemsPerPage = 10;

  const { data, isLoading, error, refetch } = useGetDeepSubCategoriesQuery({ page, limit: itemsPerPage, search: searchTerm });
  const [deleteImage] = useDeleteDeepSubCategoryImageMutation();
  const [deleteDeepSubCategory] = useDeleteDeepSubCategoryMutation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (setRefetchFn) {
      console.log("Setting refetch fn...");
      setRefetchFn(() => refetch);
    }
  }, [refetch, setRefetchFn]);

  // Reset page to 1 if no records are found on the current page
  useEffect(() => {
    if (data && data.data?.length === 0 && data.totalRecords > 0 && page > 1) {
      setPage(1);
    }
  }, [data, page]);

  // Handle API errors
  useEffect(() => {
    if (error) {
      console.error("Query error:", error);
      showToast(`Failed to fetch deep sub-categories: ${error.data?.message || error.message || "Unknown error"}`, "error");
    }
  }, [error]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    const selectedItem = data?.data?.find((item) => item._id === deleteId);
    try {
      if (selectedItem?.deep_sub_category_image) {
        try {
          const imageName = selectedItem.deep_sub_category_image.split("/").pop();
          await deleteImage(imageName).unwrap();
        } catch (imageErr) {
          console.error("Image deletion failed, proceeding with deletion:", imageErr);
        }
      }
      const response = await deleteDeepSubCategory(deleteId).unwrap();
      if (response.success === true) {
        showToast(response.message || "Deep Sub-Category Deleted Successfully", "success");
      } else {
        showToast(response.message || "Failed to Delete", "error");
      }
      await refetch();
    } catch (err) {
      console.error("Error during deletion:", err);
      showToast("Error during deletion. Please try again.", "error");
    }
    setDeleteId(null);
  };

  const currentItems = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 3;

    if (totalPages >= 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={page === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (page > maxPagesToShow) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    const startPage = Math.max(2, page - 1);
    const endPage = Math.min(totalPages - 1, page + 1);
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={page === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (page < totalPages - maxPagesToShow + 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={page === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="e.g. iPhone 15 Pro, Nike Air Max"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 border-2 border-slate-300"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block border rounded-md">
        <Table>
          <TableHeader className="bg-[#0c1f4d]">
            <TableRow>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Category</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Sub-Category</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Super Sub-Category</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Deep Sub-Category</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Image</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : currentItems.length ? (
              currentItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{formatName(item.category_id?.category_name || '-')}</TableCell>
                  <TableCell>{formatName(item.sub_category_id?.sub_category_name || '-')}</TableCell>
                  <TableCell>{formatName(item.super_sub_category_id?.super_sub_category_name || '-')}</TableCell>
                  <TableCell>{formatName(item.deep_sub_category_name || '-')}</TableCell>
                  <TableCell>
                    {item.deep_sub_category_image ? (
                      <img
                        src={`${encodeURI(item.deep_sub_category_image)}?v=${Date.now()}`}
                        alt={item.deep_sub_category_name}
                        className="rounded-md border object-cover"
                        width="50"
                        height="50"
                        onError={(e) => {
                          e.target.onerror = null; // Prevent infinite loop in case fallback fails
                          e.target.src = noImage
                        }}
                      />

                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="cursor-pointer"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(item._id)}
                      className="cursor-pointer"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : currentItems.length ? (
          currentItems.map((item) => (
            <div
              key={item._id}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <p className="font-semibold">
                Category: <span className="font-normal">{formatName(item.category_id?.category_name || '-')}</span>
              </p>
              <p>
                Sub-Category: <span className="font-normal">{formatName(item.sub_category_id?.sub_category_name || '-')}</span>
              </p>
              <p>
                Super Sub-Category: <span className="font-normal">{formatName(item.super_sub_category_id?.super_sub_category_name || '-')}</span>
              </p>
              <p>
                Deep Sub-Category: <span className="font-normal">{formatName(item.deep_sub_category_name || '-')}</span>
              </p>
              <p>
                Image:
                {item.deep_sub_category_image ? (
                  <img
                    src={`${encodeURI(item.deep_sub_category_image)}?v=${Date.now()}`}
                    alt={item.deep_sub_category_name}
                    className="rounded-md border object-cover mt-2"
                    width="50"
                    height="50"
                  />
                ) : (
                  <span className="font-normal"> -</span>
                )}
              </p>
              <div className="flex gap-3 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="cursor-pointer"
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteId(item._id)}
                  className="cursor-pointer"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No records found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>Total Records: {data?.totalRecords || 0}</div>
          <Pagination className="flex justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(page - 1)}
                  className={page === 1 ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
                />
              </PaginationItem>
              {isMobile ? (
                <PaginationItem>
                  <PaginationLink isActive>{page}</PaginationLink>
                </PaginationItem>
              ) : (
                getPaginationItems()
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(page + 1)}
                  className={page === totalPages ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        description="Are you sure you want to delete this Deep Sub-Category?"
      />
    </div>
  );
};

export default DeepSubCategoryList;