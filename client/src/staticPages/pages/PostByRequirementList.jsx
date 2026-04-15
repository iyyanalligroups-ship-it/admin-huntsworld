import React, { useContext, useState } from "react";
import {
    useGetPostByRequirementsQuery,
    useDeletePostByRequirementMutation,
} from "@/redux/api/PostByRequirementApi";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipProvider,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationLink,
    PaginationNext,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 , FileText, CheckCircle2, ShieldAlert } from "lucide-react";

import DeleteDialog from "@/model/DeleteModel";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";

const PostByRequirementList = ({ onEdit }) => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedId, setSelectedId] = useState(null);
    const { user } = useContext(AuthContext);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const userId = user?.user?._id;
    const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

    // Check permissions for the current page
    const currentPagePath = "others/testimonial";
    const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
    const canEdit = pagePermissions?.actions?.includes("edit") || false;
    const canDelete = pagePermissions?.actions?.includes("delete") || false;
    const { data, isLoading, refetch } = useGetPostByRequirementsQuery({
        page,
        limit: itemsPerPage,
    });



    const [deletePost] = useDeletePostByRequirementMutation();

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const totalItems = data?.pagination?.total || 0;
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 0;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    const currentItems = data?.data?.slice(startIndex, endIndex) || [];

    const handleDeleteClick = (id) => {
        setSelectedId(id);
        setIsDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await deletePost(selectedId).unwrap();
            refetch();
            if (response.success) {
                showToast(response.message || "Requirement Deleted Successfully",'success');
            } else {
                showToast(response.message || "Failed to Delete",'error');
            }
            setIsDialogOpen(false);
        } catch (error) {
            showToast(error.message || "Something went wrong");
            console.error("Delete failed", error);
        }
    };

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

    if (isLoading) {
        return (
            <div className="p-4">
                {isMobile ? (
                    <div className="space-y-4">
                        <div className="border rounded-lg p-4 h-32 animate-pulse bg-gray-100" />
                        <div className="border rounded-lg p-4 h-32 animate-pulse bg-gray-100" />
                        <div className="border rounded-lg p-4 h-32 animate-pulse bg-gray-100" />
                    </div>
                ) : (
                    <div className="border rounded-lg p-4">
                        <div className="h-10 animate-pulse bg-gray-100 mb-2" />
                        <div className="h-10 animate-pulse bg-gray-100 mb-2" />
                        <div className="h-10 animate-pulse bg-gray-100" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <TooltipProvider>
            <h2 className="text-md border-1 mb-4 border-[#0c1f4d]  w-fit text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
                Details of Post By Requirement
            </h2>

{/* SOP / Requirement Management Guidelines */}
<div className="bg-cyan-50 border border-cyan-200 rounded-lg p-5 mb-6 shadow-sm">
    <div className="flex items-start gap-3">
        <FileText className="text-cyan-700 mt-1 shrink-0" size={24} />
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-cyan-900">
                User Requirements & Leads SOP
            </h2>
            <p className="text-sm text-cyan-800">
                This feed contains service or product requests posted by users. Your goal is to **validate** these leads before they are shared with merchants.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {/* Step 1: Quality Check */}
                <div className="bg-white/60 p-3 rounded border border-cyan-100">
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldAlert className="w-4 h-4 text-orange-500" />
                        <span className="font-semibold text-gray-900 text-sm">1. Quality Check</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        Read the description. Is it a genuine request? Check if the contact info looks real. Reject vague requests like "test" or "abc".
                    </p>
                </div>

                {/* Step 2: Approval */}
                <div className="bg-white/60 p-3 rounded border border-cyan-100">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-gray-900 text-sm">2. Verify & Publish</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        Click **Verify/Approve** to make the requirement live. This allows relevant merchants to see the lead and contact the customer.
                    </p>
                </div>

                {/* Step 3: Delete */}
                <div className="bg-white/60 p-3 rounded border border-cyan-100">
                    <div className="flex items-center gap-2 mb-1">
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span className="font-semibold text-gray-900 text-sm">3. Remove Spam</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        If the post is spam, offensive, or a duplicate, use the **Delete** button immediately to keep the marketplace clean.
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>
            {/* Desktop Table */}
            <div className="hidden sm:block border  overflow-x-auto">
                <Table>
                    <TableHeader className="bg-[#0c1f4d] group-hover:bg-[#0c204de7]">
                        <TableRow>
                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Customer Name</TableHead>
                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Phone Number</TableHead>
                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Product / Service</TableHead>
                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Quantity</TableHead>
                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Unit</TableHead>
                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Phone</TableHead>
                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Supplier Preference</TableHead>
                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">States</TableHead>
                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <TableRow key={item._id}>
                                    <TableCell>{item?.user_id?.name || "unknown"}</TableCell>
                                    <TableCell>{item.user_id?.phone || item?.user_id?.email || '-'}</TableCell>
                                    <TableCell>{item.product_or_service}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.unit_of_measurement}</TableCell>
                                    <TableCell>{item.phone_number}</TableCell>
                                    <TableCell>{item.supplier_preference}</TableCell>
                                    <TableCell>
                                        {item.selected_states?.join(", ") || "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {/* <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="cursor-pointer"
                                                        onClick={() => onEdit(item)}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Edit</p>
                                                </TooltipContent>
                                            </Tooltip> */}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        className="cursor-pointer"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(item._id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-white" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Delete</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                    No requirements found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
                {currentItems.length > 0 ? (
                    currentItems.map((item) => (
                        <div
                            key={item._id}
                            className="border rounded-lg p-4 shadow-sm bg-white"
                        >
                            <p className="font-semibold">
                                Product / Service:{" "}
                                <span className="font-normal">{item.product_or_service}</span>
                            </p>
                            <p>
                                Quantity: <span className="font-normal">{item.quantity}</span>
                            </p>
                            <p>
                                Unit: <span className="font-normal">{item.unit_of_measurement}</span>
                            </p>
                            <p>
                                Phone: <span className="font-normal">{item.phone_number}</span>
                            </p>
                            <p>
                                Supplier Preference:{" "}
                                <span className="font-normal">{item.supplier_preference}</span>
                            </p>
                            <p>
                                States:{" "}
                                <span className="font-normal">
                                    {item.selected_states?.join(", ") || "N/A"}
                                </span>
                            </p>
                            <div className="flex gap-3 mt-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={!canEdit}
                                    title={!canEdit ? "You do not have permission to edit news" : "Edit news"}
                                    onClick={() => onEdit(item)}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    disabled={!canDelete}
                                    title={!canDelete ? "You do not have permission to delete news" : "Delete news"}
                                    onClick={() => handleDeleteClick(item._id)}
                                >
                                    <Trash2 className="w-4 h-4 text-white" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">No requirements found</div>
                )}
            </div>

            {/* Pagination */}
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

            {/* Delete Dialog */}
            <DeleteDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Requirement?"
                description="This action will permanently remove this requirement post."
            />
        </TooltipProvider>
    );
};

export default PostByRequirementList;
