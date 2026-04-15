import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useGetAllActiveBannerPaymentsQuery } from '@/redux/api/BannerPaymentApi';
import { useGetUserBySearchQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import AdminBannerPlanManagement from './BannerPlanManagement';
import { Edit, X, RefreshCw, Search, IndianRupee } from 'lucide-react';
import showToast from '@/toast/showToast';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

const BannerSubscription = () => {
  const { user } = useContext(AuthContext);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null); // Holds { user, bannerPayment }
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false); // New state for action loading
  const [actionMode, setActionMode] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const limit = 5;

  // Debounce search input (1 second = 1000ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Search seller by email or phone
  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useGetUserBySearchQuery(debouncedSearch, {
    skip: !debouncedSearch || debouncedSearch.length < 3,
  });

  // Handle search results
  useEffect(() => {
    if (searchResults?.user) {
      setSelectedSeller({
        user: searchResults.user,
        bannerPayment: searchResults.bannerPayment || null
      });
    } else {
      setSelectedSeller(null);
    }
  }, [searchResults]);

  // Handle search errors
  useEffect(() => {
    if (searchError) {
      const errorMessage = searchError?.data?.message || 'Failed to search for seller';
      showToast(errorMessage, 'error');
    }
  }, [searchError]);

  // Fetch all active banner purchases with pagination
  const { data: activeBannerPayments, isLoading: isBannerPaymentsLoading, refetch: refetchBannerPayments } = useGetAllActiveBannerPaymentsQuery({ page, limit });

  const totalPages = activeBannerPayments?.pages || 1;
  console.log(activeBannerPayments, 'activeBannerPayments');
  // Handle component refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchBannerPayments();
      setSearchInput('');
      setDebouncedSearch('');
      setSelectedSeller(null);
      showToast('Banner data refreshed successfully', 'success');
    } catch (error) {
      console.error('Refresh error:', error);
      showToast('Failed to refresh banner data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRandomBg = (name) => {
    const colors = ["#E63946", "#1D3557", "#457B9D", "#A8DADC", "#F4A261", "#2A9D8F", "#8D99AE"];
    const index = name?.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`flex-1 lg:p-4 transition-all duration-300`}>
      <div className="lg:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Manage Banner Subscriptions</h2>
          <Button
            onClick={handleRefresh}
            className="bg-[#0c1f4d] hover:bg-[#0c1f4dd0] cursor-pointer text-white"
            disabled={isRefreshing || isActionLoading}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <Label htmlFor="searchInput" className="text-gray-700">Search Seller by Email or Phone</Label>
          <div className="relative w-full max-w-md mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="searchInput"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (e.target.value.trim()) {
                  setSelectedSeller({ user: selectedSeller?.user, bannerPayment: null });
                  setActionMode("purchase");
                }
              }}
              placeholder="Search by email or phone..."
              className="pl-9 pr-3 py-2 rounded-lg focus-visible:ring-gray-200 bg-gray-100 text-sm"
              disabled={isRefreshing || isActionLoading}
            />
          </div>
          {isSearchLoading && (
            <div className="mt-2">
              <Skeleton className="h-4 w-32" />
            </div>
          )}
          {selectedSeller?.user && !isActionLoading ? (
            <div className="p-3 rounded-lg border mt-5 border-gray-300 bg-gray-50">
              <p className="font-medium">Selected Seller:</p>

              {selectedSeller.user.email && (
                <p className="text-sm">Email: {selectedSeller.user.email}</p>
              )}

              {selectedSeller.user.phone && (
                <p className="text-sm">Phone Number: {selectedSeller.user.phone}</p>
              )}

              {selectedSeller.user.role && (
                <p className="text-sm">Role: {selectedSeller.user.role}</p>
              )}

              {selectedSeller.bannerPayment && (
                <>
                  {selectedSeller.bannerPayment._id && (
                    <p className="text-sm">
                      Banner Payment ID: {selectedSeller.bannerPayment._id}
                    </p>
                  )}

                  {selectedSeller.bannerPayment.days && (
                    <p className="text-sm">
                      Days: {selectedSeller.bannerPayment.days}
                    </p>
                  )}

                  {selectedSeller.bannerPayment.amount && (
                    <p className="text-sm">
                      Base Amount: ₹{selectedSeller.bannerPayment.amount}
                    </p>
                  )}

                  {selectedSeller.bannerPayment.gst_percentage && (
                    <p className="text-sm text-gray-500">
                      GST ({selectedSeller.bannerPayment.gst_percentage}%): ₹
                      {selectedSeller.bannerPayment.gst_amount}
                    </p>
                  )}

                  {(selectedSeller.bannerPayment.total_amount_paid ||
                    (selectedSeller.bannerPayment.amount &&
                      selectedSeller.bannerPayment.gst_amount)) && (
                      <p className="text-sm font-semibold">
                        Total Paid: ₹
                        {selectedSeller.bannerPayment.total_amount_paid ||
                          selectedSeller.bannerPayment.amount +
                          selectedSeller.bannerPayment.gst_amount}
                      </p>
                    )}
                </>
              )}
            </div>
          ) : isActionLoading && selectedSeller?.user ? (
            <div className="p-3 rounded-lg border mt-5 border-gray-300 bg-gray-50">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-4 w-48 mb-2" />
              {selectedSeller.bannerPayment && (
                <>
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-48 mb-2" />
                </>
              )}
            </div>
          ) : null}
          {!isSearchLoading && !selectedSeller && debouncedSearch && !searchError && (
            <p className="mt-2 text-gray-600">No sellers found</p>
          )}
        </div>

        <AdminBannerPlanManagement
          user={user}
          selectedSeller={selectedSeller}
          setSelectedSeller={setSelectedSeller}
          refetchBannerPayments={refetchBannerPayments}
          actionMode={actionMode}
          isActionLoading={isActionLoading}
          setIsActionLoading={setIsActionLoading}
        />

        {/* Active Banner Purchases */}
        <div className="mt-8">
          <h3 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Active Banner Purchases</h3>
          {isBannerPaymentsLoading || isActionLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <div className="space-y-4">
                {Array.from({ length: limit }).map((_, index) => (
                  <Skeleton key={index} className="h-64 w-full sm:h-16" />
                ))}
              </div>
            </div>
          ) : activeBannerPayments?.data?.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader className="bg-[#0c1f4d]">
                    <TableRow>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Seller Name</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Email</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Phone</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Days</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Amount</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">GST</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Status</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Created At</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeBannerPayments.data.map((payment) => (
                      <TableRow key={payment._id} className="hover:bg-gray-50">
                        <TableCell className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback
                              className="text-white font-bold"
                              style={{
                                backgroundColor: getRandomBg(payment?.user?.name),
                              }}
                            >
                              {payment.user?.name?.[0]?.toUpperCase() || "N"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{payment.user?.name || "N/A"}</span>
                        </TableCell>
                        <TableCell>{payment.user.email}</TableCell>
                        <TableCell>{payment.user.phone || "N/A"}</TableCell>
                        <TableCell>{payment.days}</TableCell>
                        <TableCell className="flex items-center gap-1 font-semibold text-green-600">
                          <IndianRupee className="w-4 h-4" />
                          {payment.total_amount_paid || payment.amount}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          ₹{payment.gst_amount} ({payment.gst_percentage}%)
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.payment_status === "paid"
                                ? "success"
                                : payment.payment_status === "created"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="capitalize"
                          >
                            {payment.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="flex justify-center gap-2">
                          <Button
                            size="icon"
                            className="bg-[#0c1f4d] cursor-pointer text-white hover:bg-[#0c1f4dd9] rounded-full p-2"
                            onClick={() => {
                              setSelectedSeller({ user: payment.user, bannerPayment: payment });
                              setActionMode("upgrade");
                            }}
                            disabled={isRefreshing || isActionLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            className="bg-red-500 cursor-pointer text-white hover:bg-red-600 rounded-full p-2"
                            onClick={() => {
                              setSelectedSeller({ user: payment.user, bannerPayment: payment });
                              setActionMode("cancel");
                            }}
                            disabled={isRefreshing || isActionLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-4">
                {isBannerPaymentsLoading || isActionLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-1/3" />
                    {Array.from({ length: limit }).map((_, index) => (
                      <Skeleton key={index} className="h-32 w-full" />
                    ))}
                  </div>
                ) : activeBannerPayments?.data?.length ? (
                  activeBannerPayments.data.map((payment) => (
                    <Card key={payment._id} className="border rounded-lg shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar>
                            <AvatarFallback
                              className="text-white font-bold"
                              style={{
                                backgroundColor: getRandomBg(payment?.user?.name),
                              }}
                            >
                              {payment.user?.name?.[0]?.toUpperCase() || "N"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{payment.user?.name || "N/A"}</span>
                            <span className="text-xs text-muted-foreground">{payment.user?.role || "Seller"}</span>
                          </div>
                        </div>
                        <p>Email: <span className="font-normal">{payment.user?.email || "N/A"}</span></p>
                        <p>Phone: <span className="font-normal">{payment.user?.phone || "N/A"}</span></p>
                        <p>Days: <span className="font-normal">{payment.days}</span></p>
                        <p>
                          Amount:{" "}
                          <span className="inline-flex items-center gap-1 font-semibold text-green-600">
                            <IndianRupee className="w-4 h-4" />
                            {payment.total_amount_paid || payment.amount}
                          </span>
                        </p>
                        <p>
                          GST:{" "}
                          <span className="text-xs text-gray-500">
                            ₹{payment.gst_amount} ({payment.gst_percentage}%)
                          </span>
                        </p>
                        <p>
                          Status:{" "}
                          <Badge
                            variant={
                              payment.payment_status === "paid"
                                ? "success"
                                : payment.payment_status === "created"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="capitalize"
                          >
                            {payment.payment_status}
                          </Badge>
                        </p>
                        <p>
                          Created At:{" "}
                          <span className="text-sm text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</span>
                        </p>
                        <div className="flex gap-3 mt-3 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSeller({ user: payment.user, bannerPayment: payment });
                              setActionMode("upgrade");
                            }}
                            disabled={isRefreshing || isActionLoading}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedSeller({ user: payment.user, bannerPayment: payment });
                              setActionMode("cancel");
                            }}
                            disabled={isRefreshing || isActionLoading}
                            className="cursor-pointer"
                          >
                            <X className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">No active banner purchases found.</div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end items-center gap-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 1 && !isRefreshing && !isActionLoading) setPage(page - 1);
                          }}
                          className={page === 1 || isRefreshing || isActionLoading ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            isActive={page === i + 1}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isRefreshing && !isActionLoading) setPage(i + 1);
                            }}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      {totalPages > 5 && page < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages && !isRefreshing && !isActionLoading) setPage(page + 1);
                          }}
                          className={page === totalPages || isRefreshing || isActionLoading ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500">No active banner purchases found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerSubscription;