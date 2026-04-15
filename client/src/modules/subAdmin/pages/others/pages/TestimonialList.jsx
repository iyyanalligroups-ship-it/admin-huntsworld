import React, { useState, useEffect, useContext } from "react";
import {
  useGetTestimonialsQuery,
  useDeleteTestimonialMutation,
} from "@/redux/api/Testimonialapi";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import showToast from "@/toast/showToast";
import DeleteDialog from "@/model/DeleteModel";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";

const TestimonialList = ({ onEdit, refreshKey, onRefresh }) => {
  const { user } = useContext(AuthContext);
  const { isSidebarOpen } = useSidebar();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteId, setDeleteId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check permissions for the current page
  const currentPagePath = "others/testimonial";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions?.includes("edit") || false;
  const canDelete = pagePermissions?.actions?.includes("delete") || false;

  const { data: testimonials, isLoading, isFetching, error, refetch } = useGetTestimonialsQuery({
    filter,
    page,
  });
  const [deleteTestimonial, { isLoading: deleting, isError: deleteError, isSuccess: deleteSuccess }] = useDeleteTestimonialMutation();

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
      showToast("Testimonial deleted successfully", "success");
      setIsDialogOpen(false);
      setDeleteId(null);
      onRefresh?.();
    }
  }, [isUserError, userError, deleteSuccess, onRefresh]);

  useEffect(() => {
    refetch();
  }, [refreshKey, refetch]);

  const totalTestimonials = testimonials?.totalCount || 0;
  const totalPages = totalTestimonials > 0 ? Math.ceil(totalTestimonials / itemsPerPage) : 0;
  const currentTestimonials = testimonials?.data || [];

  const handleDelete = (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete testimonials", "error");
      return;
    }
    setIsDialogOpen(true);
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      await deleteTestimonial(deleteId).unwrap();
    } catch (error) {
      showToast(error.message || "Failed to delete testimonial", "error");
      setIsDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (testimonial) => {
    if (!canEdit) {
      showToast("You do not have permission to edit testimonials", "error");
      return;
    }
    onEdit(testimonial);
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Generate pagination items for desktop view
  const getPaginationItems = () => {
    const items = [];
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

  const errorMessage = deleteError?.data?.message || (error ? error.message || "Failed to fetch testimonials" : null);

  if (error) {
    return (
      <div className="container mx-auto lg:p-4 text-red-500">
        Error fetching testimonials: {error.message}{" "}
        <button onClick={() => refetch()} className="underline text-[#0c1f4d]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div >
      <div className=" lg:p-4 space-y-6">
        {/* Filter Section */}
        <div className="flex  justify-between flex-wrap gap-4">
          <h2 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
            Manage Feedback List
          </h2>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Filter by Feedback Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="suggestions">Suggestions</SelectItem>
              <SelectItem value="applications">Applications</SelectItem>
              <SelectItem value="bug_error_report">Bug / Error Report</SelectItem>
              <SelectItem value="purchase_requirement">Purchase Requirement</SelectItem>
              <SelectItem value="complaint">Complaint</SelectItem>
              <SelectItem value="interested_in_services">Interested in Services</SelectItem>
              <SelectItem value="others">Others</SelectItem>
            </SelectContent>
          </Select>
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
              <Table className=" w-full divide-y divide-gray-200 bg-white">
                <TableHeader className="bg-[#0c1f4d]">
                  <TableRow>
                    <TableCell className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      S.No
                    </TableCell>
                    <TableCell className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      Name
                    </TableCell>
                    <TableCell className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      Feedback Type
                    </TableCell>
                    <TableCell className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      Comments
                    </TableCell>
                    <TableCell className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      Rating
                    </TableCell>
                    <TableCell className="text-white px-4 py-3 text-left text-sm font-semibold whitespace-nowrap hover:bg-transparent">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200">
                  {currentTestimonials.length > 0 ? (
                    currentTestimonials.map((testimonial, index) => (
                      <TableRow key={testimonial._id} className="hover:bg-gray-50">
                        <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {(page - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {testimonial?.user_id?.name || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          <Badge variant="outline">{testimonial.feedbackType}</Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-600 max-w-[250px] whitespace-nowrap overflow-hidden text-ellipsis">
                          {testimonial.comments || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          <Badge variant="outline" className="flex items-center gap-2">
                            <Star size={16} color="#FFD700" />
                            <span>{testimonial.rating}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            {/* <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(testimonial)}
                              disabled={!canEdit}
                              className="cursor-pointer"
                              title={!canEdit ? "You do not have permission to edit testimonials" : "Edit testimonial"}
                            >
                              <Edit size={16} />
                            </Button> */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(testimonial._id)}
                              disabled={!canDelete}
                              className="cursor-pointer text-red-600 hover:text-red-800"
                              title={!canDelete ? "You do not have permission to delete testimonials" : "Delete testimonial"}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No testimonials found
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
            ) : currentTestimonials.length > 0 ? (
              currentTestimonials.map((testimonial, index) => (
                <Card key={testimonial._id} className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">{testimonial?.user_id?.name || "-"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>S.No:</strong> {(page - 1) * itemsPerPage + index + 1}
                    </p>
                    <div className="text-sm text-gray-600">
                      <strong>Feedback Type:</strong>{' '}
                      <Badge variant="outline">{testimonial.feedbackType}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>Comments:</strong> {testimonial.comments || "-"}
                    </p>
                    <div className="text-sm text-gray-600">
                      <strong>Rating:</strong>{' '}
                      <Badge variant="outline" className="flex items-center gap-2">
                        <Star size={16} color="#FFD700" />
                        <span>{testimonial.rating}</span>
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(testimonial)}
                        disabled={!canEdit}
                        className="cursor-pointer"
                        title={!canEdit ? "You do not have permission to edit testimonials" : "Edit testimonial"}
                      >
                        <Edit size={16} className="mr-1" /> Edit
                      </Button> */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(testimonial._id)}
                        disabled={!canDelete}
                        className="cursor-pointer text-red-600 hover:text-red-800"
                        title={!canDelete ? "You do not have permission to delete testimonials" : "Delete testimonial"}
                      >
                        <Trash size={16} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No testimonials found</div>
            )}
          </div>
        )}

        {/* Pagination Section */}
        {totalPages > 0 && (
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
                  className={page === totalPages || isFetching ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <DeleteDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Feedback?"
          description="This action will permanently remove the feedback."
          isLoading={deleting}
        />
      </div>
    </div>
  );
};

export default TestimonialList;