import { useState, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Search, CircleCheck, CircleX, CircleAlert, RefreshCw, Eye } from 'lucide-react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {
  useCheckUserSubscriptionQuery,
  useSearchMerchantsQuery,
} from '@/redux/api/UserTrendingPointSubscriptionApi';
import {
  useGetUserTrustSealStatusQuery,
  useGetTrustSealRequestsQuery,
  useGetTrustSealPriceQuery,
  useGetMerchantTrustSealDetailsQuery,
} from '@/redux/api/TrustSealRequestApi';
import AdminTrustSealPlanManagement from './AdminTrustSealPlanManagement';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import TrustSealCertificate from './TrustSealCertificate';

const AdminTrustSealManagement = () => {
  const { user } = useContext(AuthContext);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTargetUser, setSelectedTargetUser] = useState(null);
  const [page, setPage] = useState(1);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const limit = 10;

  const { data: configData, isLoading: isConfigLoading } = useGetTrustSealPriceQuery();
  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useSearchMerchantsQuery(debouncedSearch, { skip: !debouncedSearch || debouncedSearch.length < 3 });
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCheckUserSubscriptionQuery(selectedTargetUser?._id, { skip: !selectedTargetUser });
  const { data: trustSealData, isLoading: isTrustSealLoading, isFetching: isTrustSealFetching, refetch: refetchTrustSeal } = useGetUserTrustSealStatusQuery(selectedTargetUser?._id, { skip: !selectedTargetUser });
  const { data: activeRequestsData, isLoading: isActiveRequestsLoading, isFetching: isActiveRequestsFetching, refetch: refetchActiveRequests } = useGetTrustSealRequestsQuery({
    page,
    limit,
    status: 'verified',
  });
  const { data: merchantDetails, isLoading: isMerchantDetailsLoading } = useGetMerchantTrustSealDetailsQuery({ userId: selectedTargetUser?._id }, { skip: !selectedTargetUser || !isCertificateModalOpen });

  const trustSealAmount = configData?.data?.price || 500;

  const handleTrustSealRefresh = async () => {
    await Promise.all([refetchTrustSeal(), refetchActiveRequests()]);
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

  const paginatedData = activeRequestsData?.data || [];
  const totalPages = activeRequestsData ? Math.ceil(activeRequestsData.total / limit) : 1;

  // Format date to professional style
  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy, HH:mm');
  };

  // Map status to badge variants and icons
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
            <CircleCheck className="w-4 h-4" /> Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <CircleAlert className="w-4 h-4" /> Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <CircleX className="w-4 h-4" /> Rejected
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
    <div className={`${isSidebarOpen ? 'lg:p-6 lg:ml-56' : 'lg:p-4 lg:ml-16'}`}>
      <div className=" mb-3 sm:mb-10">
        <h2 className="text-md border-1 border-[#0c1f4d] w-fit text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Admin Trust Seal Management</h2>
        <p className="text-gray-600 font-bold mt-2 text-sm sm:text-base">Manage trust seals for merchants. Cost: ₹{trustSealAmount.toFixed(2)}.</p>
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
          {isSubscriptionLoading || isTrustSealLoading || isTrustSealFetching ? (
            <div className="flex justify-center items-center p-4 sm:p-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="ml-3 h-4 w-48" />
            </div>
          ) : (
            <>
              {!subscriptionData?.hasSubscription && (
                <p className="text-red-600 mt-2 mb-4 text-sm sm:text-base">This merchant does not have an active subscription.</p>
              )}
              <AdminTrustSealPlanManagement
                targetUser={selectedTargetUser}
                hasSubscription={subscriptionData?.hasSubscription}
                trustSealRequest={trustSealData?.trustSealRequest}
                onRefresh={handleTrustSealRefresh}
                trustSealAmount={trustSealAmount}
                subscriptionId={subscriptionData?.subscriptionId}
              />
              {trustSealData?.trustSealRequest?.status === 'verified' && (
                <Dialog open={isCertificateModalOpen} onOpenChange={setIsCertificateModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="mt-4 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Trust Seal Certificate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Trust Seal Certificate</DialogTitle>
                    </DialogHeader>
                    {isMerchantDetailsLoading ? (
                      <div className="flex justify-center items-center p-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    ) : (
                      <TrustSealCertificate
                        companyName={merchantDetails?.companyName || selectedTargetUser.name}
                        address={merchantDetails?.address?.fullAddress || 'N/A'}
                        director={merchantDetails?.director || 'N/A'}
                        gstin={merchantDetails?.gstin || 'N/A'}
                        iec={merchantDetails?.iec || 'N/A'}
                        mobile={selectedTargetUser?.phone || 'N/A'}
                        email={selectedTargetUser.email || 'N/A'}
                        issueDate={trustSealData?.trustSealRequest?.issueDate || new Date()}
                        expiryDate={trustSealData?.trustSealRequest?.expiryDate || new Date()}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </>
      )}

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Active Trust Seal Users</h3>
          {/* <Button
            variant="outline"
            size="sm"
            onClick={handleTrustSealRefresh}
            className="flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button> */}
        </div>
        {isActiveRequestsLoading || isActiveRequestsFetching ? (
          <div className="space-y-4">
            {Array.from({ length: limit }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full sm:h-16" />
            ))}
          </div>
        ) : paginatedData?.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-[#0c1f4d]">
                  <TableRow >
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Name</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Email</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Contact</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Amount (₹)</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Status</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Payment Status</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Created At</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Updated At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((request) => (
                    <TableRow
                      key={request._id}
                      onClick={() => handleSelectUser(request.user_id)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={request.user_id?.avatarUrl} alt={request.user_id?.name} />
                            <AvatarFallback>
                              {request.user_id?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{request.user_id?.name || 'Unnamed'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{request.user_id?.email}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{request.user_id?.phone}</TableCell>
                      <TableCell
                        className={`text-xs sm:text-sm font-medium ${request.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {request.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{getPaymentStatusBadge(request.payment_status || 'Paid')}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{formatDate(request.created_at)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{formatDate(request.updated_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
              {paginatedData.map((request) => (
                <Card
                  key={request._id}
                  onClick={() => handleSelectUser(request.user_id)}
                  className="border rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={request.user_id?.avatarUrl} alt={request.user_id?.name} />
                        <AvatarFallback>
                          {request.user_id?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{request.user_id?.name || 'Unnamed'}</span>
                        <span className="text-xs text-gray-500">{request.user_id?.email}</span>
                      </div>
                    </div>
                    <p className="text-sm">Contact: <span className="font-normal">{request.user_id?.phone || 'N/A'}</span></p>
                    <p className="text-sm">
                      Amount: <span className={`font-medium ${request.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{request.amount.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-sm">Status: {getStatusBadge(request.status)}</p>
                    <p className="text-sm">Payment Status: {getPaymentStatusBadge(request.payment_status || 'Paid')}</p>
                    <p className="text-sm">Created At: <span className="font-normal">{formatDate(request.created_at)}</span></p>
                    <p className="text-sm">Updated At: <span className="font-normal">{formatDate(request.updated_at)}</span></p>
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
          <p className="text-center text-gray-600 text-sm sm:text-base">No active trust seal users found.</p>
        )}
      </div>
    </div>
  );
};

export default AdminTrustSealManagement;
