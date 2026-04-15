import React, { useState, useEffect } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import showToast from "@/toast/showToast";

const UnmatchedLeads = () => {
    const { isSidebarOpen } = useSidebar();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState("postByRequirement");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    useEffect(() => {
        fetchLeads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, type]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit,
                type,
            }).toString();

            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin-dashboard/unmatched-leads?${queryParams}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const result = await res.json();

            if (result.success) {
                setLeads(result.data || []);
                setTotalPages(Number(result.pagination?.pages) || 1);
            } else {
                showToast(result.message || "Error loading leads", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Error loading unmatched leads", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage, e) => {
        if (e) e.preventDefault();
        const target = Number(newPage);
        if (target < 1 || target > totalPages || target === currentPage) return;
        setCurrentPage(target);
    };

    const getPaginationItems = () => {
        if (totalPages <= 1) return [1];
        const pages = [];
        const showMax = 5;

        if (totalPages <= showMax) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) end = 4;
            if (currentPage >= totalPages - 2) start = totalPages - 3;

            if (start > 2) pages.push("ellipsis-start");
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push("ellipsis-end");

            pages.push(totalPages);
        }
        return pages;
    };

    const getTypeLabel = (lead) => {
        if (type === "buyLead") return lead.type;
        return lead.requirement_type ? lead.requirement_type : lead.type;
    };

    const getProductName = (lead) => {
        if (type === 'postByRequirement') return lead.product_or_service;
        if (type === 'grocerySellerRequirement') return lead.product_name;
        if (type === 'buyLead') return lead.searchTerm;
        return 'Unknown';
    };

    return (
        <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"} transition-all duration-300`}>
            <div className="lg:p-4">
                <h2 className="text-md mb-3 w-fit border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
                    Unmatched Leads
                </h2>
                <p className="text-sm text-gray-500 mb-6">These requirements have no matching merchants in our system.</p>

                {/* Tab Selection */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <Button
                        variant={type === 'postByRequirement' ? 'default' : 'outline'}
                        onClick={() => { setType('postByRequirement'); setCurrentPage(1); }}
                        className={type === 'postByRequirement' ? "bg-[#0c1f4d] hover:bg-[#153171] text-white" : ""}
                    >
                        Post By Requirement
                    </Button>
                    <Button
                        variant={type === 'grocerySellerRequirement' ? 'default' : 'outline'}
                        onClick={() => { setType('grocerySellerRequirement'); setCurrentPage(1); }}
                        className={type === 'grocerySellerRequirement' ? "bg-[#0c1f4d] hover:bg-[#153171] text-white" : ""}
                    >
                        Grocery Seller Requirement
                    </Button>
                    <Button
                        variant={type === 'buyLead' ? 'default' : 'outline'}
                        onClick={() => { setType('buyLead'); setCurrentPage(1); }}
                        className={type === 'buyLead' ? "bg-[#0c1f4d] hover:bg-[#153171] text-white" : ""}
                    >
                        Buy Leads
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => fetchLeads()}
                        className="ml-auto"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Loader2 className="animate-spin h-8 w-8 mb-2" />
                        <p>Loading unmatched leads...</p>
                    </div>
                )}

                {/* Mobile Card View */}
                {!loading && (
                    <div className="sm:hidden space-y-4">
                        {leads.length > 0 ? leads.map((lead) => (
                            <Card key={lead._id} className="border rounded-lg shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                                {getProductName(lead)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                By: {lead.user_id?.name || 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-600 mt-2">
                                        <p><span className="font-semibold">Phone:</span> {lead.phone_number || lead.user_id?.phone || "N/A"}</p>
                                        {type !== 'buyLead' && <p><span className="font-semibold">Quantity:</span> {lead.quantity} {lead.unit_of_measurement}</p>}
                                        <div className="pt-2 flex justify-between items-center">
                                            <Badge variant="outline" className="bg-gray-100 text-[#0c1f4d] uppercase text-[10px]">
                                                {getTypeLabel(lead)}
                                            </Badge>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )) : (
                            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                                No unmatched leads found for this type.
                            </div>
                        )}
                    </div>
                )}

                {/* Desktop Table View */}
                {!loading && (
                    <div className="hidden sm:block bg-white border border-gray-200 overflow-hidden rounded-lg">
                        <Table>
                            <TableHeader className="bg-[#0c1f4d]">
                                <TableRow>
                                    <TableHead className="text-white font-semibold">Product / Term</TableHead>
                                    <TableHead className="text-white font-semibold">User Content</TableHead>
                                    {type !== 'buyLead' && <TableHead className="text-white font-semibold">Quantity</TableHead>}
                                    <TableHead className="text-white font-semibold">Type</TableHead>
                                    <TableHead className="text-white font-semibold">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.length > 0 ? (
                                    leads.map((lead) => (
                                        <TableRow key={lead._id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-gray-900 max-w-[200px] truncate">
                                                {getProductName(lead)}
                                                {lead.description && <div className="text-xs text-gray-500 truncate mt-1">{lead.description}</div>}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                <div className="font-medium text-gray-900">{lead.user_id?.name || 'Unknown'}</div>
                                                <div className="text-xs">{lead.phone_number || lead.user_id?.phone || "—"}</div>
                                                {lead.user_id?.email && <div className="text-xs">{lead.user_id.email}</div>}
                                            </TableCell>
                                            {type !== 'buyLead' && (
                                                <TableCell className="text-sm text-gray-700">
                                                    {lead.quantity} {lead.unit_of_measurement}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 uppercase text-[10px]">
                                                    {getTypeLabel(lead)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={type === 'buyLead' ? 4 : 5} className="text-center py-10 text-gray-500">
                                            No unmatched leads found for this type.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Pagination Footer */}
                {!loading && totalPages > 0 && leads.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                        <span className="text-sm text-gray-600 font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Pagination className="justify-center sm:justify-end">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => handlePageChange(currentPage - 1, e)}
                                        aria-disabled={currentPage <= 1}
                                        className={
                                            currentPage <= 1
                                                ? "pointer-events-none opacity-50 select-none"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>

                                {getPaginationItems().map((page, index) => {
                                    if (page === "ellipsis-start" || page === "ellipsis-end") {
                                        return (
                                            <PaginationItem key={`ellipsis-${index}`}>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        );
                                    }
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href="#"
                                                isActive={currentPage === page}
                                                onClick={(e) => handlePageChange(page, e)}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}

                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => handlePageChange(currentPage + 1, e)}
                                        aria-disabled={currentPage >= totalPages}
                                        className={
                                            currentPage >= totalPages
                                                ? "pointer-events-none opacity-50 select-none"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnmatchedLeads;
