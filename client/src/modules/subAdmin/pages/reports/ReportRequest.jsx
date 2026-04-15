// src/pages/admin/Reports.jsx
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
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MessageCircle,
    UserCheck,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import showToast from "@/toast/showToast";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import ImageGallery from "./ImageGallery";
import { Image } from "lucide-react"
import ChatModal from "@/modules/admin/pages/chat/components/model/ChatModel";
import { io } from "socket.io-client";


export default function Reports() {
    const navigate = useNavigate();
    const { isSidebarOpen } = useSidebar();
    const { user } = useContext(AuthContext);
    const { setSelectedUser } = useSelectedUser();

    const adminId = user?.user?._id;

    // All Reports State
    const [allReports, setAllReports] = useState([]);
    const [allLoading, setAllLoading] = useState(true);
    const [allPagination, setAllPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
    });
    const [allFilter, setAllFilter] = useState("all");

    // My Reports State
    const [myReports, setMyReports] = useState([]);
    const [myLoading, setMyLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [myPagination, setMyPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
    });
    const [chatModal, setChatModal] = useState({
        open: false,
        senderId: null,
        receiverId: null,
        senderName: "",
        receiverName: "",
    });
    const [myFilter, setMyFilter] = useState("all");

    // Fetch All Reports
    const fetchAll = async (page = 1, status = "all") => {
        setAllLoading(true);
        try {
            const params = { page, limit: 10 };
            if (status !== "all") params.status = status;

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/report-file/all`, { params });
            setAllReports(res.data.reports || []);

            setAllPagination(res.data.pagination || {});
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to load reports", "error");
        } finally {
            setAllLoading(false);
        }
    };

    const handleOpenChat = (report) => {
        setChatModal({
            open: true,
            senderId: report.sender_user_id._id,
            receiverId: report.receiver_user_id._id,
            senderName: report.sender_user_id.name,
            receiverName: report.receiver_user_id.name,
        });
    };
    // Fetch My Reports
    const fetchMy = async (page = 1, status = "all") => {
        if (!adminId) return;
        setMyLoading(true);
        try {
            const params = { admin_id: adminId, page, limit: 10 };
            if (status !== "all") params.status = status;

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/report-file/my-reports`, { params });
            setMyReports(res.data.reports || []);
            setMyPagination(res.data.pagination || {});
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to load your reports", "error");
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

    useEffect(() => {
        const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/admin-notifications`, {
            reconnection: true,
            withCredentials: true,
        });

        socket.on('connect', () => {
            console.log('[Report Requests] Socket connected');
        });

        socket.on('newReport', () => {
            console.log('[Report Requests] New report event received, refreshing...');
            fetchAll(allPagination.currentPage, allFilter);
            fetchMy(myPagination.currentPage, myFilter);
        });

        return () => {
            socket.disconnect();
        };
    }, [allPagination.currentPage, allFilter, myPagination.currentPage, myFilter]);

    const handlePick = async (id) => {
        if (!adminId) return showToast("Login required", "error");
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/report-file/pick/${id}`, { admin_id: adminId });
            showToast("Report picked successfully!", "success");
            fetchAll(allPagination.currentPage, allFilter);
            fetchMy(myPagination.currentPage, myFilter);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to pick report", "error");
        }
    };

    const handleClose = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/report-file/close/${id}`, { admin_id: adminId });
            showToast("Report closed successfully!", "success");
            fetchMy(myPagination.currentPage, myFilter);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to close report", "error");
        }
    };

    const handleChat = (userId) => {
        setSelectedUser({ _id: userId });
        navigate("/admin-dashboard/chat");
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "pending":
                return { variant: "secondary", icon: <Clock className="w-3 h-3 mr-1" /> };
            case "picked":
                return { variant: "default", icon: <UserCheck className="w-3 h-3 mr-1" /> };
            case "closed":
                return { variant: "outline", icon: <CheckCircle className="w-3 h-3 mr-1" /> };
            default:
                return { variant: "secondary", icon: null };
        }
    };

    const handleToggle = async (selectedUserId) => {
        setLoading(true);

        try {
            const token = sessionStorage.getItem("token");

            const res = await axios.patch(
                `${import.meta.env.VITE_API_URL}/users/toggle-status/${selectedUserId}`,
                {},
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            showToast(res.data.message, 'success');
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"} transition-all duration-300`}>
            <div className="container mx-auto py-10 px-4">
                <h1 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-red-700">
                    <AlertTriangle className="w-9 h-9" />
                    User Reports Management
                </h1>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-10">
                        <TabsTrigger value="all">All Reports</TabsTrigger>
                        <TabsTrigger value="my">My Reports</TabsTrigger>
                    </TabsList>

                    {/* ==================== ALL REPORTS TAB ==================== */}
                    <TabsContent value="all">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <CardTitle className="text-2xl">All User Reports</CardTitle>
                                    <Select value={allFilter} onValueChange={setAllFilter}>
                                        <SelectTrigger className="w-full sm:w-48">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Reports</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="picked">Picked</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>

                                {/* ==================== DESKTOP TABLE VIEW ==================== */}
                                <div className="hidden md:block rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Reporter → Reported</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Attachments</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Picked By</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-12">Loading reports...</TableCell>
                                                </TableRow>
                                            ) : allReports.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                                        No reports found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                allReports.map((r) => (
                                                    <TableRow key={r._id}>
                                                        <TableCell>
                                                            <div className="text-sm">
                                                                <div className="font-medium flex items-center gap-2">
                                                                    {r.sender_user_id?.name || "Unknown"}
                                                                    {r.markAsRead === false && (
                                                                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                                                                            New
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-muted-foreground">
                                                                    → {r.receiver_user_id?.name || "Unknown"}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-md truncate">{r.description}</TableCell>
                                                        <TableCell>
                                                            {r.attachments?.length > 0 ? (
                                                                <Badge variant="secondary">
                                                                    {r.attachments.length} file{r.attachments.length > 1 ? "s" : ""}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs">No files</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={getStatusBadge(r.status).variant}>
                                                                {getStatusBadge(r.status).icon}
                                                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {r.picked_by ? (
                                                                <span className="font-medium">{r.picked_by.name}</span>
                                                            ) : (
                                                                <i className="text-muted-foreground">Not picked</i>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{format(new Date(r.createdAt), "dd MMM yyyy, hh:mm a")}</TableCell>
                                                        <TableCell className="text-right">
                                                            {r.status === "pending" && (
                                                                <Button size="sm" onClick={() => handlePick(r._id)}>
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

                                {/* ==================== MOBILE CARD VIEW ==================== */}
                                <div className="md:hidden space-y-4">
                                    {allLoading ? (
                                        <p className="text-center py-12 text-muted-foreground">Loading reports...</p>
                                    ) : allReports.length === 0 ? (
                                        <p className="text-center py-12 text-muted-foreground">No reports found.</p>
                                    ) : (
                                        allReports.map((r) => (
                                            <Card key={r._id} className="hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold text-lg">
                                                                {r.sender_user_id?.name || "Unknown"}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Reported → {r.receiver_user_id?.name || "Unknown"}
                                                            </p>
                                                        </div>
                                                        <Badge variant={getStatusBadge(r.status).variant}>
                                                            {getStatusBadge(r.status).icon}
                                                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">{r.description}</p>

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {r.attachments?.length > 0 ? (
                                                            <Badge variant="secondary">
                                                                {r.attachments.length} attachment{r.attachments.length > 1 ? "s" : ""}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">No attachments</span>
                                                        )}
                                                        {r.picked_by && (
                                                            <div className="text-sm">
                                                                <span className="text-muted-foreground">Picked by: </span>
                                                                <span className="font-medium">{r.picked_by.name}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-muted-foreground mb-4">
                                                        {format(new Date(r.createdAt), "dd MMM yyyy, hh:mm a")}
                                                    </div>

                                                    <div className="flex justify-end">
                                                        {r.status === "pending" && (
                                                            <Button size="sm" onClick={() => handlePick(r._id)}>
                                                                <UserCheck className="w-4 h-4 mr-1" />
                                                                Pick
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>

                                {/* ==================== PAGINATION (Shared) ==================== */}
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
                    {/* ==================== MY REPORTS TAB ==================== */}
                    <TabsContent value="my">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <CardTitle className="text-2xl">My Assigned Reports</CardTitle>
                                    <Select value={myFilter} onValueChange={setMyFilter}>
                                        <SelectTrigger className="w-full sm:w-48">
                                            <SelectValue placeholder="Filter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All My Reports</SelectItem>
                                            <SelectItem value="picked">Picked</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>

                                {/* ==================== DESKTOP TABLE VIEW ==================== */}
                                <div className="hidden md:block rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Reporter → Reported</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Attachments</TableHead>
                                                <TableHead>View Images</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {myLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-12">Loading your reports...</TableCell>
                                                </TableRow>
                                            ) : myReports.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                                        You have no assigned reports.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                myReports.map((r) => (
                                                    <TableRow key={r._id}>
                                                        <TableCell>
                                                            <div className="text-sm">
                                                                <div className="font-medium">{r.sender_user_id?.name}</div>
                                                                <div className="text-muted-foreground">
                                                                    → {r.receiver_user_id?.name}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-md truncate">{r.description}</TableCell>
                                                        <TableCell>
                                                            {r.attachments?.length > 0 ? (
                                                                <Badge variant="secondary">
                                                                    {r.attachments.length} file{r.attachments.length > 1 ? "s" : ""}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {r.attachments?.length > 0 ? (
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="cursor-pointer hover:bg-secondary/80 transition-colors"
                                                                        >
                                                                            <Image className="w-4 h-4 mr-1" />
                                                                            {r.attachments.length} image{r.attachments.length > 1 ? "s" : ""}
                                                                        </Badge>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="max-w-5xl p-0 bg-black border-0">
                                                                        <ImageGallery attachments={r.attachments} reportId={r._id} />
                                                                    </DialogContent>
                                                                </Dialog>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={getStatusBadge(r.status).variant}>
                                                                {getStatusBadge(r.status).icon}
                                                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{format(new Date(r.createdAt), "dd MMM yyyy, hh:mm a")}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {r.status === "picked" && (
                                                                    <Button size="sm" variant="destructive" onClick={() => handleClose(r._id)}>
                                                                        <XCircle className="w-4 h-4 mr-1" />
                                                                        Close
                                                                    </Button>
                                                                )}
                                                                <Button size="sm" variant="outline" onClick={() => handleOpenChat(r)}>
                                                                    <MessageCircle className="w-4 h-4 mr-1" />
                                                                    View Chat
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => handleToggle(r?.reported_user_id)}>
                                                                    <MessageCircle className="w-4 h-4 mr-1" />
                                                                    Report
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* ==================== MOBILE CARD VIEW ==================== */}
                                <div className="md:hidden space-y-4">
                                    {myLoading ? (
                                        <p className="text-center py-12 text-muted-foreground">Loading your reports...</p>
                                    ) : myReports.length === 0 ? (
                                        <p className="text-center py-12 text-muted-foreground">You have no assigned reports.</p>
                                    ) : (
                                        myReports.map((r) => (
                                            <Card key={r._id} className="hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold text-lg">
                                                                {r.sender_user_id?.name || "Unknown"}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Reported → {r.receiver_user_id?.name || "Unknown"}
                                                            </p>
                                                        </div>
                                                        <Badge variant={getStatusBadge(r.status).variant}>
                                                            {getStatusBadge(r.status).icon}
                                                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">{r.description}</p>

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {r.attachments?.length > 0 ? (
                                                            <>
                                                                <Badge variant="secondary">
                                                                    {r.attachments.length} attachment{r.attachments.length > 1 ? "s" : ""}
                                                                </Badge>
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Button size="sm" variant="secondary">
                                                                            <Image className="w-4 h-4 mr-1" />
                                                                            View Images
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="max-w-5xl p-0 bg-black border-0">
                                                                        <ImageGallery attachments={r.attachments} reportId={r._id} />
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">No attachments</span>
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-muted-foreground mb-4">
                                                        {format(new Date(r.createdAt), "dd MMM yyyy, hh:mm a")}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {r.status === "picked" && (
                                                            <Button size="sm" variant="destructive" onClick={() => handleClose(r._id)}>
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                Close
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="outline" onClick={() => handleOpenChat(r)}>
                                                            <MessageCircle className="w-4 h-4 mr-1" />
                                                            View Chat
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => handleToggle(r?.reported_user_id)}>
                                                            <MessageCircle className="w-4 h-4 mr-1" />
                                                            Report
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>

                                {/* ==================== PAGINATION (Shared) ==================== */}
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
            <ChatModal
                open={chatModal.open}
                onOpenChange={(open) => setChatModal({ ...chatModal, open })}
                senderId={chatModal.senderId}
                receiverId={chatModal.receiverId}
                senderName={chatModal.senderName}
                receiverName={chatModal.receiverName}
            />
        </div>
    );
}
