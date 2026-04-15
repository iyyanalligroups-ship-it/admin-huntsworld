import { useState, useEffect, useContext } from "react";
import {
  useGetDeepSubCategoriesQuery,
  useDeleteDeepSubCategoryMutation,
} from "@/redux/api/DeepSubCategoryApi";
import { useDeleteDeepSubCategoryImageMutation } from "@/redux/api/DeepSubCategoryImageApi";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import DeleteDialog from "@/model/DeleteModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash } from "lucide-react";
import showToast from "@/toast/showToast";
import noImage from "@/assets/images/no-image.jpg";

const formatName = (value) => {
  if (!value) return "";

  return value
    .replace(/[-_]/g, " ") // replace hyphen & underscore
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize each word
};


const DeepSubCategoryList = ({ onEdit, setRefetchFn }) => {
  const { user } = useContext(AuthContext);
  const { isSidebarOpen } = useSidebar();
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const itemsPerPage = 10;

  const userId = user?.user?._id;
  const {
    data: currentUser,
    isError: isUserError,
    error: userError,
  } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check permissions for the current page
  const currentPagePath = "categories/deep-sub";
  const pagePermissions = currentUser?.approved_permissions?.find(
    (p) => p.page === currentPagePath
  );
  const canEdit = pagePermissions?.actions?.includes("edit") || false;
  const canDelete = pagePermissions?.actions?.includes("delete") || false;

  const { data, isLoading, isFetching, error, refetch } = useGetDeepSubCategoriesQuery({
    page,
    search: searchTerm, // Added server-side search
  });
  const [deleteImage] = useDeleteDeepSubCategoryImageMutation();
  const [deleteDeepSubCategory, { isLoading: deleting, isError: deleteError, isSuccess: deleteSuccess }] = useDeleteDeepSubCategoryMutation();

  // Handle window resize to toggle mobile view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show toast for permission errors and success messages
  useEffect(() => {
    if (isUserError) {
      console.error("Error fetching user permissions:", userError);
      showToast("Failed to load user permissions", "error");
    }
    if (deleteSuccess) {
      showToast("Deep Sub-Category deleted successfully", "success");
      setDeleteId(null);
      refetch();
    }
  }, [isUserError, userError, deleteSuccess, refetch]);

  useEffect(() => {
    if (setRefetchFn) {
      setRefetchFn(() => refetch);
    }
  }, [refetch, setRefetchFn]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    const selectedItem = data?.data?.find((item) => item._id === deleteId);
    try {
      if (selectedItem?.deep_sub_category_image) {
        try {
          const imageName = selectedItem.deep_sub_category_image.split("/").pop();
          await deleteImage(imageName).unwrap();
        } catch (imageErr) {
          console.error("Image deletion failed, proceeding with deep sub-category deletion:", imageErr);
        }
      }
      const response = await deleteDeepSubCategory(deleteId).unwrap();
      if (response.success) {
        // Success toast handled in useEffect for deleteSuccess
      } else {
        showToast(response.message || "Failed to delete deep sub-category", "error");
      }
    } catch (err) {
      console.error("Error during deletion:", err);
      showToast(err?.data?.message || "Failed to delete deep sub-category", "error");
    }
    setDeleteId(null);
  };

  const handleEdit = (item) => {
    if (!canEdit) {
      showToast("You do not have permission to edit deep sub-categories", "error");
      return;
    }
    onEdit(item);
  };

  const handleDelete = (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete deep sub-categories", "error");
      return;
    }
    setDeleteId(id);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  // Generate pagination items for desktop view
  const getPaginationItems = () => {
    const items = [];
    const totalPages = data?.totalPages || 1;
    const maxPagesToShow = 3; // Show current page and one on each side

    // Always show first page
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

    // Add ellipsis after first page if needed
    if (page > maxPagesToShow) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Show pages around current page
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

    // Add ellipsis before last page if needed
    if (page < totalPages - maxPagesToShow + 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if more than one page
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

  const errorMessage = deleteError?.data?.message || (error ? error.message || "Failed to fetch deep sub-categories" : null);

  if (error) {
    return (
      <div className="container mx-auto lg:p-4 text-red-500">
        Error fetching deep sub-categories: {error.message}{" "}
        <button onClick={() => refetch()} className="underline text-[#0c1f4d]">
          Retry
        </button>
      </div>
    );
  }

  // Apply client-side filtering only if searchTerm is non-empty
  const filteredData = searchTerm
    ? data?.data?.filter((item) =>
      item.deep_sub_category_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    ) || []
    : data?.data || [];

  return (
    <div >
      <div className=" space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* <h2 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
            Manage Deep Sub-Categories
          </h2> */}
          <div className="flex gap-4">
            <Input
              placeholder="Search Deep Sub-Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72"
            />
            <Button
              onClick={() => refetch()}
              className="flex items-center bg-[#0c1f4d] hover:bg-[#0a1d49f7] text-white"
            >
              Refresh
            </Button>
          </div>
        </div>

        {errorMessage && (
          <Alert className="mb-4 bg-red-500 text-white" variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {!isMobile ? (
          // Desktop/Tablet View - Table Layout
          <div className="border">
            {isLoading || isFetching ? (
              <div className="p-4">
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table className="min-w-[800px] w-full divide-y divide-gray-200 bg-white">
                <TableHeader className="bg-[#0c1f4d]">
                  <TableRow>
                    <TableHead className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      S.No
                    </TableHead>
                    <TableHead className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      Category
                    </TableHead>
                    <TableHead className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      Sub-Category
                    </TableHead>
                    <TableHead className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      Super Sub-Category
                    </TableHead>
                    <TableHead className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      Deep Sub-Category
                    </TableHead>
                    <TableHead className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      Image
                    </TableHead>
                    <TableHead className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <TableRow key={item._id} className="hover:bg-gray-50">
                        <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {(page - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {formatName(item.category_id?.category_name || "-")}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatName(item.sub_category_id?.sub_category_name || "-")}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatName(item.super_sub_category_id?.super_sub_category_name || "-")}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatName(item.deep_sub_category_name || "-")}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {item.deep_sub_category_image ? (
                            <img
                              src={`${encodeURI(item.deep_sub_category_image)}?v=${Date.now()}`}
                              alt={item.deep_sub_category_name || "Deep Sub-Category"}
                              className="w-12 h-12 rounded-md border object-cover"
                              onError={(e) => {
                                e.target.src = noImage;
                              }}
                            />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              disabled={!canEdit}
                              className="cursor-pointer"
                              title={!canEdit ? "You do not have permission to edit deep sub-categories" : "Edit deep sub-category"}
                            >
                              <Edit size={16} className="mr-1" /> Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item._id)}
                              disabled={!canDelete}
                              className="cursor-pointer text-red-600 hover:text-red-800"
                              title={!canDelete ? "You do not have permission to delete deep sub-categories" : "Delete deep sub-category"}
                            >
                              <Trash size={16} className="mr-1" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No deep sub-categories found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          // Mobile View - Card Layout
          <div className="space-y-4">
            {isLoading || isFetching ? (
              <div className="p-4">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <Card key={item._id} className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.deep_sub_category_name || "-"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>S.No:</strong> {(page - 1) * itemsPerPage + index + 1}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Category:</strong> {item.category_id?.category_name || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Sub-Category:</strong> {item.sub_category_id?.sub_category_name || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Super Sub-Category:</strong> {item.super_sub_category_id?.super_sub_category_name || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Deep Sub-Category:</strong> {item.deep_sub_category_name || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Image:</strong>{" "}
                      {item.deep_sub_category_image ? (
                        <img
                          src={`${encodeURI(item.deep_sub_category_image)}?v=${Date.now()}`}
                          alt={item.deep_sub_category_name || "Deep Sub-Category"}
                          className="w-12 h-12 rounded-md border object-cover inline-block mt-2"
                          onError={(e) => {
                            e.target.src = noImage;
                          }}
                        />
                      ) : (
                        "-"
                      )}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={!canEdit}
                        className="cursor-pointer"
                        title={!canEdit ? "You do not have permission to edit deep sub-categories" : "Edit deep sub-category"}
                      >
                        <Edit size={16} className="mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item._id)}
                        disabled={!canDelete}
                        className="cursor-pointer text-red-600 hover:text-red-800"
                        title={!canDelete ? "You do not have permission to delete deep sub-categories" : "Delete deep sub-category"}
                      >
                        <Trash size={16} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No deep sub-categories found</div>
            )}
          </div>
        )}

        {/* Pagination Section */}
        {data?.totalPages > 0 && (
          <Pagination className="mt-4 flex justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(page - 1)}
                  className={page === 1 || isFetching ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
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
                  className={page === (data?.totalPages || 1) || isFetching ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <div>Total Records: {data?.totalRecords || 0}</div>
        </div>

        <DeleteDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDeleteConfirm}
          title="Confirm Deletion"
          description="Are you sure you want to delete this Deep Sub-Category?"
          isLoading={deleting}
        />
      </div>
    </div>
  );
};

export default DeepSubCategoryList;