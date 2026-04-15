// src/pages/admin/HelpRequests.jsx
import { useState, useEffect, useContext } from "react";
import { format } from "date-fns";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MessageCircle,
    UserCheck,
    Clock,
    CheckCircle,
    XCircle,
    Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import showToast from "@/toast/showToast";
import { useSidebar } from "../../hooks/useSidebar";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSelectedUser } from "../../context/SelectedUserContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function HelpRequests() {
    const navigate = useNavigate();
    const { isSidebarOpen } = useSidebar();
    const { user } = useContext(AuthContext);
    const { setSelectedUser } = useSelectedUser();
    const adminId = user?.user?._id;

    // Shared states
    const [admins, setAdmins] = useState([]);
    const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [selectedAdminId, setSelectedAdminId] = useState(null);

    // All Requests State
    const [allRequests, setAllRequests] = useState([]);
    const [allLoading, setAllLoading] = useState(true);
    const [allPagination, setAllPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
    });
    const [allFilter, setAllFilter] = useState("all");

    // My Requests State
    const [myRequests, setMyRequests] = useState([]);
    const [myLoading, setMyLoading] = useState(true);
    const [myPagination, setMyPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
    });
    const [myFilter, setMyFilter] = useState("all");

    // Fetch other admins (for exchange)
    useEffect(() => {
        if (adminId) {
            const fetchAdmins = async () => {
                try {
                    const res = await axios.get(
                        `${import.meta.env.VITE_API_URL}/users/fetch-all-admin-for-help-request`
                    );
                    setAdmins(res.data.admins.filter((a) => a._id !== adminId) || []);
                } catch (err) {
                    showToast(err.response?.data?.message || "Failed to load admins", "error");
                }
            };
            fetchAdmins();
        }
    }, [adminId]);

    // Fetch All Requests
    const fetchAll = async (page = 1, status = "all") => {
        setAllLoading(true);
        try {
            const params = { page, limit: 10 };
            if (status !== "all") params.status = status;

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/help/all`, { params });
            setAllRequests(res.data.helpRequests || []);
            setAllPagination(res.data.pagination);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to load requests", "error");
        } finally {
            setAllLoading(false);
        }
    };

    // Fetch My Requests
    const fetchMy = async (page = 1, status = "all") => {
        if (!adminId) {
            showToast("Please login as admin", "error");
            setMyLoading(false);
            return;
        }
        setMyLoading(true);
        try {
            const params = { admin_id: adminId, page, limit: 10 };
            if (status !== "all") params.status = status;

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/help/my-requests`, { params });
            setMyRequests(res.data.helpRequests || []);
            setMyPagination(res.data.pagination);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to load your requests", "error");
        } finally {
            setMyLoading(false);
        }
    };

    useEffect(() => {
        fetchAll(1, allFilter);
    }, [allFilter]);

    useEffect(() => {
        fetchMy(1, myFilter);
    }, [myFilter, adminId]);

    const handlePick = async (id) => {
        if (!adminId) return showToast("Login required", "error");
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/help/pick/${id}`, { admin_id: adminId });
            showToast("Request picked successfully!", "success");
            fetchAll(allPagination.currentPage, allFilter);
            fetchMy(myPagination.currentPage, myFilter);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to pick", "error");
        }
    };

    const handleClose = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/help/close/${id}`, { admin_id: adminId });
            showToast("Request closed!", "success");
            fetchMy(myPagination.currentPage, myFilter);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to close", "error");
        }
    };

    const handleExchange = async () => {
        if (!selectedAdminId) {
            showToast("Please select an admin", "error");
            return;
        }
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/help/exchange/${selectedRequestId}`,
                { newAdminId: selectedAdminId }
            );

            showToast("Request passed successfully!", "success");
            fetchMy(myPagination.currentPage, myFilter);
            setIsExchangeModalOpen(false);
            setSelectedAdminId(null);
            setSelectedRequestId(null);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to pass request", "error");
        }
    };

    const handleNavigateToChat = (userId) => {
        const obj = { _id: userId };
        setSelectedUser(obj);
        navigate("/admin-dashboard/chat");
    };

    // Mobile Card for All Requests
    const AllRequestCard = ({ req }) => (
        <Card className="mb-4 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">{req.user_id?.name || "N/A"}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{req.user_id?.email}</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant={
                                    req.status === "pending"
                                        ? "secondary"
                                        : req.status === "picked"
                                            ? "default"
                                            : "outline"
                                }
                                className="text-xs"
                            >
                                {req.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                                {req.status === "picked" && <UserCheck className="w-3 h-3 mr-1" />}
                                {req.status === "closed" && <CheckCircle className="w-3 h-3 mr-1" />}
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(new Date(req.createdAt), "dd MMM yyyy")}
                            </div>
                        </div>
                        {req.picked_by && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Picked by: <span className="font-medium">{req.picked_by.name}</span>
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{req.description}</p>
                <div className="flex justify-end">
                    {req.status === "pending" && (
                        <Button size="sm" onClick={() => handlePick(req._id)}>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Pick
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    // Mobile Card for My Requests (unchanged)
    const MyRequestCard = ({ req }) => {
        const isPicked = req.status === "picked";
        return (
            <Card className="mb-4 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">{req.user_id?.name || "N/A"}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{req.user_id?.email}</p>
                            <div className="flex items-center gap-2">
                                <Badge variant={isPicked ? "default" : "outline"} className="text-xs">
                                    {isPicked && <UserCheck className="w-3 h-3 mr-1" />}
                                    {isPicked ? "Picked" : "Closed"}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(req.createdAt), "dd MMM yyyy")}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{req.description}</p>
                    <div className="flex flex-wrap gap-2">
                        {isPicked && (
                            <>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleClose(req._id)}
                                    className="text-xs px-2 py-1"
                                >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Close
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                        setSelectedRequestId(req._id);
                                        setIsExchangeModalOpen(true);
                                    }}
                                    className="text-xs px-2 py-1"
                                >
                                    Pass Request
                                </Button>
                            </>
                        )}
                        {isPicked && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNavigateToChat(req.user_id?._id)}
                                className="text-xs px-2 py-1"
                            >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                Chat
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"} transition-all`}>
            <div className="container mx-auto py-6 px-4 sm:py-10">
                <h1 className="text-3xl font-bold mb-8 text-center">Admin Help Desk</h1>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-10">
                        <TabsTrigger value="all">All Requests</TabsTrigger>
                        <TabsTrigger value="my">My Requests</TabsTrigger>
                    </TabsList>

                    {/* ========== ALL REQUESTS TAB ========== */}
                    <TabsContent value="all">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <CardTitle className="text-2xl">All Help Requests</CardTitle>
                                    <Select value={allFilter} onValueChange={setAllFilter}>
                                        <SelectTrigger className="w-full sm:w-48 border-2 border-slate-300">
                                            <SelectValue placeholder="Filter status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Requests</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="picked">Picked</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Desktop Table - Visible only on md and above */}
                                <div className="hidden md:block rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Picked By</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-12">
                                                        Loading requests...
                                                    </TableCell>
                                                </TableRow>
                                            ) : allRequests.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                        No help requests found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                allRequests.map((req) => (
                                                    <TableRow key={req._id}>
                                                        <TableCell>
                                                            <div className="font-medium">{req.user_id?.name || "N/A"}</div>
                                                            <div className="text-sm text-muted-foreground">{req.user_id?.email}</div>
                                                        </TableCell>
                                                        <TableCell className="max-w-xs truncate">{req.description}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    req.status === "pending"
                                                                        ? "secondary"
                                                                        : req.status === "picked"
                                                                            ? "default"
                                                                            : "outline"
                                                                }
                                                            >
                                                                {req.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                                                                {req.status === "picked" && <UserCheck className="w-3 h-3 mr-1" />}
                                                                {req.status === "closed" && <CheckCircle className="w-3 h-3 mr-1" />}
                                                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {req.picked_by ? (
                                                                <div>
                                                                    <div className="font-medium">{req.picked_by.name}</div>
                                                                    <div className="text-sm text-muted-foreground">{req.picked_by.email}</div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground italic">Not picked</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(new Date(req.createdAt), "dd MMM yyyy, hh:mm a")}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {req.status === "pending" && (
                                                                <Button size="sm" onClick={() => handlePick(req._id)}>
                                                                    <UserCheck className="w-4 h-4 mr-1" />
                                                                    Pick
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Card View - Visible only below md */}
                                <div className="md:hidden space-y-4">
                                    {allLoading ? (
                                        <p className="text-center py-12 text-muted-foreground">Loading...</p>
                                    ) : allRequests.length === 0 ? (
                                        <p className="text-center py-12 text-muted-foreground">No help requests found.</p>
                                    ) : (
                                        allRequests.map((req) => <AllRequestCard key={req._id} req={req} />)
                                    )}
                                </div>

                                {/* Pagination */}
                                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {allPagination.currentPage} of {allPagination.totalPages} ({allPagination.totalItems} total)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchAll(allPagination.currentPage - 1, allFilter)}
                                            disabled={!allPagination.hasPrev || allLoading}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchAll(allPagination.currentPage + 1, allFilter)}
                                            disabled={!allPagination.hasNext || allLoading}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ========== MY REQUESTS TAB ========== */}
                    <TabsContent value="my">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <CardTitle className="text-2xl">My Assigned Requests</CardTitle>
                                    <Select value={myFilter} onValueChange={setMyFilter}>
                                        <SelectTrigger className="w-full sm:w-48 border-2 border-slate-300">
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
                                {/* Desktop Table */}
                                <div className="hidden md:block rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {myLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-12">
                                                        Loading your requests...
                                                    </TableCell>
                                                </TableRow>
                                            ) : myRequests.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                        You have no assigned requests.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                myRequests.map((req) => (
                                                    <TableRow key={req._id}>
                                                        <TableCell>
                                                            <div className="font-medium">{req.user_id?.name}</div>
                                                            <div className="text-sm text-muted-foreground">{req.user_id?.email}</div>
                                                        </TableCell>
                                                        <TableCell className="max-w-xs truncate">{req.description}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={req.status === "picked" ? "default" : "outline"}>
                                                                {req.status === "picked" && <UserCheck className="w-3 h-3 mr-1" />}
                                                                {req.status === "closed" && <CheckCircle className="w-3 h-3 mr-1" />}
                                                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(new Date(req.createdAt), "dd MMM yyyy, hh:mm a")}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {req.status === "picked" && (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            onClick={() => handleClose(req._id)}
                                                                        >
                                                                            <XCircle className="w-4 h-4 mr-1" />
                                                                            Close
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="secondary"
                                                                            className="cursor-pointer"
                                                                            onClick={() => {
                                                                                setSelectedRequestId(req._id);
                                                                                setIsExchangeModalOpen(true);
                                                                            }}
                                                                        >
                                                                            Pass Request
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {req.status === "picked" && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleNavigateToChat(req.user_id?._id)}
                                                                    >
                                                                        <MessageCircle className="w-4 h-4 mr-1" />
                                                                        Chat
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {myLoading ? (
                                        <p className="text-center py-12 text-muted-foreground">Loading...</p>
                                    ) : myRequests.length === 0 ? (
                                        <p className="text-center py-12 text-muted-foreground">No assigned requests.</p>
                                    ) : (
                                        myRequests.map((req) => <MyRequestCard key={req._id} req={req} />)
                                    )}
                                </div>

                                {/* Pagination */}
                                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {myPagination.currentPage} of {myPagination.totalPages} ({myPagination.totalItems} total)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchMy(myPagination.currentPage - 1, myFilter)}
                                            disabled={!myPagination.hasPrev || myLoading}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchMy(myPagination.currentPage + 1, myFilter)}
                                            disabled={!myPagination.hasNext || myLoading}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Exchange / Pass Request Modal */}
            <Dialog open={isExchangeModalOpen} onOpenChange={setIsExchangeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pass Request to Another Admin</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Select onValueChange={setSelectedAdminId} value={selectedAdminId}>
                            <SelectTrigger className="border-2 border-slate-300">
                                <SelectValue placeholder="Select an admin" />
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
                        <Button variant="outline" onClick={() => setIsExchangeModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExchange}>Confirm Pass</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
