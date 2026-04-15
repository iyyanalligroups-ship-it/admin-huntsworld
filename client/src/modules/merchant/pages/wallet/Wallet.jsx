

import { useContext, useState } from 'react';
import { useGetCouponsQuery } from '@/redux/api/couponsNotificationApi';
import { useGetUserByIdQuery } from '@/redux/api/SubDealerApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RedeemPointsForm from './RedeemPointsForm';
import showToast from '@/toast/showToast';
import { Loader2,Wallet } from 'lucide-react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';

const WalletPage = ({ merchantId }) => {
  const { isSidebarOpen } = useSidebar();
  const [openRedeemDialog, setOpenRedeemDialog] = useState(false);
  const { user } = useContext(AuthContext)
  const { data: merchantData, isLoading, isError } = useGetUserByIdQuery(user?.user?._id);
  const merchant = merchantData?.user || { name: 'N/A', email: 'N/A', phone: 'N/A', wallet_points: 0 };

  const { data: couponsData, isLoading: couponsLoading } = useGetCouponsQuery();
  const handleRedeemSuccess = () => {
    setOpenRedeemDialog(false);
    showToast('Points redeemed successfully', 'success');
  };

  return (
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'} transition-all duration-300`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-[#0c1f4d]">Merchant Wallet</h2>
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="ml-2">Loading merchant details...</p>
          </div>
        ) : isError ? (
          <p className="text-red-500">Failed to load merchant details</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Merchant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{merchant.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{merchant.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">{merchant.phone || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl shadow-md bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-wide uppercase">Wallet Points</p>
                    <p className="text-xl font-bold">{merchant.wallet_points ?? 0}</p>
                  </div>
                </div>
              </div>
              <Button className="flex-1 bg-[#0c1f4d] text-white text-sm py-2 rounded hover:bg-[#0c1f4dd0] transition cursor-pointer" onClick={() => setOpenRedeemDialog(true)} disabled={merchant.wallet_points < 500}>
                Redeem Points
              </Button>
            </CardContent>
          </Card>
        )}
        <Dialog open={openRedeemDialog} onOpenChange={setOpenRedeemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redeem Points</DialogTitle>
            </DialogHeader>
            {couponsLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="ml-2">Loading coupons...</p>
              </div>
            ) : (
              <RedeemPointsForm
                merchantId={merchantId}
                coupons={couponsData?.data || []}
                walletPoints={merchant.wallet_points}
                onSuccess={handleRedeemSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WalletPage;