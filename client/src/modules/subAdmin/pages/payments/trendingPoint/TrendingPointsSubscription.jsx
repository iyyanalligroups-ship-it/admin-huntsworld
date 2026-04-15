import { useState, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Search, CircleCheck, CircleX, CircleAlert, RefreshCw } from 'lucide-react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {
  useGetTrendingPointsConfigQuery,
  useCheckUserSubscriptionQuery,
  useGetAllActiveTrendingPointUsersQuery,
  useSearchMerchantsQuery,
  useGetActiveTrendingPointsQuery,
} from '@/redux/api/UserTrendingPointSubscriptionApi';
import AdminTrendingPointsPlanManagement from './TrendingPointsPlanManagement';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import FreeTrendPointManagement from './FreeTrendPointManagement';

const AdminTrendingPointsManagement = () => {
  const { user } = useContext(AuthContext);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTargetUser, setSelectedTargetUser] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: configData, isLoading: isConfigLoading } = useGetTrendingPointsConfigQuery();
  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useSearchMerchantsQuery(debouncedSearch, { skip: !debouncedSearch || debouncedSearch.length < 3 });
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCheckUserSubscriptionQuery(selectedTargetUser?._id, { skip: !selectedTargetUser });
  const { data: activeTrendingPointsData, isLoading: isTrendingPointsLoading, isFetching, refetch } = useGetActiveTrendingPointsQuery(selectedTargetUser?._id, { skip: !selectedTargetUser });
  const { data: activeUsersData, isLoading: isActiveUsersLoading, refetch: refetchActiveUsers } = useGetAllActiveTrendingPointUsersQuery();

  const pointRate = configData?.pointRate || 45 / 100;
  console.log(searchResults, 'search results');

  const handleTrendingPointsRefresh = async () => {
    await refetch();
  };

  const handleActiveUsersRefresh = async () => {
    await refetchActiveUsers();
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(handler);
  }, [search]);

  // Set selected user based on search results
  useEffect(() => {
    if (searchResults?.length > 0) {
      setSelectedTargetUser(searchResults[0]);
    } else {
      setSelectedTargetUser(null);
    }
  }, [searchResults]);

  const handleSelectUser = (user) => {
    setSelectedTargetUser(user);
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const paginatedData = activeUsersData?.data
    ? activeUsersData.data.slice((page - 1) * limit, page * limit)
    : [];
  const totalPages = activeUsersData ? Math.ceil(activeUsersData.total / limit) : 1;

  // Format date to professional style
  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy, HH:mm');
  };

  // Map status to badge variants and icons
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
            <CircleCheck className="w-4 h-4" /> Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 flex items-center gap-1">
            <CircleX className="w-4 h-4" /> Inactive
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CircleAlert className="w-4 h-4" /> {status || 'Unknown'}
          </Badge>
        );
    }
  };

  // Map payment status to badge variants and icons
  const getPaymentStatusBadge = (paymentStatus) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <CircleCheck className="w-4 h-4" /> Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <CircleAlert className="w-4 h-4" /> Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <CircleX className="w-4 h-4" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CircleAlert className="w-4 h-4" /> {paymentStatus || 'Unknown'}
          </Badge>
        );
    }
  };

  if (isConfigLoading || !user) {
    return (
      <div className="flex justify-center items-center p-4 sm:p-6 bg-[#f0f4f6] rounded-xl min-h-[200px]">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="ml-3 h-4 w-48" />
      </div>
    );
  }

  return (
    <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>
      <div className="mb-6 sm:mb-10">
        <h2 className="text-md border-1 w-fit border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Sub-Admin Trending Points Management</h2>
        <p className="text-gray-600 mt-2 text-sm sm:text-base font-bold">Manage trending points for merchants. Cost: ₹{pointRate.toFixed(2)} per point.</p>
      </div>
      <div className="relative mb-6 sm:max-w-lg">
        <Input
          placeholder="Search merchant by email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 text-sm sm:text-base"
        />
        <Search className="absolute right-3 top-2.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        {isSearchLoading && <Skeleton className="h-4 w-32 mt-2" />}
        {debouncedSearch.length >= 3 && (
          <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-60 overflow-auto">
            {isSearchLoading ? (
              <li className="p-2 text-gray-500 text-center text-sm sm:text-base">Loading...</li>
            ) : searchResults ? (
              searchResults.user ? (
                <li
                  key={searchResults.user._id}
                  className="p-2 hover:bg-gray-100 cursor-pointer flex items-center text-sm sm:text-base"
                  onClick={() => handleSelectUser(searchResults.user)}
                >
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <span>{searchResults.user.name || 'Unnamed'} ({searchResults.user.email})</span>
                    <span className="text-sm text-gray-500">{searchResults.user.phone}</span>
                  </div>
                </li>
              ) : (
                <li className="p-2 text-gray-500 text-center text-sm sm:text-base">
                  {searchResults.message === "No users found with role MERCHANT or SERVICE_PROVIDER"
                    ? "No merchants found matching your search."
                    : "No results found"}
                </li>
              )
            ) : searchError ? (
              <li className="p-2 text-gray-500 text-center text-sm sm:text-base">
                {searchError?.data?.message === "No users found with role MERCHANT or SERVICE_PROVIDER"
                  ? "No merchants found matching your search."
                  : "Error fetching results"}
              </li>
            ) : (
              <li className="p-2 text-gray-500 text-center text-sm sm:text-base">No results found</li>
            )}
          </ul>
        )}
      </div>

      {selectedTargetUser && (
        <>
          <h3 className="text-lg sm:text-xl font-semibold text-[#0c1f4d] mb-4">
            Managing for {selectedTargetUser.name || selectedTargetUser.email}
          </h3>
          {isSubscriptionLoading || isTrendingPointsLoading || isFetching ? (
            <div className="flex justify-center items-center p-4 sm:p-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="ml-3 h-4 w-48" />
            </div>
          ) : (
            <>
              {!subscriptionData?.hasSubscription && (
                <p className="text-red-600 mt-2 mb-4 text-sm sm:text-base">This merchant does not have an active subscription.</p>
              )}
              <AdminTrendingPointsPlanManagement
                targetUser={selectedTargetUser}
                hasSubscription={subscriptionData?.hasSubscription}
                subscriptionId={subscriptionData?.subscriptionId}
                activeTrendingPointsPayment={activeTrendingPointsData?.trendingPointsPayment}
                pendingTrendingPointsPayment={activeTrendingPointsData?.pendingTrendingPointsPayment}
                onRefresh={handleTrendingPointsRefresh}
                pointRate={pointRate}
              />

              <FreeTrendPointManagement
                targetUser={selectedTargetUser}
                hasSubscription={subscriptionData?.hasSubscription}
                subscriptionId={subscriptionData?.subscriptionId}
                activeTrendingPointsPayment={activeTrendingPointsData?.trendingPointsPayment}
                pendingTrendingPointsPayment={activeTrendingPointsData?.pendingTrendingPointsPayment}
                onRefresh={handleTrendingPointsRefresh}
                pointRate={pointRate}
              />

            </>
          )}
        </>
      )}

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Active Trending Points Users</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleActiveUsersRefresh}
            className="flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        {isActiveUsersLoading ? (
          <div className="space-y-4">
            {Array.from({ length: limit }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full sm:h-16" />
            ))}
          </div>
        ) : paginatedData?.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block w-full overflow-x-auto">
              <Table className="min-w-[400px]">

                {/* Table Header */}
                <TableHeader className="bg-[#0c1f4d]">
                  <TableRow>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                      Name
                    </TableHead>

                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                      Email
                    </TableHead>

                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                      Contact
                    </TableHead>

                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                      Points
                    </TableHead>

                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                      Amount (₹)
                    </TableHead>

                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                      Status
                    </TableHead>

                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                      Payment Status
                    </TableHead>

                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                      Created At
                    </TableHead>

                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                      Updated At
                    </TableHead>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody>
                  {paginatedData.map((payment) => (
                    <TableRow
                      key={payment._id}
                      onClick={() => handleSelectUser(payment.user_id)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >

                      {/* Name */}
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {payment.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">
                              {payment.name || "Unnamed"}
                            </span>
                            <span className="text-xs text-gray-500">
                              Company: {payment.company_name}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-xs sm:text-sm">
                        {payment.company_email || "-"}
                      </TableCell>

                      {/* Contact */}
                      <TableCell className="text-xs sm:text-sm">
                        {payment.company_phone_number || "-"}
                      </TableCell>

                      {/* Points */}
                      <TableCell className="text-xs sm:text-sm">
                        {payment.points}
                      </TableCell>

                      {/* Amount */}
                      <TableCell
                        className={`text-xs sm:text-sm font-medium ${payment.amount > 0 ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        ₹{payment.amount?.toFixed(2)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-xs sm:text-sm">
                        {getStatusBadge(payment.status)}
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell className="text-xs sm:text-sm">
                        {getPaymentStatusBadge(payment.payment_status)}
                      </TableCell>

                      {/* Created */}
                      <TableCell className="text-xs sm:text-sm">
                        {formatDate(payment.created_at)}
                      </TableCell>

                      {/* Updated */}
                      <TableCell className="text-xs sm:text-sm">
                        {formatDate(payment.updated_at)}
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>

              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
              {paginatedData.map((payment) => (
                <Card
                  key={payment._id}
                  onClick={() => handleSelectUser(payment.user_id)}
                  className="border rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={payment?.avatarUrl} alt={payment?.name} />
                        <AvatarFallback>
                          {payment?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{payment?.name || 'Unnamed'}</span>
                        <span className="text-xs text-gray-500">{payment?.company_name}</span>
                      </div>
                    </div>
                    <p className="text-sm">Email: <span className="font-normal">{payment?.company_email || 'N/A'}</span></p>
                    <p className="text-sm">Points: <span className="font-normal">{payment.points}</span></p>
                    <p className="text-sm">
                      Amount: <span className={`font-medium ${payment.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{payment.amount.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-sm">Status: {getStatusBadge(payment.status)}</p>
                    <p className="text-sm">Payment Status: {getPaymentStatusBadge(payment.payment_status)}</p>
                    <p className="text-sm">Created At: <span className="font-normal">{formatDate(payment.created_at)}</span></p>
                    <p className="text-sm">Updated At: <span className="font-normal">{formatDate(payment.updated_at)}</span></p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-end items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white w-8 h-8 sm:w-10 sm:h-10"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNumber = i + 1 + Math.max(0, page - 3);
                    if (pageNumber > totalPages) return null;
                    return (
                      <Button
                        key={pageNumber}
                        variant={page === pageNumber ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        className={page === pageNumber ? 'bg-[#0c1f4d] text-white' : 'text-[#0c1f4d]'}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && page < totalPages - 2 && (
                    <span className="text-sm font-medium">...</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white w-8 h-8 sm:w-10 sm:h-10"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-600 text-sm sm:text-base">No active trending points users found.</p>
        )}
      </div>

    </div>
  );
};

export default AdminTrendingPointsManagement;