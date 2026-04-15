import { useContext, useEffect, useState } from 'react';
import { useGetCouponsQuery } from '@/redux/api/couponsNotificationApi';
import { useGetUserByIdQuery } from '@/redux/api/SubDealerApi';
import { useGetUsersForWalletQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Wallet, ArrowLeft, Banknote, ShieldAlert } from 'lucide-react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import showToast from '@/toast/showToast';
import RedeemPointsForm from './RedeemPointsForm';
import CashRedeemPointsForm from './CashRedeemPointsForm';
import Loader from '@/loader/Loader';

const WalletPage = () => {
  const { user } = useContext(AuthContext);
  const adminId = user?.user?._id;
  const { isSidebarOpen } = useSidebar();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [openRedeemDialog, setOpenRedeemDialog] = useState(false);

  // Choice state: 'choice', 'cash', or 'coupon'
  const [selectionMode, setSelectionMode] = useState('choice');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch search results
  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useGetUsersForWalletQuery(debouncedSearch, {
    skip: !debouncedSearch || debouncedSearch.length < 3,
  });

  // Fetch selected user details
  const { data: merchantData, isLoading, isError } = useGetUserByIdQuery(selectedSeller?._id, {
    skip: !selectedSeller,
  });

  const { data: couponsData, isLoading: couponsLoading } = useGetCouponsQuery();

  // Update selected seller when search results change
  useEffect(() => {
    if (searchResults?.user) {
      setSelectedSeller(searchResults.user);
    } else {
      setSelectedSeller(null);
    }
  }, [searchResults]);

  const handleRedeemSuccess = () => {
    setOpenRedeemDialog(false);
    setSelectionMode('choice');
    showToast('Points redeemed successfully', 'success');
  };

  const handleRedeemClick = () => {
    if (selectedSeller?.role === 'STUDENT') {
      setSelectionMode('choice');
    } else {
      setSelectionMode('coupon');
    }
    setOpenRedeemDialog(true);
  };

  const handleDialogChange = (open) => {
    setOpenRedeemDialog(open);
    if (!open) setSelectionMode('choice');
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Admin Wallet Management</h2>
        
        <Card className="mb-6 shadow-md border-0 bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-3 text-[#0c1f4d]">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-blue-100 p-1.5 rounded-lg"><Wallet className="h-5 w-5" /></span>
              Search User / Seller
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Search by email or phone number"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="mb-4 border-2 focus:ring-[#0c1f4d]"
            />
            {isSearchLoading ? (
              <Loader contained label="Searching our records..." />
            ) : searchError ? (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
                <ShieldAlert size={18} />
                Error: {searchError?.data?.message || 'Failed to fetch results'}
              </div>
            ) : searchResults?.user ? (
              <div className="space-y-2">
                <div
                  className={`p-4 border-2 transition-all cursor-pointer rounded-xl flex items-center justify-between group ${selectedSeller?._id === searchResults.user._id ? 'bg-blue-50 border-[#0c1f4d]' : 'hover:bg-gray-50 border-transparent hover:border-gray-200'}`}
                  onClick={() => setSelectedSeller(searchResults.user)}
                >
                  <div className="flex items-center gap-4">
                     <div className="bg-[#0c1f4d] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                        {searchResults.user.name.charAt(0)}
                     </div>
                     <div>
                        <p className="font-bold text-gray-800">{searchResults.user.name}</p>
                        <div className="flex gap-4 mt-0.5">
                           <p className="text-xs text-muted-foreground font-medium">Email: {searchResults.user.email}</p>
                           <p className="text-xs text-muted-foreground font-medium">Phone: {searchResults.user.phone || 'N/A'}</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${searchResults.user.role === 'STUDENT' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {searchResults.user.role}
                     </span>
                  </div>
                </div>
              </div>
            ) : debouncedSearch ? (
              <p className="text-sm text-center py-4 text-muted-foreground italic">No users found matching your search</p>
            ) : null}
          </CardContent>
        </Card>

        {selectedSeller && (
          <Card className="shadow-lg border-0 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle className="text-[#0c1f4d] flex items-center justify-between">
                <span>Account Overview</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                  {selectedSeller.role}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {isLoading ? (
                <Loader contained label="Retrieving account data..." />
              ) : isError ? (
                <p className="text-red-500 font-medium text-center">Failed to load detailed account info</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</p>
                      <p className="text-sm font-bold text-gray-800">{merchantData?.user?.name || selectedSeller.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                      <p className="text-sm font-bold text-gray-800">{merchantData?.user?.email || selectedSeller.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Number</p>
                      <p className="text-sm font-bold text-gray-800">{merchantData?.user?.phone || selectedSeller.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                    <div className="flex-1 flex items-center gap-4 p-5 rounded-2xl shadow-xl bg-gradient-to-br from-[#0c1f4d] via-blue-900 to-indigo-900 text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Wallet size={120} />
                      </div>
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                        <Wallet className="h-6 w-6 text-white" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-blue-200">Available Points</p>
                        <p className="text-3xl font-black">{ (merchantData?.user?.wallet_points || selectedSeller.wallet_points || 0).toLocaleString() }</p>
                      </div>
                    </div>

                    <Button
                      className="md:w-64 cursor-pointer h-full bg-[#0c1f4d] hover:bg-[#0c204d] text-white font-bold text-sm py-8 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                      onClick={handleRedeemClick}
                      disabled={(merchantData?.user?.wallet_points || selectedSeller.wallet_points || 0) < 500}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">Redeem Points</span>
                        <span className="text-[10px] font-normal group-hover:text-blue-200 transition-colors">Start Redemption Flow</span>
                      </div>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={openRedeemDialog} onOpenChange={handleDialogChange}>
          <DialogContent className="sm:max-w-md bg-white rounded-3xl overflow-hidden border-0 shadow-2xl">
            <DialogHeader className="p-4 border-b bg-gray-50/50">
              <DialogTitle className="text-[#0c1f4d] font-bold text-xl flex items-center gap-2">
                {selectionMode === 'choice' ? 'Redemption Method' : 'Process Redemption'}
              </DialogTitle>
              <p className="text-xs text-gray-500 font-medium tracking-tight">Managing points for {selectedSeller?.name}</p>
            </DialogHeader>

            <div className="p-4">
              {selectionMode === 'choice' ? (
                <div className="grid grid-cols-2 gap-4 py-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <Button
                    variant="outline"
                    className="h-40 cursor-pointer flex flex-col gap-3 border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 rounded-2xl transition-all group shadow-sm"
                    onClick={() => setSelectionMode('cash')}
                  >
                    <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-500 group-hover:text-white transition-colors text-green-600">
                      <Banknote className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-gray-800 block">Redeem as Cash</span>
                      <span className="text-[10px] text-gray-400 font-medium">Direct Bank / UPI</span>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-40 cursor-pointer flex flex-col gap-3 border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 rounded-2xl transition-all group shadow-sm"
                    onClick={() => setSelectionMode('coupon')}
                  >
                    <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-600">
                      <ShieldAlert className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-gray-800 block">Redeem Coupon</span>
                      <span className="text-[10px] text-gray-400 font-medium">Merchant Vouchers</span>
                    </div>
                  </Button>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {selectedSeller?.role === 'STUDENT' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectionMode('choice')}
                      className="mb-6 cursor-pointer text-blue-600 bg-blue-50 hover:bg-blue-100 flex gap-2 items-center rounded-full px-4 font-bold text-xs"
                    >
                      <ArrowLeft size={16} /> Back to Methods
                    </Button>
                  )}

                  {selectionMode === 'coupon' ? (
                    couponsLoading ? (
                      <Loader contained label="Fetching Coupons..." />
                    ) : (
                      <RedeemPointsForm
                        adminId={adminId}
                        userId={selectedSeller?._id}
                        coupons={couponsData?.data || []}
                        walletPoints={merchantData?.user?.wallet_points || selectedSeller?.wallet_points || 0}
                        onSuccess={handleRedeemSuccess}
                      />
                    )
                  ) : (
                    <CashRedeemPointsForm
                      adminId={adminId}
                      userId={selectedSeller?._id}
                      walletPoints={merchantData?.user?.wallet_points || selectedSeller?.wallet_points || 0}
                      onSuccess={handleRedeemSuccess}
                    />
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WalletPage;