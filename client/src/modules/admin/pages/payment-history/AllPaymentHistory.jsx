// src/pages/admin/AllPaymentHistory.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSidebar } from "../../hooks/useSidebar";
import axios from "axios";
import { format } from "date-fns";

import { Eye } from "lucide-react";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const PAYMENT_TYPES = [
  "subscription",
  "banner",
  "trust_seal",
  "e_book",
  "trending_point",
  "top_listing",
  "other",
];

const AllPaymentHistory = () => {
  const { isSidebarOpen } = useSidebar();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [paymentType, setPaymentType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const limit = 10;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = { page, limit };

      if (search.trim()) params.search = search.trim();
      if (paymentType !== "all") params.payment_type = paymentType;
      if (dateFilter !== "all") params.date_filter = dateFilter;

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/payment-history/fetch-all-payment-history`, { params });
       console.log(res,'payment history ');
       
      setPayments(res.data.payments || []);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError("Failed to load payment history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search, paymentType, dateFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Debounce search → reset page
  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 600);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [paymentType, dateFilter]);

  const safeFormatDate = (dateVal, formatStr) => {
    if (!dateVal) return "—";
    const dateStr = typeof dateVal === 'object' && dateVal.$date ? dateVal.$date : dateVal;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return format(d, formatStr);
  };

  const getStatusBadge = (status) => {
    const variants = {
      success: "success",
      paid: "success",
      captured: "success",
      failed: "destructive",
      refunded: "warning",
      refund_pending: "secondary",
      pending: "default",
      authorized: "outline",
      created: "secondary",
      cancelled: "outline",
    };

    const variant = variants[status?.toLowerCase()] || "secondary";

    return (
      <Badge variant={variant} className="font-medium px-2.5 py-0.5">
        {status ? status.toUpperCase() : "UNKNOWN"}
      </Badge>
    );
  };

  const formatAmount = (payment) => {
    const amt = payment.total_amount != null ? payment.total_amount : payment.amount;
    if (amt == null) {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(0);
    }
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amt / 100);
  };

  const getItemName = (payment) => {
    if (payment.payment_type === "subscription" && payment.subscription_plan_id?.plan_name) {
      return payment.subscription_plan_id.plan_name;
    }
    return (
      payment.banner_id?.title ||
      payment.trust_seal_id?.name ||
      payment.ebook_id?.title ||
      (payment.trending_point_payment_id?.points
        ? `${payment.trending_point_payment_id.points} points`
        : "—")
    );
  };

  return (
    <div className={`${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"} min-h-screen bg-background`}>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground mt-1.5">View and filter all platform transactions</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
          <div className="w-full sm:w-72 md:w-80">
            <label className="text-sm font-medium mb-1.5 block">Search</label>
            <Input
              placeholder="e.g. RZRP12345"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 border-2 border-slate-300"
            />
          </div>

          <div className="w-full sm:w-48">
            <label className="text-sm font-medium mb-1.5 block">Type</label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger className="h-10 border-2 border-slate-300">
                <SelectValue placeholder="e.g. All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PAYMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-48">
            <label className="text-sm font-medium mb-1.5 block">Date Range</label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-10 border-2 border-slate-300">
                <SelectValue placeholder="e.g. All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content – responsive: cards on mobile, table on desktop */}
        <div className="space-y-4">
          {/* Desktop Table – hidden on small screens */}
          <div className="hidden md:block rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-b">
                    <TableHead className="h-12 font-semibold text-muted-foreground">Date</TableHead>
                    <TableHead className="h-12 font-semibold text-muted-foreground">User</TableHead>
                    <TableHead className="h-12 font-semibold text-muted-foreground">Type</TableHead>
                    <TableHead className="h-12 font-semibold text-muted-foreground">Plan / Item</TableHead>
                    <TableHead className="h-12 font-semibold text-muted-foreground">Amount</TableHead>
                    <TableHead className="h-12 font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="h-12 font-semibold text-muted-foreground">Payment ID</TableHead>
                    <TableHead className="h-12 font-semibold text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-destructive">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow
                        key={payment._id}
                        className="hover:bg-muted/50 transition-colors border-b last:border-0"
                      >
                        <TableCell className="whitespace-nowrap py-4">
                          {safeFormatDate(payment.createdAt, "dd MMM yyyy • hh:mm a")}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{payment.user?.name || "—"}</span>
                            <span className="text-xs text-muted-foreground">
                              {payment.user?.email || payment.user?.phone || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize py-4">
                          {payment.payment_type?.replace(/_/g, " ") || "—"}
                        </TableCell>
                        <TableCell className="py-4 max-w-[220px] truncate">
                          {getItemName(payment)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium py-4">
                          {formatAmount(payment)}
                        </TableCell>
                        <TableCell className="py-4">{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground py-4">
                          {payment.razorpay_payment_id
                            ? payment.razorpay_payment_id.slice(-8)
                            : payment.transaction_id?.slice(-8) || "—"}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Cards – visible on small/medium screens */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading transactions...</div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">{error}</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No payments found</div>
            ) : (
              payments.map((payment) => (
                <Card key={payment._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 pb-3 space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-0.5">
                          <p className="font-medium text-base">
                            {payment.user?.name || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.user?.email || payment.user?.phone || "—"}
                          </p>
                        </div>
                        <div>{getStatusBadge(payment.status)}</div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {safeFormatDate(payment.createdAt, "dd MMM yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {safeFormatDate(payment.createdAt, "hh:mm a")}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium capitalize">
                            {payment.payment_type?.replace(/_/g, " ") || "—"}
                          </p>
                        </div>

                        <div className="col-span-2">
                          <p className="text-muted-foreground">Item / Plan</p>
                          <p className="font-medium">{getItemName(payment)}</p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold text-lg">{formatAmount(payment)}</p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Payment ID</p>
                          <p className="font-mono text-xs">
                            {payment.razorpay_payment_id
                              ? payment.razorpay_payment_id.slice(-8)
                              : payment.transaction_id?.slice(-8) || "—"}
                          </p>
                        </div>
                        <div className="col-span-2 mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" /> View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination – common for both views */}
          {pagination && pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)} of{" "}
                {pagination.total.toLocaleString()} payments
              </p>

              <Pagination className="order-1 sm:order-2">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-40" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(7, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;

                    if (pagination.pages <= 7) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={pageNum === page}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    if (
                      pageNum === 1 ||
                      pageNum === pagination.pages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={pageNum === page}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    if (pageNum === 2 && page > 3) {
                      return (
                        <PaginationItem key="ellipsis-start">
                          <PaginationLink>...</PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (pageNum === pagination.pages - 1 && page < pagination.pages - 2) {
                      return (
                        <PaginationItem key="ellipsis-end">
                          <PaginationLink>...</PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      className={page === pagination.pages ? "pointer-events-none opacity-40" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6 mt-2 pb-4 pt-2">
              {/* Base Info */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Type</p>
                  <p className="font-medium capitalize mt-0.5">{selectedPayment.payment_type?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Item / Plan Name</p>
                  <p className="font-medium mt-0.5">{getItemName(selectedPayment)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total Amount</p>
                  <p className="font-semibold text-base mt-0.5">{formatAmount(selectedPayment)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <div className="mt-1.5">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                   <p className="text-muted-foreground text-xs">Date Paid</p>
                   <p className="font-medium mt-0.5">
                     {safeFormatDate(selectedPayment.paid_at, "dd MMM yyyy")}
                   </p>
                </div>
                 <div className="col-span-2">
                   <p className="text-muted-foreground text-xs">Payment Method</p>
                   <p className="font-medium capitalize mt-0.5">
                     {selectedPayment.payment_method || "—"}
                   </p>
                </div>
                {selectedPayment.notes && (
                  <div className="col-span-2 lg:col-span-4">
                    <p className="text-muted-foreground text-xs">Notes</p>
                    <p className="font-medium whitespace-pre-wrap mt-0.5">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Dynamic Payment Specifics */}
              <div className="text-sm space-y-4">
                <h3 className="font-semibold text-base">Plan / Associated Details</h3>
                
                {selectedPayment.payment_type === "subscription" && selectedPayment.user_subscription_id && (
                  <div className="grid grid-cols-2 gap-4 bg-muted/40 p-5 rounded-lg border">
                    <div>
                      <p className="text-muted-foreground text-xs">Plan Name</p>
                      <p className="font-medium mt-0.5">{selectedPayment.user_subscription_id.plan_snapshot?.plan_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Duration</p>
                      <p className="font-medium mt-0.5">
                        {selectedPayment.user_subscription_id.plan_snapshot?.duration_value}{" "}
                        {selectedPayment.user_subscription_id.plan_snapshot?.duration_unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Start Date</p>
                      <p className="font-medium mt-0.5">
                        {safeFormatDate(selectedPayment.user_subscription_id.paid_at, "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">End Date</p>
                      <p className="font-medium mt-0.5">
                        {safeFormatDate(selectedPayment.user_subscription_id.end_date, "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                  </div>
                )}

                {selectedPayment.payment_type === "banner" && selectedPayment.banner_id && (
                  <div className="grid grid-cols-2 gap-4 bg-muted/40 p-5 rounded-lg border">
                    <div>
                      <p className="text-muted-foreground text-xs">Plan Days</p>
                      <p className="font-medium mt-0.5">{selectedPayment.banner_id.days}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Payment Sync Status</p>
                      <p className="font-medium capitalize mt-0.5">{selectedPayment.banner_id.payment_status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">End Date</p>
                      <p className="font-medium mt-0.5">
                        {safeFormatDate(selectedPayment.banner_id.end_date, "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                  </div>
                )}

                {selectedPayment.payment_type === "trust_seal" && selectedPayment.trust_seal_id && (
                  <div className="grid grid-cols-2 gap-4 bg-muted/40 p-5 rounded-lg border">
                    <div>
                      <p className="text-muted-foreground text-xs">Seal Verification Status</p>
                      <p className="font-medium capitalize mt-0.5">{selectedPayment.trust_seal_id.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Amount Logged</p>
                      <p className="font-medium mt-0.5">₹{selectedPayment.trust_seal_id.amount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">GST Tracked</p>
                      <p className="font-medium mt-0.5">{selectedPayment.trust_seal_id.gst_percentage || 18}%</p>
                    </div>
                  </div>
                )}

                {selectedPayment.payment_type === "trending_point" && selectedPayment.trending_point_payment_id && (
                  <div className="grid grid-cols-2 gap-4 bg-muted/40 p-5 rounded-lg border">
                    <div>
                      <p className="text-muted-foreground text-xs">Points Acquired</p>
                      <p className="font-medium mt-0.5">{selectedPayment.trending_point_payment_id.points} Points</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Base Amount</p>
                      <p className="font-medium mt-0.5">₹{selectedPayment.trending_point_payment_id.amount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Internal Sync Status</p>
                      <p className="font-medium capitalize mt-0.5">{selectedPayment.trending_point_payment_id.status}</p>
                    </div>
                  </div>
                )}

                {selectedPayment.payment_type === "top_listing" && selectedPayment.top_listing_payment_id && (
                  <div className="grid grid-cols-2 gap-4 bg-muted/40 p-5 rounded-lg border">
                    <div>
                      <p className="text-muted-foreground text-xs">Total Listing Days</p>
                      <p className="font-medium mt-0.5">{selectedPayment.top_listing_payment_id.days} Days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Validity Status</p>
                      <p className="font-medium capitalize mt-0.5">{selectedPayment.top_listing_payment_id.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Start Date</p>
                      <p className="font-medium mt-0.5">
                        {safeFormatDate(selectedPayment.top_listing_payment_id.starts_at, "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Expiration Date</p>
                      <p className="font-medium mt-0.5">
                        {safeFormatDate(selectedPayment.top_listing_payment_id.expires_at, "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                  </div>
                )}

                {selectedPayment.payment_type === "e_book" && selectedPayment.ebook_id && (
                  <div className="flex flex-col gap-4 bg-muted/40 p-5 rounded-lg border">
                    <div>
                      <p className="text-muted-foreground text-xs">Extra Cities Accessible</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedPayment.ebook_id.extra_cities?.length ? (
                          selectedPayment.ebook_id.extra_cities.map((city, idx) => (
                            <Badge key={idx} variant="outline" className="bg-background">{city}</Badge>
                          ))
                        ) : (
                          <span className="text-sm">No extra cities</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-muted-foreground text-xs">Base Amount</p>
                        <p className="font-medium mt-0.5">₹{selectedPayment.ebook_id.amount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Internal Status</p>
                        <p className="font-medium capitalize mt-0.5">{selectedPayment.ebook_id.status}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Missing linked ref warning */}
                {!['other', 'trending_point_free'].includes(selectedPayment.payment_type) && 
                 !selectedPayment.user_subscription_id && 
                 !selectedPayment.banner_id && 
                 !selectedPayment.trust_seal_id && 
                 !selectedPayment.trending_point_payment_id && 
                 !selectedPayment.top_listing_payment_id && 
                 !selectedPayment.ebook_id && (
                   <div className="text-muted-foreground text-sm text-center bg-muted/20 p-6 rounded-lg border border-dashed italic">
                      {"Detailed plan or item information hasn't been linked to this payment record."}
                   </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllPaymentHistory;
