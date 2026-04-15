// Updated Component: TrustSealRequestsPage.jsx

import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import {
  useGetTrustSealRequestsQuery,
  useUpdateTrustSealRequestStatusMutation,
  useAssignTrustSealRequestMutation,
  useMarkTrustSealNotificationAsReadMutation,
} from "@/redux/api/TrustSealRequestApi";
import {
  useGetPaymentAccountsByUserQuery,
  useRecordStudentPaymentMutation,
  useGetStudentPaymentHistoryQuery,
} from "@/redux/api/PaymentAccountApi";
import { useGetStudentsQuery } from "@/redux/api/Studentapi";
import { io } from "socket.io-client";
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
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { Eye, Info, CheckCircle, AlertTriangle, XCircle, UserPlus, Badge, Wallet, Landmark, QrCode, ArrowRightCircle, History, User, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

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

  const [markTrustSealAsRead] = useMarkTrustSealNotificationAsReadMutation();

  // ── Student Payment Hooks ──
  const [recordPayment, { isLoading: isPaying }] = useRecordStudentPaymentMutation();
  const { data: paymentHistory, isLoading: isHistoryLoading, refetch: refetchHistory } = useGetStudentPaymentHistoryQuery();

  // Fetch student bank accounts when modal is open
  const { data: studentBankAccounts, isLoading: isBankLoading } = useGetPaymentAccountsByUserQuery(
    selectedStudentForPay?.picked_by?._id,
    { skip: !isPayModalOpen || !selectedStudentForPay?.picked_by?._id }
  );

  const activeAccount = studentBankAccounts?.data?.find(acc => acc.is_active);

  // Fetch students for assign dropdown
  const { data: studentsData, isLoading: isStudentsLoading } = useGetStudentsQuery();

  const handleRecordPayment = async () => {
    if (!paymentAmount || !transactionId) {
      showToast("Amount and Transaction ID are required", "warning");
      return;
    }

    try {
      await recordPayment({
        student_id: selectedStudentForPay.picked_by._id,
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

    // Real-time notifications
    const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/admin-notifications`, {
      reconnection: true,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Trust Seal Requests] Socket connected');
    });

    socket.on('newTrustSealRequest', () => {
      console.log('[Trust Seal Requests] New request event received, refreshing...');
      refetch();
    });

    return () => {
      window.removeEventListener("resize", resize);
      socket.disconnect();
    };
  }, [refetch]);

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
      await assignTrustSealRequest({
        request_id: selectedRequest._id,
        student_id: selectedAssignUser,
        assigned_by: currentUserId,
      }).unwrap();

      showToast("Request assigned successfully", "success");
      setIsAssignDialogOpen(false);
      setSelectedAssignUser("");
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
                    {request.picked_by?.name || "N/A"}
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

                    {/* ── Conditional Assign Button ── */}
                    {request.picked_by_name === 'N/A' && request.status === 'pending' ? (
                      <Button
                        variant="outline"
                        className="border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white flex items-center gap-2 text-sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsAssignDialogOpen(true);
                        }}
                      >
                        <UserPlus className="w-4 h-4" />
                        Assign To
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="border-green-500 text-green-500 cursor-default"
                        disabled
                      >
                        Assigned
                      </Button>
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
                  {request.picked_by?.name || "N/A"}
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

                {/* ── Conditional Assign Button (mobile) ── */}
                {request.picked_by_name === 'N/A' && request.status === 'pending' ? (
                  <Button
                    variant="outline"
                    className="border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white flex items-center gap-2 text-sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="border-green-500 text-green-500 cursor-default"
                    disabled
                  >
                    Assigned
                  </Button>
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

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Trust Seal Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              <strong>Merchant:</strong>{" "}
              {selectedRequest?.user_id?.name || "Unknown"}
            </p>
            <p>
              <strong>Amount:</strong> ₹{selectedRequest?.amount.toFixed(2)}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {selectedRequest?.status.charAt(0).toUpperCase() +
                selectedRequest?.status.slice(1).replace("_", " ")}
            </p>
            <p>
              <strong>Picked By:</strong>{" "}
              {selectedRequest?.picked_by?.name || "N/A"}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {selectedRequest?.created_at
                ? new Date(selectedRequest.created_at).toLocaleDateString()
                : "N/A"}
            </p>
            {selectedRequest?.images?.length > 0 && (
              <Button
                className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc]"
                onClick={() => setIsImageModalOpen(true)}
              >
                View Images
              </Button>
            )}
            <Input
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleStatusUpdate("verified")}
            >
              Verify
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleStatusUpdate("rejected")}
            >
              Reject
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
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Trust Seal Request</DialogTitle>
            <DialogDescription>
              Choose a team member to handle this verification request.
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
                    <div className="p-2 text-center text-sm">Loading...</div>
                  ) : (
                    studentsData?.students?.map((stu) => (
                      <SelectItem key={stu._id} value={stu._id}>
                        {stu.name} ({stu.designation || "Team Member"})
                      </SelectItem>
                    ))
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
            >
              Assign Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={isSOPOpen} onOpenChange={setIsSOPOpen}>
        <DialogContent className="p-4 overflow-scroll bg-white rounded-xl shadow-2xl"
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

      {/* ── Pay to Student Modal ── */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-[#0c1f4d] border-t-4">
          <DialogHeader className="border-b pb-3 mb-4">
            <DialogTitle className="text-xl font-bold text-[#0c1f4d] flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              Disburse Student Payment
            </DialogTitle>
            <DialogDescription className="text-gray-500 italic">
              Record manual payment details for the verified request.
            </DialogDescription>
          </DialogHeader>

          {isBankLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#0c1f4d]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0c1f4d]"></div>
              <p className="text-sm font-medium animate-pulse">Fetching Student Account Details...</p>
            </div>
          ) : activeAccount ? (
            <div className="space-y-6">
              {/* Account Details Context */}
              <div className="bg-[#0c1f4d] text-white p-4 rounded-xl shadow-inner space-y-3">
                <div className="flex items-center justify-between border-b border-white/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-2 rounded-lg">
                      {activeAccount.payment_method === 'BANK' ? <Landmark className="w-5 h-5 text-white" /> : <QrCode className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-70">Payout Method</p>
                      <p className="font-bold text-sm tracking-wide">{activeAccount.payment_method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider opacity-70">Account Status</p>
                    <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">VERIFIED</span>
                  </div>
                </div>

                {activeAccount.payment_method === 'BANK' ? (
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div className="space-y-1">
                      <p className="opacity-70 text-[9px] uppercase">Account Holder</p>
                      <p className="text-sm">{activeAccount.account_holder_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="opacity-70 text-[9px] uppercase">Account Number</p>
                      <p className="text-sm tracking-widest">{activeAccount.account_number}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="opacity-70 text-[9px] uppercase">Bank Name</p>
                      <p className="text-sm">{activeAccount.bank_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="opacity-70 text-[9px] uppercase">IFSC Code</p>
                      <p className="text-sm tracking-wider uppercase">{activeAccount.ifsc_code}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div className="space-y-1">
                      <p className="opacity-70 text-[9px] uppercase">UPI ID</p>
                      <p className="text-sm">{activeAccount.upi_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="opacity-70 text-[9px] uppercase">Phone Number</p>
                      <p className="text-sm tracking-widest">{activeAccount.phone_number}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Entry Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0c1f4d] uppercase flex items-center gap-1.5">
                      <ArrowRightCircle className="w-3.5 h-3.5" /> Amount (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="500.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="border-[#0c1f4d]/20 focus-visible:ring-[#0c1f4d] font-semibold text-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0c1f4d] uppercase flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" /> Transaction ID
                    </label>
                    <Input
                      placeholder="Ref/TXN-123..."
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="border-[#0c1f4d]/20 focus-visible:ring-[#0c1f4d] font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0c1f4d] uppercase flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Payment Notes
                  </label>
                  <Input
                    placeholder="Add manual payment notes here..."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="border-[#0c1f4d]/20 focus-visible:ring-[#0c1f4d]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="inline-flex items-center justify-center p-4 bg-red-50 rounded-full text-red-500 mb-2">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h4 className="text-[#0c1f4d] font-bold text-lg">No Active Payment Account</h4>
              <p className="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed italic">
                The student hasn't added or activated their Bank/UPI details yet. Payout cannot proceed.
              </p>
            </div>
          )}

          <DialogFooter className="mt-6 border-t pt-4">
            <Button variant="ghost" onClick={() => setIsPayModalOpen(false)} className="text-gray-500 hover:text-red-500 hover:bg-red-50">
              Close
            </Button>
            {activeAccount && (
              <Button
                className="bg-[#0c1f4d] hover:bg-blue-900 text-white font-bold h-11 px-8 rounded-lg shadow-lg active:scale-95 transition-transform"
                onClick={handleRecordPayment}
                disabled={isPaying}
              >
                {isPaying ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                    Recording...
                  </div>
                ) : "Confirm & Record Payout"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Student Payment History Table Card ── */}
      <div className="mt-12 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50/50 p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#0c1f4d] p-2.5 rounded-xl shadow-md cursor-default">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0c1f4d] tracking-tight">Student Payment History</h3>
              <p className="text-xs text-gray-500 opacity-80">Track all manual payouts made to verified students</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchHistory()}
            className="text-[#0c1f4d] hover:bg-[#0c1f4d]/5 font-medium gap-2"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isHistoryLoading ? 'animate-spin' : ''}`} />
            Refresh History
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-bold text-[#0c1f4d] uppercase text-[11px] tracking-wider py-4 pl-8">Student Name</TableHead>
                <TableHead className="font-bold text-[#0c1f4d] uppercase text-[11px] tracking-wider py-4">Amount</TableHead>
                <TableHead className="font-bold text-[#0c1f4d] uppercase text-[11px] tracking-wider py-4">Transaction ID</TableHead>
                <TableHead className="font-bold text-[#0c1f4d] uppercase text-[11px] tracking-wider py-4">Method</TableHead>
                <TableHead className="font-bold text-[#0c1f4d] uppercase text-[11px] tracking-wider py-4">Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isHistoryLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="py-4 px-8"><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : paymentHistory?.data?.length > 0 ? (
                paymentHistory.data.map((record) => (
                  <TableRow key={record._id} className="hover:bg-gray-50/30 transition-colors border-gray-50">
                    <TableCell className="py-4 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="font-semibold text-gray-700">{record.student_id?.name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-black text-[#0c1f4d] text-md">₹{record.amount.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-mono text-[11px] border border-blue-100">
                        {record.transaction_id}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="flex flex-col items-start gap-1">
                        {record.payment_method === 'BANK' ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                            <Landmark className="w-4 h-4 text-[#0c1f4d]" /> BANK
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                            <QrCode className="w-4 h-4 text-[#0c1f4d]" /> UPI
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-gray-500 font-medium text-xs">
                      {new Date(record.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-gray-400 italic">
                    No payment history recorded yet.
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
