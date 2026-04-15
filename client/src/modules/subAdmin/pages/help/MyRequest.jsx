import { useState, useEffect, useContext } from "react";
import { format } from "date-fns";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, UserCheck, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/useMediaQuery"; // You'll need this hook
import { Users, Clock, MessageCircle as MessageIcon } from "lucide-react";

const MyHelpRequestsPage = () => {
    const [data, setData] = useState([]);
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [adminId, setAdminId] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
    });
    const [statusFilter, setStatusFilter] = useState("all");
    const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [selectedAdminId, setSelectedAdminId] = useState(null);
    const router = useRouter();

    // Responsive detection
    const isMobile = useMediaQuery("(max-width: 768px)");

    // Keep adminId in sync with user
    useEffect(() => {
        console.log(user,'user nfdkjdshfjfd');
        if (user?.user?._id) {
            setAdminId(user.user._id);
        } else {
            setAdminId(null);
        }
    }, [user]);

    // Fetch admins list (excluding self)
    useEffect(() => {
        if (adminId) {
            const fetchAdmins = async () => {
                try {
                    const res = await axios.get(
                        `${import.meta.env.VITE_API_URL}/users/fetch-all-admin-for-help-request`
                    );
                    // Filter out current admin to avoid self-exchange
                    setAdmins(res.data.admins.filter((a) => a._id !== adminId) || []);
                } catch (err) {
                    showToast(err.response?.data?.message || "Failed to load admins", "error");
                }
            };
            fetchAdmins();
        }
    }, [adminId]);

    // ONLY fetch when adminId exists OR when filter changes
    useEffect(() => {
        if (adminId) {
            fetchMyRequests(1, statusFilter);
        } else if (adminId === null && user) {
            showToast("You are not authorized as admin", "error");
            setLoading(false);
        }
    }, [adminId, statusFilter]);

    const fetchMyRequests = async (page = 1, status = "all") => {
        if (!adminId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const params = {
                admin_id: adminId,
                page,
                limit: 10,
            };
            if (status !== "all") params.status = status;
            console.log("Fetching with admin_id:", adminId);
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/help/my-requests`,
                { params }
            );
            setData(res.data.helpRequests || []);
            setPagination(res.data.pagination);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to load", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyRequests(1, statusFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const handleCloseRequest = async (id) => {
        if (!confirm("Close this request permanently?")) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/help/close/${id}`);
            showToast("Request closed successfully", 'success');
            fetchMyRequests(pagination.currentPage, statusFilter);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to close request", 'error');
        }
    };

    const handleExchangeRequest = async () => {
        if (!selectedAdminId) {
            showToast("Please select an admin", "error");
            return;
        }
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/help/exchange/${selectedRequestId}`,
                { newAdminId: selectedAdminId }
            );
            showToast("Request exchanged successfully", "success");
            fetchMyRequests(pagination.currentPage, statusFilter);
            setIsExchangeModalOpen(false);
            setSelectedAdminId(null);
            setSelectedRequestId(null);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to exchange request", "error");
        }
    };

    // Table columns (same as before)
    const columns = [
        {
            accessorKey: "user_id.name",
            header: "User",
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.user_id?.name || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">
                        {row.original.user_id?.email}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <div className="max-w-xs truncate">{row.getValue("description")}</div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status");
                return (
                    <Badge variant={status === "picked" ? "default" : "outline"}>
                        {status === "picked" && <UserCheck className="w-3 h-3 mr-1" />}
                        {status === "closed" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({ row }) =>
                format(new Date(row.getValue("createdAt")), "dd MMM yyyy, hh:mm a"),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const request = row.original;
                const isPicked = request.status === "picked";
                return (
                    <div className="flex gap-2">
                        {isPicked && (
                            <>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCloseRequest(request._id)}
                                >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Close
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                        setSelectedRequestId(request._id);
                                        setIsExchangeModalOpen(true);
                                    }}
                                >
                                    Exchange
                                </Button>
                            </>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/chat/${request._id}`)}
                        >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat
                        </Button>
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: pagination.totalPages,
    });

    // Card component for mobile view
    const RequestCard = ({ request }) => {
        const isPicked = request.status === "picked";
        return (
            <Card className="mb-4 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">
                                    {request.user_id?.name || "N/A"}
                                </h3>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                                {request.user_id?.email}
                            </p>
                            <div className="flex items-center gap-2">
                                <Badge variant={isPicked ? "default" : "outline"} className="text-xs">
                                    {isPicked && <UserCheck className="w-3 h-3 mr-1" />}
                                    {isPicked ? "Picked" : "Closed"}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(request.createdAt), "dd MMM yyyy")}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {request.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {isPicked && (
                            <>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCloseRequest(request._id)}
                                    className="text-xs px-2 py-1"
                                >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Close
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                        setSelectedRequestId(request._id);
                                        setIsExchangeModalOpen(true);
                                    }}
                                    className="text-xs px-2 py-1"
                                >
                                    Exchange
                                </Button>
                            </>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/chat/${request._id}`)}
                            className="text-xs px-2 py-1"
                        >
                            <MessageIcon className="w-3 h-3 mr-1" />
                            Chat
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="container mx-auto py-6 px-4 sm:py-10">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <CardTitle className="text-xl sm:text-2xl">
                            My Assigned Requests
                        </CardTitle>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All My Requests</SelectItem>
                                <SelectItem value="picked">Picked</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table View */}
                    {!isMobile && (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id}>
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="text-center py-12">
                                                Loading your requests...
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                                                You have no assigned requests.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow key={row.id}>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Mobile Card View */}
                    {isMobile && (
                        <div className="space-y-4">
                            {loading ? (
                                <Card className="text-center py-12">
                                    <CardContent>
                                        <p className="text-muted-foreground">Loading your requests...</p>
                                    </CardContent>
                                </Card>
                            ) : data.length === 0 ? (
                                <Card className="text-center py-12">
                                    <CardContent>
                                        <p className="text-muted-foreground">You have no assigned requests.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                data.map((request) => (
                                    <RequestCard key={request._id} request={request} />
                                ))
                            )}
                        </div>
                    )}

                    {/* Pagination - Same for both views */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-4">
                        <div className="text-sm text-muted-foreground">
                            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
                        </div>
                        <div className="flex gap-2 justify-center sm:justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchMyRequests(pagination.currentPage - 1, statusFilter)}
                                disabled={!pagination.hasPrev || loading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchMyRequests(pagination.currentPage + 1, statusFilter)}
                                disabled={!pagination.hasNext || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Exchange Modal - Same for both views */}
            <Dialog open={isExchangeModalOpen} onOpenChange={setIsExchangeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Exchange Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Select onValueChange={setSelectedAdminId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Admin" />
                            </SelectTrigger>
                            <SelectContent>
                                {admins.map((admin) => (
                                    <SelectItem key={admin._id} value={admin._id}>
                                        {admin.name} ({admin.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleExchangeRequest}>Confirm Exchange</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default MyHelpRequestsPage;
