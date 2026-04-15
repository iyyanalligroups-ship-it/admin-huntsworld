import React, { useState, useEffect } from "react";
import { useSearchSubadminsQuery, useGetAccessRequestsBySubadminIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { useUpdateAccessRequestMutation, useDeleteAccessRequestMutation } from "@/redux/api/SubAdminAccessRequestApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
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
import { Pencil, Trash2, User, Mail, Phone, Shield, Search, Info,FileEdit,ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DeleteDialog from "@/model/DeleteModel";
import showToast from "@/toast/showToast";
import EditAccessRequestForm from "./EditAccessRequestForm";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";

// Helper function to get the last segment of a path
const getLastPathSegment = (path) => {
    if (!path) return '-';
    const segments = path.split('/');
    return segments[segments.length - 1] || '-';
};

// Helper to format page list with limit and ellipsis
const formatPageList = (permissions) => {
    if (!permissions || permissions.length === 0) return '-';
    const pageNames = permissions.map(p => getLastPathSegment(p.page));
    if (pageNames.length <= 2) return pageNames.join(', ');
    return `${pageNames.slice(0, 2).join(', ')}...`;
};

// Helper to format requested permissions with limit and ellipsis
const formatRequestedPermissions = (permissions) => {
    if (!permissions || permissions.length === 0) return '-';
    const formatted = permissions.map(p => `${getLastPathSegment(p.page)} (${p.actions.join(', ')})`);
    if (formatted.length <= 2) return formatted.join(', ');
    return `${formatted.slice(0, 2).join(', ')}...`;
};

// Helper to format approved permissions with limit and ellipsis
const formatApprovedPermissions = (approvedPermissions) => {
    if (!approvedPermissions || approvedPermissions.length === 0) return '-';
    const formatted = approvedPermissions.map(p => `${getLastPathSegment(p.page)} (${p.actions.join(', ')})`);
    if (formatted.length <= 2) return formatted.join(', ');
    return `${formatted.slice(0, 2).join(', ')}...`;
};

const AdminAccessManagement = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [selectedSubadmin, setSelectedSubadmin] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const itemsPerPage = 5;
    const { isSidebarOpen } = useSidebar();

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 1000);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Mobile detection
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { data: searchResults, isLoading: isSearching } = useSearchSubadminsQuery(debouncedQuery, { skip: !debouncedQuery });
    const { data: requestsData, isLoading: isLoadingRequests } = useGetAccessRequestsBySubadminIdQuery(
        { subadminId: selectedSubadmin?._id, page: currentPage, limit: itemsPerPage },
        { skip: !selectedSubadmin }
    );

    // Reset to page 1 if no records are found on the current page
    useEffect(() => {
        if (requestsData && requestsData.requests?.length === 0 && requestsData.totalRequests > 0 && currentPage > 1) {
            setCurrentPage(1);
        }
    }, [requestsData, currentPage]);

    const [updateAccessRequest] = useUpdateAccessRequestMutation();
    const [deleteAccessRequest] = useDeleteAccessRequestMutation();

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSelectSubadmin = (subadmin) => {
        setSelectedSubadmin(subadmin);
        setCurrentPage(1);
    };

    const handleEditRequest = (request) => {
        setSelectedRequest(request);
        setIsEditOpen(true);
    };

    const handleUpdateRequest = async (updatedPermissions) => {
        try {
            await updateAccessRequest({ request_id: selectedRequest._id, approved_permissions: updatedPermissions }).unwrap();
            showToast("Access request updated successfully", "success");
            setIsEditOpen(false);
            setSelectedRequest(null);
        } catch (error) {
            console.error("Error updating access request:", error);
            showToast(error?.data?.message || "Failed to update access request", "error");
        }
    };

    const handleDelete = (id) => {
        setDeleteId(id);
        setIsDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteAccessRequest({ request_id: deleteId }).unwrap();
            showToast("Access request deleted successfully", "success");
            setIsDialogOpen(false);
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting access request:", error);
            showToast(error?.data?.message || "Failed to delete access request", "error");
            setIsDialogOpen(false);
        }
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= (requestsData?.totalPages || 1)) {
            setCurrentPage(page);
        }
    };

    const totalPages = requestsData?.totalPages || 1;
    const hasNoRecords = requestsData?.totalRequests === 0;
    const currentItems = requestsData?.requests || [];

    const getPaginationItems = () => {
        const items = [];
        const maxPagesToShow = 3;

        if (totalPages >= 1) {
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        onClick={() => handlePageChange(1)}
                        isActive={currentPage === 1}
                        className="cursor-pointer"
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (currentPage > maxPagesToShow) {
            items.push(
                <PaginationItem key="ellipsis-start">
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }

        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, currentPage + 1);
        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        onClick={() => handlePageChange(i)}
                        isActive={currentPage === i}
                        className="cursor-pointer"
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (currentPage < totalPages - maxPagesToShow + 1) {
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
                        isActive={currentPage === totalPages}
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
        <div className={`p-4 sm:p-6 ${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'}`}>
            <h2 className="text-xl sm:text-2xl font-bold mb-6">Manage Subadmin Access Requests</h2>

            {/* Search for Subadmin */}
            <div className="mb-6">
                <Input
                    placeholder="e.g. subadmin@example.com"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="max-w-md w-full border-2 border-slate-300"
                />

                {/* --- UPDATED: SOP CONTENT (Focus on Edit/Delete per Page) --- */}
                <div className="mt-4 max-w-3xl bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
                    <h3 className="font-semibold text-[#0c1f4d] flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4" />
                        SOP: Handling Page-Level Access
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {/* Step 1 */}
                        <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                            <div className="font-medium text-slate-900 flex items-center gap-2 mb-1">
                                <Search className="w-3 h-3 text-blue-500" />
                                1. Select Subadmin
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Search and select a subadmin to view their list of requested pages.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                            <div className="font-medium text-slate-900 flex items-center gap-2 mb-1">
                                <FileEdit className="w-3 h-3 text-orange-500" />
                                2. Edit Permission
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Click the <strong>Edit</strong> icon next to a specific page to modify their rights (e.g., change from 'Read-Only' to 'Full Access').
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                            <div className="font-medium text-slate-900 flex items-center gap-2 mb-1">
                                <Trash2 className="w-3 h-3 text-red-500" />
                                3. Delete Page
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Click the <strong>Delete</strong> icon to completely remove a page from their access list.
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded border border-green-100">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>
                            <strong>Tip:</strong> Changes made to "Edit" or "Delete" are applied immediately per page row.
                        </span>
                    </div>
                </div>
                {/* --- END SOP CONTENT --- */}
                {isSearching ? (
                    <div className="mt-4 space-y-4">
                        {[1, 2, 3].map((_, index) => (
                            <Skeleton key={index} className="h-16 w-full" />
                        ))}
                    </div>
                ) : debouncedQuery && searchResults?.subadmins?.length === 0 ? (
                    <p className="mt-4 text-gray-600">No subadmins found.</p>
                ) : (
                    <ul className="mt-4 space-y-2">
                        {searchResults?.subadmins?.map((subadmin) => (
                            <li
                                key={subadmin._id}
                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-md bg-white shadow-sm"
                            >
                                <div className="mb-2 sm:mb-0">
                                    <p><strong>Name:</strong> {subadmin.name || '-'}</p>
                                    <p><strong>Email:</strong> {subadmin.email || '-'}</p>
                                    <p><strong>Phone:</strong> {subadmin.phone || '-'}</p>
                                </div>
                                <Button onClick={() => handleSelectSubadmin(subadmin)} className="cursor-pointer bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white">Select</Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Selected Subadmin Details */}
            {selectedSubadmin && (
                <Card className="mb-6 bg-gray-100 shadow-sm border rounded-2xl">
                    <CardHeader>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                            Selected Subadmin Details
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3">
                                <User className="h-5 w-5 text-gray-600" />
                                <span className="font-medium">Name:</span>
                                <span className="text-gray-700">{selectedSubadmin?.name || "-"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-gray-600" />
                                <span className="font-medium">Email:</span>
                                <span className="text-gray-700">{selectedSubadmin?.email || "-"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-gray-600" />
                                <span className="font-medium">Phone:</span>
                                <span className="text-gray-700">{selectedSubadmin?.phone || "-"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-gray-600" />
                                <span className="font-medium">Role:</span>
                                <span className="text-gray-700">{selectedSubadmin?.role || "-"}</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Access Requests List */}
            {selectedSubadmin && (
                <div>
                    <h3 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Access Requests</h3>
                    {isLoadingRequests ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, index) => (
                                <Skeleton key={index} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : hasNoRecords ? (
                        <p className="text-gray-600">No access requests found for this subadmin.</p>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <Table className="min-w-[600px]">
                                    <TableHeader className="bg-[#0c1f4d]">
                                        <TableRow>
                                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Page</TableHead>
                                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Requested Actions</TableHead>
                                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Approved Actions</TableHead>
                                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Status</TableHead>
                                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentItems.map((request) => (
                                            <TableRow key={request._id}>
                                                <TableCell>{formatPageList(request.permissions)}</TableCell>
                                                <TableCell>{formatRequestedPermissions(request.permissions)}</TableCell>
                                                <TableCell>{formatApprovedPermissions(request.approved_permissions)}</TableCell>
                                                <TableCell>{request.status || '-'}</TableCell>
                                                <TableCell className="flex justify-end gap-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Button variant="ghost" className="cursor-pointer" onClick={() => handleEditRequest(request)}>
                                                                    <Pencil className="w-4 h-4 mr-2" /> Edit
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Edit access request</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Button variant="ghost" className="cursor-pointer" onClick={() => handleDelete(request._id)}>
                                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Delete access request</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="sm:hidden space-y-4">
                                {currentItems.length > 0 ? (
                                    currentItems.map((request) => (
                                        <div
                                            key={request._id}
                                            className="border rounded-lg p-4 shadow-sm bg-white"
                                        >
                                            <p className="font-semibold">
                                                Page: <span className="font-normal">{formatPageList(request.permissions)}</span>
                                            </p>
                                            <p>
                                                Requested Actions: <span className="font-normal">{formatRequestedPermissions(request.permissions)}</span>
                                            </p>
                                            <p>
                                                Approved Actions: <span className="font-normal">{formatApprovedPermissions(request.approved_permissions)}</span>
                                            </p>
                                            <p>
                                                Status: <span className="font-normal">{request.status || '-'}</span>
                                            </p>
                                            <div className="flex gap-3 mt-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditRequest(request)}
                                                    className="cursor-pointer"
                                                >
                                                    <Pencil className="w-4 h-4 mr-1" /> Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(request._id)}
                                                    className="cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">No access requests found</div>
                                )}
                            </div>

                            {/* Pagination */}
                            {totalPages > 0 && (
                                <Pagination className="mt-4 flex justify-end">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                className={currentPage === 1 || hasNoRecords ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                        {isMobile ? (
                                            <PaginationItem>
                                                <PaginationLink isActive>{currentPage}</PaginationLink>
                                            </PaginationItem>
                                        ) : (
                                            getPaginationItems()
                                        )}
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                className={currentPage === totalPages || hasNoRecords ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Edit Access Request Form */}
            <div className="h-[400px] overflow-y-auto">
                {isEditOpen && selectedRequest && (
                    <EditAccessRequestForm
                        open={isEditOpen}
                        onClose={() => {
                            setIsEditOpen(false);
                            setSelectedRequest(null);
                        }}
                        onSubmit={handleUpdateRequest}
                        requestedPermissions={selectedRequest.permissions}
                        initialData={selectedRequest.approved_permissions || []}
                    />
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Access Request?"
                description="This action will permanently remove the access request and update the user's permissions."
            />
        </div>
    );
};

export default AdminAccessManagement;
