import { useState, useEffect } from "react";
import {
  useGetSuperSubCategoriesQuery,
  useDeleteSuperSubCategoryMutation,
} from "@/redux/api/SuperSubCategoryApi";
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

const formatName = (value) => {
  if (!value) return "";

  return value
    .replace(/[-_]/g, " ") // replace hyphen & underscore
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize each word
};


const SuperSubCategoryList = ({ onEdit, setRefetchFn }) => {
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const itemsPerPage = 10;

  const { data, isLoading, refetch } = useGetSuperSubCategoriesQuery({ page, limit: itemsPerPage, search: searchTerm });
  const [deleteSuperSubCategory] = useDeleteSuperSubCategoryMutation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (setRefetchFn) {
      setRefetchFn(() => refetch);
    }
  }, [refetch, setRefetchFn]);

const handleDeleteConfirm = async () => {
  if (!deleteId) return;

  try {
    // Step 1: Try to delete the SuperSubCategory
    const response = await deleteSuperSubCategory(deleteId).unwrap();

    // Step 2: Show success with exact backend message
    showToast(
      response.message || "Super Sub-Category Deleted Successfully",
      "success"
    );

    // Step 3: Refresh data
    await refetch();

  } catch (error) {
    // Step 4: Show EXACT backend validation message
    const errorMessage =
      error?.data?.message || // e.g., "Cannot delete... It has 2 deep sub-categories"
      error?.message ||
      "Failed to delete Super Sub-Category";

    showToast(errorMessage, "error");
    console.error("Delete error:", error);
  } finally {
    // Always close dialog
    setDeleteId(null);
    setIsDialogOpen(false); // or your state
  }
};
  const totalPages = data?.totalPages || 1;
  const currentItems = data?.data || [];

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
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Apple iPhone, Men's Shoes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 border-2 border-slate-300"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block border rounded-md">
        <Table>
          <TableHeader className="bg-[#0c1f4d]">
            <TableRow>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Category</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Sub-Category</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Super Sub-Category</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : currentItems.length ? (
              currentItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{formatName(item.category_id?.category_name || '-')}</TableCell>
                  <TableCell>{formatName(item.sub_category_id?.sub_category_name || '-')}</TableCell>
                  <TableCell>{formatName(item.super_sub_category_name || '-')}</TableCell>
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
                      className="cursor-pointer"
                      size="sm"
                      onClick={() => setDeleteId(item._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
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
                Super Sub-Category: <span className="font-normal">{formatName(item.super_sub_category_name || '-')}</span>
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

      <DeleteDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        description="Are you sure you want to delete this Super Sub-Category?"
      />
    </div>
  );
};

export default SuperSubCategoryList;