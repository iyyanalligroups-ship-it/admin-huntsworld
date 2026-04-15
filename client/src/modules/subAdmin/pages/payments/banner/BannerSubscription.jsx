import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useGetAllActiveBannerPaymentsQuery } from '@/redux/api/BannerPaymentApi';
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { useGetUserBySearchQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMode, setActionMode] = useState(null);
  const limit = 5;

  // Get user ID from AuthContext
  const userId = user?.user?._id;

  // Fetch current user permissions
  const { data: currentUser, isError: isUserError, error: userError, refetch: refetchUser } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check permissions for the current page
  const currentPagePath = "payments/banners";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions?.includes("edit") || false;
  const canDelete = pagePermissions?.actions?.includes("delete") || false;

  // Log permission errors
  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
  }

  // Debounce search input (1 second = 1000ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Search seller by email or phone
  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useGetUserBySearchQuery(debouncedSearch, {
    skip: !debouncedSearch || debouncedSearch.length < 3,
  });

  // Handle search results
  useEffect(() => {
    if (searchResults?.user) {
      setSelectedSeller({ user: searchResults.user, bannerPayment: null });
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

  // Handle component refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchBannerPayments(), refetchUser()]);
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
    <div className={`flex-1 p-4 transition-all duration-300`}>
      <div className="lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold w-fit">
            Manage Banner Subscriptions
          </h2>
          <Button
            onClick={handleRefresh}
            className="bg-[#0c1f4d] hover:bg-[#0c1f4dd0] cursor-pointer text-white w-full sm:w-auto"
            disabled={isRefreshing || isActionLoading}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Error Message for Permissions */}
        {isUserError && (
          <div className="p-4 text-red-500 mb-4 bg-red-50 rounded-lg">
            Failed to load user permissions
            <button onClick={refetchUser} className="underline ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Search Input */}
        <div className="mb-6 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="searchInput" className="text-gray-700 text-sm font-medium">Search Seller by Email or Phone</Label>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="searchInput"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (e.target.value.trim()) {
                    setSelectedSeller(prev => ({ user: prev?.user, bannerPayment: null }));
                    setActionMode("purchase");
                  }
                }}
                placeholder="Search by email or phone..."
                className="pl-9 pr-3 py-2 rounded-lg focus-visible:ring-gray-200 bg-gray-100 text-sm"
                disabled={isRefreshing || isActionLoading}
              />
            </div>
          </div>

          {isSearchLoading && (
            <div className="mt-2">
              <Skeleton className="h-4 w-32" />
            </div>
          )}

          {selectedSeller?.user && !isActionLoading && (
            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-100">
                  <AvatarFallback
                    className="text-white font-bold text-lg"
                    style={{ backgroundColor: getRandomBg(selectedSeller.user.name) }}
                  >
                    {selectedSeller.user?.name?.[0]?.toUpperCase() || "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-[#0c1f4d]">{selectedSeller.user.name || "N/A"}</p>
                  <p className="text-xs text-gray-500">{selectedSeller.user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm pt-2 border-t border-gray-50">
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium">{selectedSeller.user.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-gray-500">Role:</span>
                  <Badge variant="outline" className="capitalize text-[10px] sm:text-xs">
                    {selectedSeller.user.role}
                  </Badge>
                </div>
                {selectedSeller.bannerPayment && (
                  <>
                    <div className="flex justify-between sm:justify-start sm:gap-4">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium text-blue-600">{selectedSeller.bannerPayment.days} Days</span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-4">
                      <span className="text-gray-500">Current Amount:</span>
                      <span className="font-semibold text-green-600 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {selectedSeller.bannerPayment.total_amount_paid || selectedSeller.bannerPayment.amount}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {!isSearchLoading && !selectedSeller && debouncedSearch && !searchError && (
            <p className="mt-2 text-gray-600 text-sm italic">No sellers found matching "{debouncedSearch}"</p>
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
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold w-fit">
              Active Banner Purchases
            </h3>
            {activeBannerPayments?.total && (
              <Badge variant="secondary" className="bg-[#0c1f4d] text-white">
                {activeBannerPayments.total} Records
              </Badge>
            )}
          </div>

          {isBannerPaymentsLoading || isActionLoading ? (
            <div className="space-y-4">
              {Array.from({ length: limit }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : activeBannerPayments?.data?.length > 0 ? (
            <>
              {/* Desktop view */}
              <div className="hidden lg:block">
                <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-bold text-[#0c1f4d]">Seller Info</TableHead>
                        <TableHead className="font-bold text-[#0c1f4d]">Contact</TableHead>
                        <TableHead className="font-bold text-[#0c1f4d]">Days</TableHead>
                        <TableHead className="font-bold text-[#0c1f4d]">Amount</TableHead>
                        <TableHead className="font-bold text-[#0c1f4d]">Status</TableHead>
                        <TableHead className="font-bold text-[#0c1f4d]">Created At</TableHead>
                        <TableHead className="text-center font-bold text-[#0c1f4d]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeBannerPayments.data.map((payment) => (
                        <TableRow key={payment._id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback
                                className="text-white font-bold text-xs"
                                style={{ backgroundColor: getRandomBg(payment?.user?.name) }}
                              >
                                {payment.user?.name?.[0]?.toUpperCase() || "N"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm">{payment.user?.name || "N/A"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-gray-600 space-y-0.5">
                              <p>{payment.user.email || "N/A"}</p>
                              <p>{payment.user.phone || "N/A"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50/30">
                              {payment.days} Days
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-0.5 font-bold text-green-600">
                              <IndianRupee className="w-3.5 h-3.5" />
                              {payment.total_amount_paid || payment.amount}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.payment_status === "paid" ? "success" :
                                  payment.payment_status === "created" ? "secondary" : "destructive"
                              }
                              className="capitalize text-[10px]"
                            >
                              {payment.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                size="icon"
                                className="h-8 w-8 bg-[#0c1f4d] cursor-pointer text-white hover:bg-[#0c1f4dd9] rounded-lg shadow-sm"
                                onClick={() => {
                                  setSelectedSeller({ user: payment.user, bannerPayment: payment });
                                  setActionMode("upgrade");
                                }}
                                disabled={isRefreshing || isActionLoading || !canEdit}
                                title={canEdit ? "Upgrade banner subscription" : "No edit permission"}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                className="h-8 w-8 bg-red-500 cursor-pointer text-white hover:bg-red-600 rounded-lg shadow-sm"
                                onClick={() => {
                                  setSelectedSeller({ user: payment.user, bannerPayment: payment });
                                  setActionMode("cancel");
                                }}
                                disabled={isRefreshing || isActionLoading || !canDelete}
                                title={canDelete ? "Cancel banner subscription" : "No delete permission"}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile view */}
              <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBannerPayments.data.map((payment) => (
                  <div key={payment._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback
                            className="text-white font-bold"
                            style={{ backgroundColor: getRandomBg(payment?.user?.name) }}
                          >
                            {payment.user?.name?.[0]?.toUpperCase() || "N"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-[#0c1f4d] text-sm">{payment.user?.name || "N/A"}</p>
                          <Badge variant={payment.payment_status === "paid" ? "success" : "destructive"} className="text-[10px] h-5">
                            {payment.payment_status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          className="h-8 w-8 bg-[#0c1f4d] text-white rounded-lg"
                          onClick={() => {
                            setSelectedSeller({ user: payment.user, bannerPayment: payment });
                            setActionMode("upgrade");
                          }}
                          disabled={isRefreshing || isActionLoading || !canEdit}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          className="h-8 w-8 bg-red-500 text-white rounded-lg"
                          onClick={() => {
                            setSelectedSeller({ user: payment.user, bannerPayment: payment });
                            setActionMode("cancel");
                          }}
                          disabled={isRefreshing || isActionLoading || !canDelete}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-gray-50">
                      <div>
                        <p className="text-gray-500 mb-0.5">Email</p>
                        <p className="font-medium truncate">{payment.user.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Phone</p>
                        <p className="font-medium">{payment.user.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Duration</p>
                        <p className="font-medium text-blue-600">{payment.days} Days</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Amount</p>
                        <p className="font-bold text-green-600 flex items-center gap-0.5">
                          <IndianRupee className="w-3 h-3" />
                          {payment.total_amount_paid || payment.amount}
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400 text-right italic">
                      Created: {new Date(payment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl p-10 text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-500 font-medium italic">No active banner purchases found.</p>
            </div>
          )}

          {activeBannerPayments?.data?.length > 0 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1 && !isRefreshing && !isActionLoading) setPage(page - 1);
                      }}
                      className={page === 1 || isRefreshing || isActionLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => {
                    const pageNum = i + 1;
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 1 && pageNum <= page + 1)) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            isActive={page === pageNum}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isRefreshing && !isActionLoading) setPage(pageNum);
                            }}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages && !isRefreshing && !isActionLoading) setPage(page + 1);
                      }}
                      className={page === totalPages || isRefreshing || isActionLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerSubscription;