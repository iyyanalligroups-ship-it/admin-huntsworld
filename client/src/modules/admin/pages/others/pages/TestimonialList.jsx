import React, { useState, useEffect } from "react";
import {
    useGetTestimonialsQuery,
    useDeleteTestimonialMutation,
} from "@/redux/api/Testimonialapi";
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
import showToast from "@/toast/showToast";
import DeleteDialog from "@/model/DeleteModel";

const TestimonialList = ({ onEdit, refreshKey, onRefresh }) => {
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const [deleteId, setDeleteId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const { data: testimonials, isLoading, refetch } = useGetTestimonialsQuery({
        filter,
        page,
    });
    const [deleteTestimonial] = useDeleteTestimonialMutation();

    // Handle window resize to toggle mobile view
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        refetch();
    }, [refreshKey]);

    const totalTestimonials = testimonials?.totalCount || 0;
    const totalPages =
        totalTestimonials > 0 ? Math.ceil(totalTestimonials / itemsPerPage) : 0;

    const handleDelete = async (id) => {
        setIsDialogOpen(true);
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        try {
            const response = await deleteTestimonial(deleteId).unwrap();
            if (response) {
                showToast("Testimonial deleted successfully",'success');
            }
            setIsDialogOpen(false);
            onRefresh?.();
        } catch (error) {
            setIsDialogOpen(false);
            showToast(error.message || "Failed to delete testimonial",'error');
        }
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

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    const currentTestimonials = testimonials?.data?.slice(startIndex, endIndex);

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

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <div className="flex items-center justify-between">
                <h2 className="text-md border-1 border-[#0c1f4d] w-fit text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Manage Feedback List</h2>
                <Select value={filter} onValueChange={handleFilterChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Feedback Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="suggestions">Suggestions</SelectItem>
                        <SelectItem value="applications">Applications</SelectItem>
                        <SelectItem value="bug_error_report">Bug / Error Report</SelectItem>
                        <SelectItem value="purchase_requirement">
                            Purchase Requirement
                        </SelectItem>
                        <SelectItem value="complaint">Complaint</SelectItem>
                        <SelectItem value="interested_in_services">
                            Interested in Services
                        </SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {!isMobile ? (
                // Desktop/Tablet View - Table Layout
                <div className="border">
                    {isLoading ? (
                        <div className="p-4">
                            <Skeleton className="h-10 w-full mb-2" />
                            <Skeleton className="h-10 w-full mb-2" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <Table className="min-w-[800px] w-full divide-y divide-gray-200 bg-white">
                            <TableHeader className="bg-[#0c1f4d]">
                                <TableRow>
                                    <TableCell className="text-white">Name</TableCell>
                                    <TableCell className="text-white">Feedback Type</TableCell>
                                    <TableCell className="text-white">Comments</TableCell>
                                    <TableCell className="text-white">Rating</TableCell>
                                    <TableCell className="text-white">Actions</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentTestimonials?.length > 0 ? (
                                    currentTestimonials.map((testimonial) => (
                                        <TableRow key={testimonial._id}>
                                            <TableCell>{testimonial?.user_id?.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{testimonial.feedbackType}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[250px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                {testimonial.comments}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="flex items-center gap-2">
                                                    <Star size={16} color="#FFD700" />
                                                    <span>{testimonial.rating}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" onClick={() => onEdit(testimonial)} className="cursor-pointer">
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button variant="outline" onClick={() => handleDelete(testimonial._id)} className="cursor-pointer">
                                                        <Trash size={16} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">
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
                    {isLoading ? (
                        <div className="p-4">
                            <Skeleton className="h-32 w-full mb-4" />
                            <Skeleton className="h-32 w-full mb-4" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ) : currentTestimonials?.length > 0 ? (
                        currentTestimonials.map((testimonial) => (
                            <Card key={testimonial._id} className="mb-4">
                                <CardHeader>
                                    <CardTitle className="text-lg">{testimonial?.user_id?.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div>
                                        <strong>Feedback Type:</strong>{' '}
                                        <Badge variant="outline">{testimonial.feedbackType}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        <strong>Comments:</strong> {testimonial.comments}
                                    </p>
                                    <div>
                                        <strong>Rating:</strong>{' '}
                                        <Badge variant="outline" className="flex items-center gap-2">
                                            <Star size={16} color="#FFD700" />
                                            <span>{testimonial.rating}</span>
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onEdit(testimonial)}
                                            className="cursor-pointer"
                                        >
                                            <Edit size={16} className="mr-1" /> Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(testimonial._id)}
                                            className="cursor-pointer"
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
            )}

            <DeleteDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Feedback?"
                description="This action will permanently remove the feedback."
            />
        </div>
    );
};

export default TestimonialList;
