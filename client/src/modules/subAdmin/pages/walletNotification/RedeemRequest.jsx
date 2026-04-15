import { useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import {
  useGetAllRedeemRequestsQuery,
  useSendRedeemAmountMutation,
  useRejectRedeemRequestMutation,
  useGetRedeemHistoryQuery,
  useMarkRedeemPointAsReadMutation,
} from "@/redux/api/couponsNotificationApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/pagination";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import showToast from "@/toast/showToast";

import {
  User,
  Loader2,
  Eye,
  X ,
  Tag,
  Coins,
  IndianRupee,
  MessageSquare,
  CheckCircle2,
  Clock,
  Users,
  EyeOff,
  Send,
  Calculator,
  WalletCards,
  Ticket,
  FileText,
  Download,
  Building,
  Smartphone,
  CreditCard
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import StudentPaymentDetailsModal from "./StudentPaymentDetailsModal";
import SendCouponEmailModal from "./SendCouponEmailModal";

const socket = io(import.meta.env.VITE_SOCKET_IO_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

const RedeemRequest = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const { isSidebarOpen } = useSidebar();

  // ─── Pending Requests ───────────────────────────────
  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;

  const { data, isLoading, isError, refetch } = useGetAllRedeemRequestsQuery({
    userId,
    page: currentPage,
    limit,
  });

  // ─── Redeem History ─────────────────────────────────
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 10;

  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
  } = useGetRedeemHistoryQuery({
    page: historyPage,
    limit: historyLimit,
  });

  const [sendRedeemAmount, { isLoading: sendLoading }] = useSendRedeemAmountMutation();
  const [rejectRequest, { isLoading: rejectRedeemLoading }] = useRejectRedeemRequestMutation();
  const [markRedeemPointAsRead] = useMarkRedeemPointAsReadMutation();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [studentPaymentAccounts, setStudentPaymentAccounts] = useState([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    socket.emit("join", userId);

    if (data?.notifications) {
      setRequests(data.notifications);
    }
  }, [data, userId]);

  useEffect(() => {
    socket.on("newRedemption", (notification) => {
      setRequests((prev) => [notification, ...prev].slice(0, limit));
      refetch();
    });

    socket.on("notificationUpdated", (updatedNotification) => {
      setRequests((prev) =>
        prev.map((n) =>
          n._id === updatedNotification._id ? { ...n, ...updatedNotification } : n
        )
      );
      refetch();
    });

    socket.on("pointsUpdated", ({ view_points }) => {
      showToast(`Points updated: ${view_points} remaining`, "info");
    });

    return () => {
      socket.off("newRedemption");
      socket.off("notificationUpdated");
      socket.off("pointsUpdated");
    };
  }, [refetch]);

  const handleReject = async (id) => {
    try {
      await rejectRequest({
        notificationId: id,
        reason: "Not eligible / Duplicate request",
      }).unwrap();
      refetch();
      showToast("Redemption rejected successfully", "success");
    } catch (err) {
      showToast(err.data?.message || "Failed to reject", "error");
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markRedeemPointAsRead(id).unwrap();
      showToast("Redemption marked as read", "success");
      refetch();
    } catch (err) {
      showToast(err.data?.message || "Failed to mark as read", "error");
    }
  };

  const handleComplete = async (notificationId, receiverId) => {
    try {
      await sendRedeemAmount({ notificationId, receiverId }).unwrap();
      showToast("Redemption marked as completed", "success");
      refetch();
    } catch (error) {
      showToast(error.data?.message || "Failed to complete redemption", "error");
    }
  };

  const handleSendEmail = async (userId, role, redemptionType) => {
    if (!userId) {
      showToast("User not found", "destructive");
      return;
    }

    const normalizedRole = role?.trim()?.toUpperCase();
    const isCashRequest = redemptionType === 'cash' || normalizedRole === "STUDENT";

    try {
      if (isCashRequest) {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/payment-accounts/user/${userId}`
        );
        setStudentPaymentAccounts(res.data.data);
        setPaymentModalOpen(true);
      } else {
        setSelectedUserId(userId);
        setCouponModalOpen(true);
      }
    } catch (error) {
      showToast(`Failed to fetch payment details: ${error.message}`, "destructive");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    refetch();
  };

  const handleHistoryPageChange = (page) => {
    setHistoryPage(page);
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-red-100 text-red-700",
      "bg-blue-100 text-blue-700",
      "bg-green-100 text-green-700",
      "bg-yellow-100 text-yellow-700",
      "bg-purple-100 text-purple-700",
      "bg-pink-100 text-pink-700",
      "bg-orange-100 text-orange-700",
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"} transition-all duration-300`}
    >
      {/* ─── PENDING REDEEM REQUESTS ─────────────────────────────── */}
      <div className="mb-16">
        <div className="p-4">
          <h2 className="text-md border-1 w-fit border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
            Redeem Requests
          </h2>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="ml-2">Loading redeem requests...</p>
            </div>
          ) : isError ? (
            <p className="text-red-500">Failed to load redeem requests</p>
          ) : requests.length > 0 ? (
            <>
              {/* SOP Cards */}
              <div className="xl:col-span-1 mb-8">
                <div className="space-y-2 mb-6">
                  <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
                    Settlement Ops
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    Protocols for liquidating reward points and distributing incentives.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white flex-1">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                        <WalletCards size={16} className="text-blue-600" />
                        1. Beneficiary Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>Students:</strong> Cash/GPay
                        <br />
                        <strong>Others:</strong> Coupons only
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white flex-1">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                        <Calculator size={16} className="text-emerald-600" />
                        2. Point Conversion
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Verify points vs. amount before processing
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white flex-1">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                        <Send size={16} className="text-amber-600" />
                        3. Fulfillment Action
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>Students:</strong> Transfer funds then Complete
                        <br />
                        <strong>Others:</strong> Complete → auto email voucher
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto w-full">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-[#0c1f4d]">
                    <TableRow>
                      <TableHead className="text-white">Owner Name</TableHead>
                      <TableHead className="text-white">Type</TableHead>
                      <TableHead className="text-white">Coupon</TableHead>
                      <TableHead className="text-white">Points</TableHead>
                      <TableHead className="text-white">Amount (₹)</TableHead>
                      <TableHead className="text-white">Reason</TableHead>
                      <TableHead className="text-white">Amount Sent</TableHead>
                      <TableHead className="text-white">Read By</TableHead>
                      <TableHead className="text-white">Action</TableHead>
                      <TableHead className="text-white">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className={getAvatarColor(request?.redeemedBy?.name)}>
                                {request?.redeemedBy?.name?.charAt(0)?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                <span>{request?.redeemPointsId?.user_id?.name || "Unknown"}</span>
                                {request?.redeemPointsId?.markAsRead === false && (
                                  <Badge className="bg-red-500 hover:bg-red-600 text-[10px] px-1.5 py-0 h-4 uppercase">New</Badge>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {request?.redeemPointsId?.user_id?.role?.role || "User"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {(() => {
                            const redeemData = request?.redeemPointsId;
                            const role = redeemData?.user_id?.role?.role?.trim()?.toUpperCase();
                            const explicitType = redeemData?.redemption_type;
                            
                            // 1. Prioritize explicit type if available
                            // 2. Fallback: If no type, check if it's a student without a coupon (old cash requests)
                            const isCash = explicitType === 'cash' || 
                                           (!explicitType && role === 'STUDENT' && !redeemData?.coupon_id);
                            
                            return (
                              <Badge 
                                variant={isCash ? 'outline' : 'secondary'} 
                                className={isCash 
                                  ? 'border-green-200 text-green-700 bg-green-50 uppercase text-[10px]' 
                                  : 'border-purple-200 text-purple-700 bg-purple-50 uppercase text-[10px]'}
                              >
                                {isCash ? 'cash' : 'coupon'}
                              </Badge>
                            );
                          })()}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-purple-600" />
                            {request.couponName || "N/A"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-600" />
                            {request?.redeemPointsId?.redeem_point?.toLocaleString() || "0"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-700">
                              {(() => {
                                const redeemData = request?.redeemPointsId;
                                const role = redeemData?.user_id?.role?.role?.trim()?.toUpperCase();
                                const explicitType = redeemData?.redemption_type;
                                const isCash = explicitType === 'cash' || (!explicitType && role === 'STUDENT' && !redeemData?.coupon_id);
                                return isCash 
                                  ? redeemData?.redeem_point?.toLocaleString() || "0"
                                  : redeemData?.amount_in_inr?.toLocaleString() || "0";
                              })()}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-start gap-2 max-w-xs">
                            <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                            <span className="text-sm text-gray-700 line-clamp-2">
                              {request?.redeemPointsId?.reason || "No reason"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {request.amount_sent ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span className="text-green-700">Sent</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-orange-600" />
                              <span className="text-orange-700">Pending</span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {request.readBy?.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-indigo-600" />
                              <div className="flex -space-x-2">
                                {request.readBy.slice(0, 4).map((reader, i) => (
                                  <Avatar key={i} className="h-8 w-8 border-2 border-white">
                                    <AvatarFallback className={getAvatarColor(reader.name)}>
                                      {reader.name?.charAt(0)?.toUpperCase() || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {request.readBy.length > 4 && (
                                  <div className="h-8 w-8 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center border-2 border-white">
                                    +{request.readBy.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <EyeOff className="w-4 h-4 text-red-600" />
                              <span className="text-red-700">Not Viewed</span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {!request.amount_sent && (
                              <Button
                                size="sm"
                                className="bg-[#0c1f4d] hover:bg-[#0c1f4dd0] text-white"
                                onClick={() =>
                                  handleComplete(
                                    request._id,
                                    request?.redeemPointsId?.user_id?._id
                                  )
                                }
                                disabled={sendLoading}
                              >
                                {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete"}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(request._id)}
                              disabled={rejectRedeemLoading}
                            >
                              {rejectRedeemLoading ? "Rejecting..." : "Reject"}
                            </Button>
                            {request?.redeemPointsId?.markAsRead === false && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsRead(request?.redeemPointsId?._id)}
                                title="Mark as Read"
                                className="px-2"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
                                Read
                              </Button>
                            )}
                            {(() => {
                              const redeemData = request?.redeemPointsId;
                              const role = redeemData?.user_id?.role?.role?.trim()?.toUpperCase();
                              const explicitType = redeemData?.redemption_type;
                              
                              const isCash = explicitType === 'cash' || 
                                             (!explicitType && role === 'STUDENT' && !redeemData?.coupon_id);
                              
                              if (isCash) {
                                return (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                    onClick={() =>
                                      handleSendEmail(
                                        request?.redeemPointsId?.user_id?._id,
                                        request?.redeemPointsId?.user_id?.role?.role,
                                        'cash'
                                      )
                                    }
                                  >
                                    View Account
                                  </Button>
                                );
                              }
                              
                              return (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleSendEmail(
                                      request?.redeemPointsId?.user_id?._id,
                                      request?.redeemPointsId?.user_id?.role?.role,
                                      'coupon'
                                    )
                                  }
                                >
                                  Send Email
                                </Button>
                              );
                            })()}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleView(request)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards - Pending */}
              <div className="block sm:hidden space-y-4">
                {requests.map((request) => (
                  <div key={request._id} className="bg-white border rounded-lg p-4 shadow-sm">
                    {/* ... your existing mobile card content ... */}
                    {/* (keeping it short here – copy your original mobile card block) */}
                  </div>
                ))}
              </div>

              {/* Pagination - Pending */}
              {data?.pagination && (
                <Pagination className="mt-6 justify-end">
                  <PaginationContent>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    />
                    {[...Array(data.pagination.totalPages)].map((_, i) => (
                      <PaginationLink
                        key={i + 1}
                        isActive={currentPage === i + 1}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    ))}
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(
                          Math.min(data.pagination.totalPages, currentPage + 1)
                        )
                      }
                      disabled={currentPage === data.pagination.totalPages}
                    />
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No pending redeem requests</p>
          )}
        </div>
      </div>

      {/* ─── REDEEM HISTORY SECTION ──────────────────────────────── */}
      <div className="mt-16 pt-10 border-t border-gray-200">
        <div className="p-4">
          <h2 className="text-2xl font-bold text-[#0c1f4d] mb-2">Redeem History</h2>
          <p className="text-sm text-slate-500 mb-6">
            All processed, approved, rejected, and completed redemptions
          </p>
        </div>

        {historyLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0c1f4d]" />
          </div>
        ) : historyError ? (
          <p className="text-red-600 text-center py-8">Failed to load history</p>
        ) : !historyData?.data?.length ? (
          <p className="text-center py-12 text-slate-500">No processed redemptions yet</p>
        ) : (
          <>
            {/* Desktop History Table */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Coupon / Mode</TableHead>
                    <TableHead>Status</TableHead>

                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.data.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.user_id?.name || "—"}</div>
                        <div className="text-xs text-gray-500">
                          {item.user_id?.role?.role || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const role = item.user_id?.role?.role?.trim()?.toUpperCase();
                          const explicitType = item.redemption_type;
                          
                          const isCash = explicitType === 'cash' || 
                                         (!explicitType && role === 'STUDENT' && !item.coupon_id);
                          
                          return (
                            <Badge 
                              variant={isCash ? 'outline' : 'secondary'} 
                              className={isCash 
                                ? 'border-green-200 text-green-700 bg-green-50 uppercase text-[10px]' 
                                : 'border-purple-200 text-purple-700 bg-purple-50 uppercase text-[10px]'}
                            >
                              {isCash ? 'cash' : 'coupon'}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.redeem_point.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-green-700">
                        ₹{(() => {
                           const role = item.user_id?.role?.role?.trim()?.toUpperCase();
                           const explicitType = item.redemption_type;
                           const isCash = explicitType === 'cash' || (!explicitType && role === 'STUDENT' && !item.coupon_id);
                           return isCash ? item.redeem_point?.toLocaleString() : (item.amount_in_inr?.toLocaleString() || "—");
                        })()}
                      </TableCell>
                      <TableCell>
                        {item.coupon_id
                          ? item.coupon_code
                          : item.coupon_code?.startsWith("CASH-")
                            ? "UPI/Bank"
                            : item.coupon_code || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.amount_sent || item.status === "approved"
                              ? "success"
                              : item.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {item.amount_sent
                            ? "Completed"
                            : item.status === "approved"
                              ? "Approved"
                              : "Rejected"}
                        </Badge>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile History Cards (you can expand this similarly to pending mobile view) */}
            <div className="block sm:hidden space-y-4 px-4">
              {historyData.data.map((item) => (
                <div key={item._id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="space-y-2 text-sm">
                    <div><strong>Date:</strong> {new Date(item.created_at).toLocaleDateString("en-IN")}</div>
                    <div><strong>User:</strong> {item.user_id?.name || "—"}</div>
                    <div><strong>Type:</strong> {item.coupon_id ? "Coupon" : "Cash"}</div>
                    <div><strong>Points:</strong> {item.redeem_point.toLocaleString()}</div>
                    <div><strong>Amount:</strong> ₹{(() => {
                           const role = item.user_id?.role?.role?.trim()?.toUpperCase();
                           const explicitType = item.redemption_type;
                           const isCash = explicitType === 'cash' || (!explicitType && role === 'STUDENT' && !item.coupon_id);
                           return isCash ? item.redeem_point?.toLocaleString() : (item.amount_in_inr?.toLocaleString() || "—");
                        })()}</div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <Badge variant={item.amount_sent || item.status === "approved" ? "success" : "destructive"}>
                        {item.amount_sent ? "Completed" : item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* History Pagination */}
            {historyData?.pagination && (
              <Pagination className="mt-8 justify-center">
                <PaginationContent>
                  <PaginationPrevious
                    onClick={() => handleHistoryPageChange(Math.max(1, historyPage - 1))}
                    disabled={historyPage === 1}
                  />
                  {[...Array(historyData.pagination.totalPages)].map((_, i) => (
                    <PaginationLink
                      key={i + 1}
                      isActive={historyPage === i + 1}
                      onClick={() => handleHistoryPageChange(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  ))}
                  <PaginationNext
                    onClick={() =>
                      handleHistoryPageChange(
                        Math.min(historyData.pagination.totalPages, historyPage + 1)
                      )
                    }
                    disabled={historyPage === historyData.pagination.totalPages}
                  />
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>

      {/* ─── MODALS ──────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] w-[95%] p-0 overflow-hidden bg-white rounded-3xl border-none shadow-2xl flex flex-col font-sans overflow-y-auto max-h-[90vh]">
          {selectedRequest && (
            <>
              {/* Premium Header */}
              <div className="relative h-24 bg-gradient-to-r from-[#0c1f4d] to-[#1e3a8a] flex items-center px-8 flex-shrink-0">
                <div className="flex justify-between items-center w-full z-10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <WalletCards className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight">Redemption Details</h2>
                      <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Request ID: {selectedRequest._id?.slice(-8)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all outline-none"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 px-8 py-8 space-y-8 scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Requester Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <div className="h-1 w-6 bg-indigo-600 rounded-full" />
                       <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Requester</h3>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 italic">
                       <Avatar className="h-12 w-12 border-2 border-white shadow-sm font-sans">
                         <AvatarFallback className={getAvatarColor(selectedRequest.redeemedBy?.name)}>
                           {selectedRequest.redeemedBy?.name?.charAt(0)?.toUpperCase()}
                         </AvatarFallback>
                       </Avatar>
                       <div>
                         <p className="text-sm font-bold text-slate-800">{selectedRequest.redeemedBy?.name || "N/A"}</p>
                         <p className="text-xs text-slate-500 font-medium">{selectedRequest.redeemedBy?.email || "No email"}</p>
                       </div>
                    </div>
                  </div>

                  {/* Request Summary */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <div className="h-1 w-6 bg-emerald-500 rounded-full" />
                       <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Financials</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                          <span className="text-[9px] font-bold text-emerald-600 uppercase block mb-1">Points</span>
                          <div className="flex items-center gap-1.5">
                             <Coins className="h-3.5 w-3.5 text-emerald-600" />
                             <span className="text-sm font-black text-emerald-700">{selectedRequest.redeemPointsId?.redeem_point?.toLocaleString() || "0"}</span>
                          </div>
                       </div>
                       <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                          <span className="text-[9px] font-bold text-indigo-600 uppercase block mb-1">Amount</span>
                          <div className="flex items-center gap-1.5">
                             <IndianRupee className="h-3.5 w-3.5 text-indigo-600" />
                             <span className="text-sm font-black text-indigo-700">₹{selectedRequest.redeemPointsId?.amount_in_inr?.toLocaleString() || "0"}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Redemption Type</span>
                    {(() => {
                      const redeemData = selectedRequest?.redeemPointsId;
                      const role = selectedRequest?.redeemedBy?.role?.role?.trim()?.toUpperCase();
                      const explicitType = redeemData?.redemption_type;
                      const isCash = explicitType === 'cash' || (!explicitType && role === 'STUDENT' && !redeemData?.coupon_id);
                      return (
                        <Badge className={`${isCash ? "bg-green-50 text-green-700 border-green-200" : "bg-purple-50 text-purple-700 border-purple-200"} px-3 py-1 rounded-lg border shadow-none font-bold text-[10px]`}>
                          {isCash ? "CASH PAYOUT" : "COUPON VOUCHER"}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coupon / Mode</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Ticket size={14} className="text-slate-400" />
                      {selectedRequest.couponName || (selectedRequest.redeemPointsId?.redemption_type === 'cash' ? "Direct Bank Transfer" : "N/A")}
                    </div>
                  </div>
                </div>

                {/* Reason Section */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                   <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requester's Note</span>
                   </div>
                   <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                     "{selectedRequest.redeemPointsId?.reason || "No reason provided for this request."}"
                   </p>
                </div>

                {/* Letter Document Section */}
                {selectedRequest.letterImageUrl && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="h-1 w-6 bg-rose-500 rounded-full" />
                         <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Document Evidence</h3>
                      </div>
                      <a 
                        href={selectedRequest.letterImageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm"
                      >
                        <Download size={12} />
                        Download Letter
                      </a>
                    </div>
                    
                    <div className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
                      <Zoom>
                        <img
                          src={selectedRequest.letterImageUrl}
                          alt="Letter Evidence"
                          className="w-full h-auto max-h-[400px] object-contain transition-transform duration-500 hover:scale-[1.02]"
                        />
                      </Zoom>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-sm p-2 rounded-xl text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Eye size={16} />
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 font-medium italic">
                      Click image to zoom • Uploaded for cash redemption verification
                    </p>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-6 bg-slate-50 flex justify-end gap-3 flex-shrink-0 border-t border-slate-100">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-6 h-11 font-bold text-slate-600 border-slate-200 hover:bg-slate-100 transition-all font-sans"
                >
                  Close View
                </Button>
                {!selectedRequest.amount_sent && selectedRequest.status !== "rejected" && (
                  <Button 
                    className="rounded-xl px-6 h-11 font-bold bg-[#0c1f4d] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-100 transition-all"
                    onClick={() => {
                        handleComplete(selectedRequest._id, selectedRequest.redeemPointsId?.user_id?._id);
                        setIsModalOpen(false);
                    }}
                  >
                    Approve & Complete
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <StudentPaymentDetailsModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        data={studentPaymentAccounts}
      />

      <SendCouponEmailModal
        open={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        userId={selectedUserId}
        showToast={showToast}
      />
    </div>
  );
};

export default RedeemRequest;
