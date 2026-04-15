import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from 'react-router-dom';
import { X, Calendar, ArrowUpCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';
import { useGetAllActiveSubscriptionsQuery, useCancelSubscriptionMutation } from '@/redux/api/UserSubscriptionPlanApi';
import showToast from '@/toast/showToast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
} from "@/components/ui/pagination";

const PurchasedSellersTable = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const limit = 5;

  const { data: activeSubscriptions, isLoading, error, refetch } = useGetAllActiveSubscriptionsQuery({ page, limit });
  const [cancelSubscription] = useCancelSubscriptionMutation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    console.error('Error fetching subscriptions:', error);
    if (error.status === 404) {
      return <div className="p-4 text-gray-500">No active subscriptions found.</div>;
    }
    return <div className="p-4 text-red-600">Error fetching subscriptions: {error.data?.message || error.message || 'Unknown error'}</div>;
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full sm:h-16" />
          <Skeleton className="h-64 w-full sm:h-16" />
          <Skeleton className="h-64 w-full sm:h-16" />
        </div>
      </div>
    );
  }

  const subscriptions = activeSubscriptions?.data || [];
  const pagination = activeSubscriptions?.pagination || {};
  const total = pagination.total || 0;
  const totalPages = pagination.totalPages || 1;
  const hasNextPage = pagination.hasNextPage || false;
  const hasPrevPage = pagination.hasPrevPage || false;

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const priceBadgeVariant = (amount) => {
    const a = Number(amount) || 0;
    if (a >= 100 && a <= 999) return "bg-emerald-100 text-emerald-700";
    if (a >= 1000 && a <= 2999) return "bg-amber-100 text-amber-700";
    if (a >= 3000) return "bg-rose-100 text-rose-700";
    return "bg-slate-100 text-slate-700";
  };

  const randomNameColor = () => {
    const colors = [
      "bg-red-600", "bg-blue-600", "bg-green-600", "bg-purple-600",
      "bg-orange-600", "bg-pink-600", "bg-teal-600",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleCancelClick = (subscriptionId) => {
    setSelectedSubId(subscriptionId);
    setIsCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!selectedSubId) return;

    try {
      setIsCancelling(true);
      await cancelSubscription(selectedSubId).unwrap();
      showToast("Subscription cancelled successfully", 'success');
      setIsCancelDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Cancel Error:', error);
      showToast(`Failed to cancel: ${error?.data?.message || error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const goToBuyPlan = () => {
    navigate('/sub-admin-dashboard/payments/upgrade-plan');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDateInfo = (sub) => {
    if (sub.end_date) {
      return {
        label: sub.auto_renew ? "Next renewal" : "Expires on",
        date: formatDate(sub.end_date)
      };
    }

    // Fallbacks (should become rare once end_date is reliably set)
    if (sub.next_renewal_at) {
      return {
        label: "Next renewal",
        date: formatDate(sub.next_renewal_at)
      };
    }

    if (sub.paid_at) {
      return {
        label: "Paid on",
        date: formatDate(sub.paid_at)
      };
    }

    if (sub.created_at) {
      return {
        label: "Created on",
        date: formatDate(sub.created_at)
      };
    }

    return {
      label: "Date",
      date: "—"
    };
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md border-1 border-[#0c1f4d] w-fit text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
          Purchased Sellers
        </h3>

        <Button
          onClick={goToBuyPlan}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2"
        >
          <ArrowUpCircle className="h-4 w-4" />
          Upgrade or create subscription
        </Button>
      </div>

      {subscriptions.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader className="bg-[#0c1f4d]">
                <TableRow>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Seller</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Email</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Phone</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Plan</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Price</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Status / Date</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => {
                  const seller = sub.user || {};
                  const plan = sub.subscription_plan_id || {};
                  const { label, date } = getDateInfo(sub);

                  return (
                    <TableRow key={sub._id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={`font-medium text-white ${randomNameColor()}`}>
                            {getInitial(seller.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{seller.name || "N/A"}</span>
                          {sub.merchant?.company_name && (
                            <span className="text-xs font-bold text-indigo-600 leading-tight">
                              {sub.merchant.company_name}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                            {seller.role || "Seller"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{seller.email || "N/A"}</span>
                          {sub.merchant?.company_email && (
                            <span className="text-xs text-muted-foreground leading-tight">
                              {sub.merchant.company_email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{seller.phone || "N/A"}</span>
                          {sub.merchant?.company_phone_number && (
                            <span className="text-xs text-muted-foreground leading-tight">
                              {sub.merchant.company_phone_number}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="px-3 py-1 font-medium">{plan.plan_name || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        {plan.plan_code === "FREE" || (sub.plan_snapshot?.price === 0 || plan.price === 0) ? (
                          <span className="text-muted-foreground font-medium">—</span>
                        ) : (
                          <div className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm ${priceBadgeVariant(sub.plan_snapshot?.price || plan.price)}`}>
                            <span className="font-semibold">
                              ₹{sub.plan_snapshot?.price || (plan.price > 0 ? plan.price - 1 : 0)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {label}: {date}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          onClick={() => handleCancelClick(sub._id)}
                          variant="destructive"
                          className="flex items-center gap-2 cursor-pointer h-9 px-4 rounded-xl shadow-sm hover:shadow-red-200 transition-all font-bold"
                        >
                          <X className="h-4 w-4" />
                          <span className="hidden sm:inline">Cancel</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-4">
            {subscriptions.map((sub) => {
              const seller = sub.user || {};
              const plan = sub.subscription_plan_id || {};
              const { label, date } = getDateInfo(sub);

              return (
                <Card key={sub._id} className="border rounded-lg shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={`font-medium text-white ${randomNameColor()}`}>
                          {getInitial(seller.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{seller.name || "N/A"}</span>
                        {sub.merchant?.company_name && (
                          <span className="text-xs font-bold text-indigo-600">{sub.merchant.company_name}</span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{seller.role || "Seller"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 mt-2 text-sm border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Personal Email:</span>
                        <span className="font-medium">{seller.email || "N/A"}</span>
                      </div>
                      {sub.merchant?.company_email && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Company Email:</span>
                          <span className="font-medium text-indigo-600">{sub.merchant.company_email}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Personal Phone:</span>
                        <span className="font-medium">{seller.phone || "N/A"}</span>
                      </div>
                      {sub.merchant?.company_phone_number && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Company Phone:</span>
                          <span className="font-medium text-indigo-600">{sub.merchant.company_phone_number}</span>
                        </div>
                      )}
                    </div>
                    <p>
                      Plan: <Badge className="px-3 py-1 font-medium">{plan.plan_name || "—"}</Badge>
                    </p>
                    <p>
                      Price:{" "}
                      {plan.plan_code === "FREE" || (sub.plan_snapshot?.price === 0 || plan.price === 0) ? (
                        <span className="text-muted-foreground font-medium small">—</span>
                      ) : (
                        <span className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm ${priceBadgeVariant(sub.plan_snapshot?.price || plan.price)}`}>
                          <span className="font-semibold">
                            ₹{sub.plan_snapshot?.price || (plan.price > 0 ? plan.price - 1 : 0)}
                          </span>
                        </span>
                      )}
                    </p>
                    <p>
                      {label}:{" "}
                      <span className="text-sm text-muted-foreground font-medium">
                        {date}
                      </span>
                    </p>
                    <div className="flex gap-3 mt-3 flex-wrap">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelClick(sub._id)}
                        className="cursor-pointer h-9 px-4 rounded-xl font-bold shadow-sm"
                      >
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing page {page} of {totalPages}
              </div>
              <Pagination className="flex justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (hasPrevPage) setPage(page - 1);
                      }}
                      className={!hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          isActive={page === pageNum}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNum);
                          }}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {totalPages > 5 && <PaginationItem><PaginationEllipsis /></PaginationItem>}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (hasNextPage) setPage(page + 1);
                      }}
                      className={!hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500 mt-6">No purchased sellers found.</p>
      )}
      {/* Cancellation Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white p-0 gap-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <div className="p-8 text-center pt-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 mb-6 animate-in zoom-in duration-300 border border-red-100">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Revoke Subscription?</DialogTitle>
            <p className="text-slate-500 font-medium leading-relaxed px-4">
              Are you sure you want to cancel this seller's premium access? 
              They will be automatically reverted to the <span className="text-indigo-600 font-bold">Lifetime Free Plan</span>.
            </p>
          </div>
          <div className="p-8 bg-slate-50 flex gap-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              className="flex-1 h-14 rounded-2xl cursor-pointer bg-white border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-lg transition-all"
            >
              Keep Access
            </Button>
            <Button
              onClick={confirmCancel}
              disabled={isCancelling}
              className="flex-1 h-14 rounded-2xl cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-lg shadow-red-100 transition-all"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Cancelling...
                </>
              ) : "Yes, Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasedSellersTable;
