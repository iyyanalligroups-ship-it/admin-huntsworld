// Updated Component: TrustSealRequestsPage.jsx

import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import {
  useGetTrustSealRequestsQuery,
  useUpdateTrustSealRequestStatusMutation,
  useAssignTrustSealRequestMutation,
  useReassignTrustSealRequestMutation,
  useUnassignTrustSealRequestMutation,
  useMarkTrustSealNotificationAsReadMutation,
} from "@/redux/api/TrustSealRequestApi";
import {
  useGetPaymentAccountsByUserQuery,
  useRecordStudentPaymentMutation,
  useGetStudentPaymentHistoryQuery,
} from "@/redux/api/PaymentAccountApi";
import { useGetStudentsQuery } from "@/redux/api/Studentapi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
import showToast from "@/toast/showToast";
import { useSidebar } from "../../../hooks/useSidebar";
import { Eye, Info, CheckCircle, AlertTriangle, XCircle, UserPlus, Badge, Pencil, UserMinus, RotateCcw, Wallet, Landmark, QrCode, ArrowRightCircle, History, User, Mail, Phone, Shield, Building2, MapPin, CreditCard, Calendar, Clock, ShieldCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Import AuthContext
import { AuthContext } from "@/modules/landing/context/AuthContext";  // ← Adjust this path if your AuthContext is in a different folder
import DeleteTrustSealRequestButton from "./DeleteTrustSealRequestButton";

const TrustSealRequestsPage = () => {
  const { requestId } = useParams();
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { isSidebarOpen } = useSidebar();

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [notes, setNotes] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isSOPOpen, setIsSOPOpen] = useState(false);

  // ── States for Assign dialog ──
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isReassignMode, setIsReassignMode] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [selectedAssignUser, setSelectedAssignUser] = useState("");

  // ── States for Student Payment ──
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [selectedStudentForPay, setSelectedStudentForPay] = useState(null);

  // Get logged-in user from context
  const { user } = useContext(AuthContext);

  const getDateRange = (option) => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localNow = new Date(now.getTime() - offset);

    let start, end;

    switch (option) {
      case "today":
        start = new Date(localNow.setHours(0, 0, 0, 0));
        end = new Date(localNow.setHours(23, 59, 59, 999));
        break;
      case "yesterday":
        start = new Date(localNow);
        end = new Date(localNow);
        start.setDate(localNow.getDate() - 1);
        end.setDate(localNow.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        const day = localNow.getDay();
        const diff = localNow.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(localNow);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end = new Date(localNow);
        end.setHours(23, 59, 59, 999);
        break;
      case "month":
        start = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
        end = new Date(
          localNow.getFullYear(),
          localNow.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        break;
      default:
        return null;
    }

    return { start: start.toISOString(), end: end.toISOString() };
  };

  const dateRange = dateFilter !== "all" ? getDateRange(dateFilter) : null;

  const { data, isLoading, isError, error, refetch } =
    useGetTrustSealRequestsQuery({
      page,
      limit: itemsPerPage,
      status: statusFilter !== "all" ? statusFilter : undefined,
      startDate: dateRange?.start,
      endDate: dateRange?.end,
    });

  const [updateTrustSealRequestStatus] =
    useUpdateTrustSealRequestStatusMutation();

  const [assignTrustSealRequest] = useAssignTrustSealRequestMutation();
  const [reassignTrustSealRequest] = useReassignTrustSealRequestMutation();
  const [unassignTrustSealRequest] = useUnassignTrustSealRequestMutation();

  const [markTrustSealAsRead] = useMarkTrustSealNotificationAsReadMutation();

  // ── Student Payment Hooks ──
  const [recordPayment, { isLoading: isPaying }] = useRecordStudentPaymentMutation();
  const { data: paymentHistory, isLoading: isHistoryLoading, refetch: refetchHistory } = useGetStudentPaymentHistoryQuery();
    console.log("paymentHistory", paymentHistory);
  // Fetch student bank accounts when modal is open
  const { data: studentBankAccounts, isLoading: isBankLoading } = useGetPaymentAccountsByUserQuery(
    selectedStudentForPay?.picked_by?._id,
    { skip: !isPayModalOpen || !selectedStudentForPay?.picked_by?._id }
  );

  const activeAccount = studentBankAccounts?.data?.find(acc => acc.is_active);

  // Fetch students for assign dropdown
  const { data: studentsData, isLoading: isStudentsLoading } = useGetStudentsQuery();
    console.log("studentsData", studentsData);
  
  const handleRecordPayment = async () => {
    if (!paymentAmount || !transactionId) {
      showToast("Amount and Transaction ID are required", "warning");
      return;
    }

    try {
      await recordPayment({
        student_id: selectedStudentForPay.picked_by?._id,
        request_id: selectedStudentForPay._id,
        amount: parseFloat(paymentAmount),
        transaction_id: transactionId,
        payment_method: activeAccount?.payment_method === "BANK" ? "BANK" : "UPI",
        notes: paymentNotes,
      }).unwrap();

      showToast("Payment recorded successfully", "success");
      setIsPayModalOpen(false);
      setPaymentAmount("");
      setTransactionId("");
      setPaymentNotes("");
      refetch();
      refetchHistory();
    } catch (err) {
      showToast(err?.data?.message || "Failed to record payment", "error");
    }
  };

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (isError) {
      console.error(error);
      showToast("Failed to load trust seal requests", "error");
    }

    if (requestId && data?.data) {
      const found = data.data.find((r) => r._id === requestId);
      if (found) {
        setSelectedRequest(found);
        setIsDialogOpen(true);
      }
    }
  }, [requestId, data, isError, error]);

  const handleStatusUpdate = async (status) => {
    try {
      await updateTrustSealRequestStatus({
        request_id: selectedRequest._id,
        status,
        notes,
      }).unwrap();

      showToast(`Request ${status}`, "success");
      setIsDialogOpen(false);
      setNotes("");
      refetch();
    } catch (err) {
      showToast("Failed to update request", "error");
    }
  };

  const handleMarkAsRead = async (requestId) => {
    try {
      await markTrustSealAsRead({ requestId }).unwrap();
      showToast("Marked as read", "success");
      refetch();
    } catch (err) {
      showToast("Failed to mark as read", "error");
    }
  };

  // ── Assign handler ──
  const handleAssign = async () => {
    if (!selectedAssignUser) {
      showToast("Please select a team member", "warning");
      return;
    }

    // Safely extract admin ID — matches the logged structure
    const currentUserId = user?.user?._id;

    if (!currentUserId) {
      showToast("Cannot determine current admin ID. Please log in again.", "error");
      console.warn("User object is missing _id:", user);
      return;
    }

    // Optional: defensive log (remove after testing)
    console.log("Assigning request with payload:", {
      request_id: selectedRequest._id,
      student_id: selectedAssignUser,
      assigned_by: currentUserId,
      adminName: user.name || "Unknown",
    });

    try {
      if (isReassignMode) {
        await reassignTrustSealRequest({
          request_id: selectedRequest._id,
          student_id: selectedAssignUser,
          assigned_by: currentUserId,
        }).unwrap();
        showToast("Request reassigned successfully", "success");
      } else {
        await assignTrustSealRequest({
          request_id: selectedRequest._id,
          student_id: selectedAssignUser,
          assigned_by: currentUserId,
        }).unwrap();
        showToast("Request assigned successfully", "success");
      }

      setIsAssignDialogOpen(false);
      setSelectedAssignUser("");
      setIsReassignMode(false);
      refetch();
    } catch (err) {
      // Improved error display — backend often sends good messages
      const errorMessage =
        err?.data?.message ||
        err?.error?.message ||
        err?.message ||
        "Failed to assign request. Please try again.";

      showToast(errorMessage, "error");
      console.error("Assign error details:", err);
    }
  };

  const handleUnassign = async () => {
    if (!selectedRequest?._id) return;

    try {
      await unassignTrustSealRequest(selectedRequest._id).unwrap();
      showToast("Assignment removed successfully", "success");
      setIsUnassignDialogOpen(false);
      refetch();
    } catch (err) {
      showToast(err?.data?.message || "Failed to remove assignment", "error");
    }
  };

  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentItems = data?.data || [];

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const getPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 3;

    items.push(
      <PaginationItem key={1}>
        <PaginationLink onClick={() => handlePageChange(1)} isActive={page === 1}>
          1
        </PaginationLink>
      </PaginationItem>
    );

    if (page > maxPagesToShow) {
      items.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (page < totalPages - maxPagesToShow + 1) {
      items.push(
        <PaginationItem key="end-ellipsis">
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
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  useEffect(() => {
    setPage(1); // Reset to page 1 when filter changes
  }, [statusFilter, dateFilter]);

  if (isLoading) {
    return (
      <div className="p-4">
        {isMobile ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex-1 lg:p-4 transition-all duration-300 ${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"
        }`}
    >
      <h2 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
        Trust Seal Requests
      </h2>
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="text-[#0c1f4d] cursor-pointer border-[#0c1f4d] gap-2"
          onClick={() => setIsSOPOpen(true)}
        >
          <Info className="w-4 h-4" />
          View Review SOP
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block">
        <Table className="min-w-full border border-gray-200 rounded-lg shadow-sm">
          <TableHeader className="bg-[#0c1f4d]">
            <TableRow>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Merchant
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Amount
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Created At
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Picked By
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((request) => (
                <TableRow
                  key={request._id}
                  className={`border-b hover:bg-gray-100 transition-colors ${request._id === requestId ? "bg-yellow-100" : ""
                    }`}
                >
                  <TableCell className="px-4 py-3 font-medium text-gray-800 truncate max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span>{request.user_id?.name || "Unknown"}</span>
                      {request.isRead === false && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-[10px] px-1.5 py-0 h-4 uppercase">New</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700">
                    ₹{request.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span
                      className={`
                        inline-block px-3 py-1 rounded-full text-xs font-semibold
                        ${request.status === "verified"
                          ? "bg-green-100 text-green-800"
                          : ""
                        }
                        ${request.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : ""
                        }
                        ${request.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : ""
                        }
                        ${request.status === "student_verified"
                          ? "bg-blue-100 text-blue-800"
                          : ""
                        }
                        ${request.status === "expired"
                          ? "bg-gray-200 text-gray-800"
                          : ""
                        }
                      `}
                    >
                      {request.status.charAt(0).toUpperCase() +
                        request.status.slice(1).replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700">
                    {new Date(request.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-gray-800 truncate max-w-[200px]">
                    {request.picked_by?.name || request.picked_by?.email || "N/A"}
                  </TableCell>
                  <TableCell className="px-4 py-3 flex items-center gap-2">
                    {request.isRead === false && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Mark as Read"
                        onClick={() => handleMarkAsRead(request._id)}
                      >
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                      </Button>
                    )}
                    <Button
                      className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] flex items-center gap-2 text-sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </Button>

                    {/* Pay to Student Button */}
                    {request.status === "student_verified" && (
                      request.is_student_paid ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 font-bold text-xs">
                          <CheckCircle className="w-4 h-4" />
                          PAID
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 text-sm"
                          onClick={() => {
                            setSelectedStudentForPay(request);
                            setPaymentAmount(request.amount || ""); // Default to request amount
                            setIsPayModalOpen(true);
                          }}
                        >
                          <Wallet className="w-4 h-4" />
                          Pay
                        </Button>
                      )
                    )}

                    {/* ── Conditional Assign/Reassign/Unassign Buttons ── */}
                    {request.picked_by_name === 'N/A' && request.status === 'pending' ? (
                      <Button
                        variant="outline"
                        className="border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white flex items-center gap-2 text-sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsReassignMode(false);
                          setIsAssignDialogOpen(true);
                        }}
                      >
                        <UserPlus className="w-4 h-4" />
                        Assign To
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-blue-500 text-blue-500 hover:bg-blue-50"
                          title="Reassign"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsReassignMode(true);
                            setIsAssignDialogOpen(true);
                            if (request.picked_by?._id) {
                              setSelectedAssignUser(request.picked_by._id);
                            }
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-orange-500 text-orange-500 hover:bg-orange-50"
                          title="Unassign"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsUnassignDialogOpen(true);
                          }}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="border-green-500 text-green-500 cursor-default px-2 h-9"
                          disabled
                        >
                          Assigned
                        </Button>
                      </div>
                    )}
                    <DeleteTrustSealRequestButton
                      requestId={request._id}
                      onDeleteSuccess={() => {
                        // refresh your list here
                        refetch();           // or mutate swr / react-query / set state
                        // or invalidate queries if using tanstack query
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-500 py-4"
                >
                  No trust seal requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {currentItems.length > 0 ? (
          currentItems.map((request) => (
            <div
              key={request._id}
              className={`border rounded-lg p-4 shadow-sm bg-white ${request._id === requestId ? "bg-yellow-50" : ""
                }`}
            >
              <p className="font-semibold flex items-center gap-2">
                Merchant:{" "}
                <span className="font-normal">
                  {request.user_id?.name || "Unknown"}
                </span>
                {request.isRead === false && (
                  <Badge className="bg-red-500 hover:bg-red-600 text-[10px] px-1.5 py-0 h-4 uppercase border-0">New</Badge>
                )}
              </p>
              <p>
                Amount:{" "}
                <span className="font-normal">
                  ₹{request.amount.toFixed(2)}
                </span>
              </p>
              <p>
                Status:{" "}
                <span
                  className={`
                    inline-block px-2 py-1 rounded-full text-xs font-semibold
                    ${request.status === "verified"
                      ? "bg-green-100 text-green-800"
                      : ""
                    }
                    ${request.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : ""
                    }
                    ${request.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : ""
                    }
                    ${request.status === "student_verified"
                      ? "bg-blue-100 text-blue-800"
                      : ""
                    }
                    ${request.status === "expired"
                      ? "bg-gray-200 text-gray-800"
                      : ""
                    }
                  `}
                >
                  {request.status.charAt(0).toUpperCase() +
                    request.status.slice(1).replace("_", " ")}
                </span>
              </p>
              <p>
                Created At:{" "}
                <span className="font-normal">
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
              </p>
              <p>
                Picked By:{" "}
                <span className="font-normal">
                  {request.picked_by?.name || request.picked_by?.email || "N/A"}
                </span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {request.isRead === false && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 text-sm text-gray-500"
                    onClick={() => handleMarkAsRead(request._id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Read
                  </Button>
                )}
                <Button
                  className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] flex items-center gap-2 text-sm"
                  onClick={() => {
                    setSelectedRequest(request);
                    setIsDialogOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Review
                </Button>

                {request.status === "student_verified" && (
                  request.is_student_paid ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200 font-bold text-xs w-fit">
                      <CheckCircle className="w-4 h-4" />
                      PAID
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 text-sm"
                      onClick={() => {
                        setSelectedStudentForPay(request);
                        setPaymentAmount(request.amount || "");
                        setIsPayModalOpen(true);
                      }}
                    >
                      <Wallet className="w-4 h-4" />
                      Pay
                    </Button>
                  )
                )}

                {/* ── Conditional Assign/Reassign/Unassign Buttons (mobile) ── */}
                {request.picked_by_name === 'N/A' && request.status === 'pending' ? (
                  <Button
                    variant="outline"
                    className="border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white flex items-center gap-2 text-sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setIsReassignMode(false);
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="border-blue-500 text-blue-500 hover:bg-blue-50 h-9 px-3"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsReassignMode(true);
                        setIsAssignDialogOpen(true);
                        if (request.picked_by?._id) {
                          setSelectedAssignUser(request.picked_by._id);
                        }
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="border-orange-500 text-orange-500 hover:bg-orange-50 h-9 px-3"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsUnassignDialogOpen(true);
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No trust seal requests found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <Pagination className="mt-4 flex justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={
                  page === 1
                    ? "pointer-events-none opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }
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
                className={
                  page === totalPages
                    ? "pointer-events-none opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-[#0c1f4d]">
              <Shield className="w-6 h-6 text-blue-600" />
              Review Trust Seal Request
            </DialogTitle>
            <DialogDescription>
              Review the detailed merchant profile and verification documents below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Personal Details Section */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Merchant Name</p>
                    <p className="font-semibold text-sm">{selectedRequest?.user_id?.name || "Unknown"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">User Role</p>
                    <p className="font-semibold text-sm text-purple-700">{selectedRequest?.roleName || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email Address</p>
                    <p className="font-semibold text-sm truncate max-w-[180px]">{selectedRequest?.personal_email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <p className="font-semibold text-sm">{selectedRequest?.personal_phone || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Details Section */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Business Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Company Name</p>
                    <p className="font-bold text-md text-[#0c1f4d]">
                      {selectedRequest?.seller_company_details?.company_name || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">GST Number</p>
                      <p className="font-semibold text-sm uppercase">{selectedRequest?.seller_company_details?.gst_number || "NOT UPDATED"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Company Email</p>
                      <p className="font-semibold text-sm truncate max-w-[150px]">{selectedRequest?.seller_company_details?.company_email || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Business Address</p>
                    <p className="font-medium text-sm">
                      {selectedRequest?.seller_address?.address_line_1 ? (
                        <>
                          {selectedRequest.seller_address.address_line_1},{" "}
                          {selectedRequest.seller_address.city},{" "}
                          {selectedRequest.seller_address.state} -{" "}
                          {selectedRequest.seller_address.pincode}
                        </>
                      ) : (
                        "Address not updated"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Info Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" /> Request Info
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="font-bold text-lg text-green-600">₹{selectedRequest?.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Status</p>
                  <div className="mt-1">
                    {(() => {
                      const status = selectedRequest?.status;
                      switch (status) {
                        case "verified":
                          return (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                              <CheckCircle className="w-3.5 h-3.5" /> VERIFIED
                            </span>
                          );
                        case "pending":
                          return (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                              <Clock className="w-3.5 h-3.5" /> PENDING
                            </span>
                          );
                        case "rejected":
                          return (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                              <XCircle className="w-3.5 h-3.5" /> REJECTED
                            </span>
                          );
                        case "student_verified":
                          return (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                              <ShieldCheck className="w-3.5 h-3.5" /> STUDENT VERIFIED
                            </span>
                          );
                        case "in_process":
                          return (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> IN PROCESS
                            </span>
                          );
                        case "expired":
                          return (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                              <AlertTriangle className="w-3.5 h-3.5" /> EXPIRED
                            </span>
                          );
                        default:
                          return <Badge className="capitalize">{status?.replace("_", " ")}</Badge>;
                      }
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Creation Date</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    {selectedRequest?.created_at ? new Date(selectedRequest.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Assigned To</p>
                  <p className="font-medium text-sm truncate">
                    {selectedRequest?.picked_by?.name || selectedRequest?.picked_by?.email || "Unassigned"}
                  </p>
                </div>
              </div>

              {selectedRequest?.images?.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    className="w-full bg-[#0c1f4d] hover:bg-[#0c1f4dcc] flex items-center justify-center gap-2"
                    onClick={() => setIsImageModalOpen(true)}
                  >
                    <Eye className="w-4 h-4" />
                    View Verification Images ({selectedRequest.images.length})
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Verification Notes</label>
              <Input
                placeholder="Enter remarks or grounds for approval/rejection..."
                className="bg-white"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            {selectedRequest?.status !== "verified" && (
              <Button
                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none flex items-center gap-2"
                onClick={() => handleStatusUpdate("verified")}
              >
                <CheckCircle className="w-4 h-4" /> Verify & Approve
              </Button>
            )}
            <Button
              className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none flex items-center gap-2"
              onClick={() => handleStatusUpdate("rejected")}
            >
              <XCircle className="w-4 h-4" /> Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Trust Seal Images</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 h-[400px] w-full overflow-x-auto">
            {selectedRequest?.images?.map((image, index) => (
              <div
                key={image._id}
                className="relative group flex-shrink-0 transition-all w-56 rounded-lg overflow-hidden h-[400px] duration-500 hover:w-full"
              >
                <img
                  className="h-full w-full object-cover object-center"
                  src={image.url}
                  alt={`Trust seal image ${index + 1}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImageModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Dialog ── */}
      <Dialog open={isAssignDialogOpen} onOpenChange={(open) => {
        setIsAssignDialogOpen(open);
        if(!open) setIsReassignMode(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isReassignMode ? "Reassign" : "Assign"} Trust Seal Request</DialogTitle>
            <DialogDescription>
              {isReassignMode ? "Change the team member assigned to this verification request." : "Choose a team member to handle this verification request."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <p className="text-sm">
              <strong>Merchant:</strong> {selectedRequest?.user_id?.name || "Unknown"}
            </p>
            <p className="text-sm">
              <strong>Amount:</strong> ₹{selectedRequest?.amount?.toFixed(2) || "—"}
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assign to</label>
              <Select
                value={selectedAssignUser}
                onValueChange={setSelectedAssignUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {isStudentsLoading ? (
                    <SelectItem disabled>Loading students...</SelectItem>
                  ) : studentsData?.length > 0 ? (
                    studentsData.map((student) => (
                      <SelectItem
                        key={student._id}
                        value={student.user_id}   // ← assuming this is the correct student identifier
                      >
                        {student.name || "Student"} ({student.college_name || "No college"})
                        {student.address ? ` - ${student.address.city || "N/A"}, ${student.address.pincode || "N/A"}` : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled>No students available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc]"
              onClick={handleAssign}
              disabled={!selectedAssignUser || isStudentsLoading}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SOP Dialog */}
      <Dialog open={isSOPOpen} onOpenChange={setIsSOPOpen}>
        <DialogContent className="p-4 overflow-y-auto overflow-x-hidden bg-white rounded-xl shadow-2xl"
          style={{ width: "80vw", maxWidth: "80vw", height: "80vh", maxHeight: "80vh" }}>
          <DialogHeader>
            <DialogTitle className="text-[#0c1f4d] text-xl border-b pb-2">
              SOP: Trust Seal Verification Process
            </DialogTitle>
            <DialogDescription>
              Follow this strict workflow to Approve or Reject merchant requests.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 text-sm text-gray-700 mt-2">

            {/* Step 1 */}
            <section className="space-y-2">
              <h3 className="font-bold text-[#0c1f4d] flex items-center gap-2">
                <span className="bg-[#0c1f4d] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                Review Details
              </h3>
              <ul className="list-disc pl-10 space-y-1">
                <li>Check the Merchant Name and Amount in the table.</li>
                <li>Click the <span className="inline-flex items-center bg-gray-100 px-2 py-0.5 rounded text-xs font-bold"><Eye className="w-3 h-3 mr-1" /> Review</span> button to open the <strong>Review Popup Model</strong>.</li>
              </ul>
            </section>

            {/* Step 2 */}
            <section className="space-y-2">
              <h3 className="font-bold text-[#0c1f4d] flex items-center gap-2">
                <span className="bg-[#0c1f4d] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                Check Company Images
              </h3>
              <div className="pl-9">
                <p className="mb-2">Inside the popup model:</p>
                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                  <p className="font-semibold text-blue-900">Click "View Verification Images"</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-blue-800">
                    <li>Ensure images are clear (not blurry).</li>
                    <li>Verify the <strong>Shop Board / Business Name</strong> in the photo matches the Merchant Name.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Step 3 */}
            <section className="space-y-2">
              <h3 className="font-bold text-[#0c1f4d] flex items-center gap-2">
                <span className="bg-[#0c1f4d] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
                Final Decision
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9">
                {/* Approval Logic */}
                <div className="border rounded-lg p-3 bg-green-50/50">
                  <h4 className="font-bold text-green-700 flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4" /> To Verify
                  </h4>
                  <p className="text-xs">
                    If images and details match, click the <strong>Verify</strong> button. The Trust Seal will be completed immediately.
                  </p>
                </div>

                {/* Rejection Logic */}
                <div className="border rounded-lg p-3 bg-red-50/50">
                  <h4 className="font-bold text-red-700 flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4" /> To Reject
                  </h4>
                  <p className="text-xs mb-2">
                    Click the <strong>Reject</strong> button if validation fails.
                  </p>
                  <div className="bg-white p-2 rounded border border-red-200 text-red-600 text-xs font-bold flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>Requirement: You MUST type a valid reason for rejection in the notes box.</span>
                  </div>
                </div>
              </div>
            </section>

          </div>

          <DialogFooter>
            <Button onClick={() => setIsSOPOpen(false)} className="bg-[#0c1f4d]">
              Close Guide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── Unassign Confirmation Dialog ── */}
      <AlertDialog open={isUnassignDialogOpen} onOpenChange={setIsUnassignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the current assignment for <strong> {selectedRequest?.user_id?.name || "this merchant"}</strong>? 
              <br />
              This will return the request to <strong>Pending</strong> status and clear the team member entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnassign}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Confirm Unassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* ── Student Payment Modal ── */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600" />
              Pay to Student: {selectedStudentForPay?.picked_by?.name}
            </DialogTitle>
            <DialogDescription>
              Retrieve bank details and record the manual payment transaction.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isBankLoading ? (
              <div className="flex justify-center p-4">
                <Skeleton className="h-20 w-full" />
              </div>
            ) : activeAccount ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
                <div className="flex items-center gap-2 text-green-800 font-bold border-b pb-2">
                  <Landmark className="w-4 h-4" />
                  Payment Destination
                </div>
                
                {activeAccount.payment_method === "BANK" ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Bank Name:</span>
                    <span className="font-medium">{activeAccount.bank_details?.bank_name}</span>
                    <span className="text-gray-500">A/C Holder:</span>
                    <span className="font-medium">{activeAccount.bank_details?.account_holder_name}</span>
                    <span className="text-gray-500">Account No:</span>
                    <span className="font-medium text-blue-700 tracking-wider font-mono">{activeAccount.bank_details?.account_number}</span>
                    <span className="text-gray-500">IFSC Code:</span>
                    <span className="font-medium uppercase">{activeAccount.bank_details?.ifsc_code}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">UPI ID:</span>
                    <span className="font-medium text-blue-700">{activeAccount.upi_id || "N/A"}</span>
                    <span className="text-gray-500">UPI Number:</span>
                    <span className="font-medium">{activeAccount.upi_number || "N/A"}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <span>No active payment account found for this student.</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase px-1">Amount Paid (₹)</label>
                <div className="relative">
                   <Wallet className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                   <Input 
                    type="number" 
                    placeholder="Enter amount" 
                    className="pl-9"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                   />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase px-1">Transaction ID / Reference No</label>
                <div className="relative">
                   <QrCode className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                   <Input 
                    placeholder="e.g. T230400..." 
                    className="pl-9"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                   />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase px-1">Admin Notes (Optional)</label>
                <Input 
                  placeholder="Additional remarks..." 
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleRecordPayment}
              disabled={isPaying || !activeAccount}
            >
              {isPaying ? "Processing..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Student Payment History Table ── */}
      <div className="mt-12 bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#0c1f4d] flex items-center gap-2">
            <History className="w-5 h-5" />
            Student Payment History
          </h3>
          <Button variant="ghost" size="sm" onClick={() => refetchHistory()} className="text-gray-500">
             <RotateCcw className="w-4 h-4 mr-2" />
             Refresh History
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="font-bold text-[#0c1f4d]">Student Name</TableHead>
                <TableHead className="font-bold text-[#0c1f4d]">Amount</TableHead>
                <TableHead className="font-bold text-[#0c1f4d]">Transaction ID</TableHead>
                <TableHead className="font-bold text-[#0c1f4d]">Method</TableHead>
                <TableHead className="font-bold text-[#0c1f4d]">Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isHistoryLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-4"><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : paymentHistory?.data?.length > 0 ? (
                paymentHistory.data.map((pay) => (
                  <TableRow key={pay._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                         <div className="bg-gray-100 p-2 rounded-full">
                            <User className="w-4 h-4 text-[#0c1f4d]" />
                         </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{pay.student_id?.name || pay.student_id?.email || "N/A"}</span>
                          {pay.student_id?.name && (
                            <span className="text-xs text-gray-500">{pay.student_id?.email}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-green-700 text-md">₹{pay.amount?.toFixed(2)}</TableCell>
                    <TableCell>
                       <code className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-mono border border-blue-100">{pay.transaction_id}</code>
                    </TableCell>
                    <TableCell>
                       <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit text-xs font-bold shadow-sm ${
                          pay.payment_method === "BANK" 
                          ? "bg-indigo-50 border-indigo-100 text-indigo-700" 
                          : "bg-purple-50 border-purple-100 text-purple-700"
                       }`}>
                         {pay.payment_method === "BANK" ? <Landmark className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                         <span className="tracking-wide uppercase">{pay.payment_method}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {new Date(pay.paid_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-400 italic">
                    <div className="flex flex-col items-center gap-2">
                       <Wallet className="w-8 h-8 opacity-20" />
                       <p>No payment history found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TrustSealRequestsPage;
