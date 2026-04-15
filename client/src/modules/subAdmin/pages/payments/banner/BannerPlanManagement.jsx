import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import {
  useCreateBannerOrderMutation,
  useVerifyBannerPaymentMutation,
  useUpgradeBannerMutation,
  useCancelBannerMutation,
  useCheckUserSubscriptionQuery,
} from '@/redux/api/BannerPaymentApi';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import { useGetBannerAdAmountQuery } from '@/redux/api/CommonSubscriptionPlanApi';
import showToast from '@/toast/showToast';
import { ShoppingCart, ArrowUpCircle, XCircle } from "lucide-react";

const BannerPlanManagement = ({ user, selectedSeller, refetchBannerPayments,
  setSelectedSeller,
  actionMode,
  isActionLoading,
  setIsActionLoading,
}) => {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [days, setDays] = useState('');
  const [amount, setAmount] = useState(0);

  const [createBannerOrder] = useCreateBannerOrderMutation();
  const [verifyBannerPayment] = useVerifyBannerPaymentMutation();
  const [upgradeBanner] = useUpgradeBannerMutation();
  const [cancelBanner] = useCancelBannerMutation();
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCheckUserSubscriptionQuery(selectedSeller?.user?._id, {
    skip: !selectedSeller?.user?._id,
  });
  const { data: bannerAmountData } = useGetBannerAdAmountQuery();

  const perDayPrice = bannerAmountData?.data?.price || 20; // Fallback to 20 if lookup fails

  const hasSubscription = subscriptionData?.hasSubscription;
  const subscriptionId = subscriptionData?.subscriptionId;

  const handleDaysChange = (e) => {
    const inputDays = parseInt(e.target.value, 10);
    if (!isNaN(inputDays) && inputDays > 0) {
      setDays(inputDays);
      setAmount(inputDays * perDayPrice);
    } else {
      setDays('');
      setAmount(0);
    }
  };

  const handlePurchase = async () => {
    try {
      if (!days || !amount) throw new Error('Please specify the number of days');
      if (!selectedSeller?.user?._id) throw new Error('No seller selected');
      if (!hasSubscription) throw new Error('No active subscription found for the seller');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }

      const { order, bannerPayment } = await createBannerOrder({
        user_id: selectedSeller.user._id,
        days,
        amount,
        subscription_id: subscriptionId,
      }).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Banner Subscription Payment',
        description: `Purchasing banner for ${days} days for seller ${selectedSeller.user.email}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyBannerPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              showToast(`Payment for ${days} days (₹${amount}) completed.`, 'success');
              if (setSelectedSeller) {
                setSelectedSeller(prev => ({
                  ...prev,
                  bannerPayment: verifyRes.bannerPayment
                }));
              }
              await refetchBannerPayments();
            } else {
              showToast('Payment verification failed', 'error');
            }
          } catch (error) {
            showToast(`Error verifying payment: ${error.message}`, 'error');
          }
        },
        prefill: {
          email: selectedSeller.user.email || 'demo@example.com',
          contact: selectedSeller.user.phone || '9999999999',
        },
        theme: {
          color: '#0c1f4d',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        showToast('Payment failed. Please try again.', 'error');
      });
      razorpay.open();
    } catch (error) {
      showToast(`Something went wrong: ${error.message}`, 'error');
    } finally {
      setIsRazorpayLoading(false);
      setIsPurchaseOpen(false);
      setDays('');
      setAmount(0);
    }
  };

  const handleUpgrade = async () => {
    try {
      if (!days || !amount) throw new Error('Please specify the number of days');
      if (!selectedSeller?.user?._id) throw new Error('No seller selected');
      if (!selectedSeller?.bannerPayment?._id) throw new Error('No active banner payment selected');
      if (!hasSubscription) throw new Error('No active subscription found for the seller');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }

      const bannerData = {
        user_id: selectedSeller.user._id,
        old_banner_payment_id: selectedSeller.bannerPayment._id,
        days,
        amount,
        subscription_id: subscriptionId,
      };

      const { order } = await upgradeBanner(bannerData).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Banner Upgrade Payment',
        description: `Upgrading banner for ${days} days for seller ${selectedSeller.user.email}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyBannerPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              showToast(`Upgraded banner for ${days} days for ₹${amount}`, 'success');
              if (setSelectedSeller) {
                setSelectedSeller(prev => ({
                  ...prev,
                  bannerPayment: verifyRes.bannerPayment
                }));
              }
              await refetchBannerPayments();
            } else {
              showToast('Payment verification failed', 'error');
            }
          } catch (error) {
            showToast(`Error verifying upgrade payment: ${error.message}`, 'error');
          }
        },
        prefill: {
          email: selectedSeller.user.email || 'demo@example.com',
          contact: selectedSeller.user.phone || '9999999999',
        },
        theme: {
          color: '#0c1f4d',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        showToast('Upgrade payment failed. Please try again.', 'error');
      });
      razorpay.open();
    } catch (error) {
      showToast(`Something went wrong: ${error.message}`, 'error');
    } finally {
      setIsRazorpayLoading(false);
      setIsUpgradeOpen(false);
      setDays('');
      setAmount(0);
    }
  };

  const handleCancel = async () => {
    if (!selectedSeller?.bannerPayment?._id) {
      showToast('No banner payment selected.', 'error');
      setIsCancelDialogOpen(false);
      return;
    }
    try {
      await cancelBanner(selectedSeller.bannerPayment._id).unwrap();
      showToast('Banner subscription cancelled successfully', 'success');
      await refetchBannerPayments();
      if (setSelectedSeller) setSelectedSeller(null);
      setIsCancelDialogOpen(false);
    } catch (error) {
      showToast(`Failed to cancel banner subscription: ${error.message}`, 'error');
      setIsCancelDialogOpen(false);
    }
  };

  return (
    <div  >
      <div className="  py-4">
        <h2 className="text-md border-1 w-fit  border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
          Banner Plan Management
        </h2>
      </div>
      <div className=" py-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4dcc] text-white text-sm sm:text-base"
            size="sm"
            onClick={() => setIsPurchaseOpen(true)}
            disabled={actionMode !== "purchase" || !selectedSeller?.user || isSubscriptionLoading || isRazorpayLoading}
            style={{ cursor: actionMode !== "purchase" ? "not-allowed" : "pointer" }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Purchase Banner Ad
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-sm sm:text-base cursor-pointer"
            onClick={() => setIsUpgradeOpen(true)}
            disabled={actionMode !== "upgrade" || !selectedSeller?.bannerPayment || isSubscriptionLoading || isRazorpayLoading}
            style={{ cursor: actionMode !== "upgrade" ? "not-allowed" : "pointer" }}
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            Upgrade Plan
          </Button>
          <Button
            className="bg-red-600 cursor-pointer hover:bg-red-700 text-white text-sm sm:text-base"
            size="sm"
            onClick={() => setIsCancelDialogOpen(true)}
            disabled={actionMode !== "cancel" || !selectedSeller?.bannerPayment || isRazorpayLoading}
            style={{ cursor: actionMode !== "cancel" ? "not-allowed" : "pointer" }}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Plan
          </Button>
        </div>
      </div>

      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Purchase Banner Ad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-2 sm:px-0">
            <Input
              type="number"
              placeholder="Number of Days (e.g., 30)"
              value={days}
              onChange={handleDaysChange}
              className="w-full text-sm sm:text-base"
              min="1"
              disabled={isRazorpayLoading}
            />
            <p className="text-sm text-gray-600">Total Cost: ₹{amount} (₹{perDayPrice} per day)</p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-sm sm:text-base"
              onClick={() => setIsPurchaseOpen(false)}
              disabled={isRazorpayLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4ddb] text-sm sm:text-base"
              size="sm"
              disabled={!hasSubscription || !days || amount <= 0 || !subscriptionId || isRazorpayLoading}
              onClick={handlePurchase}
            >
              {isRazorpayLoading ? 'Loading Payment...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Upgrade Banner Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-2 sm:px-0">
            <Input
              type="number"
              placeholder="Number of Days (e.g., 30)"
              value={days}
              onChange={handleDaysChange}
              className="w-full text-sm sm:text-base"
              min="1"
              disabled={isRazorpayLoading}
            />
            <p className="text-sm text-gray-600">Total Cost: ₹{amount} (₹{perDayPrice} per day)</p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-sm sm:text-base cursor-pointer"
              onClick={() => setIsUpgradeOpen(false)}
              disabled={isRazorpayLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4ddb] text-sm sm:text-base"
              size="sm"
              disabled={!hasSubscription || !days || amount <= 0 || !subscriptionId || isRazorpayLoading}
              onClick={handleUpgrade}
            >
              {isRazorpayLoading ? 'Loading Payment...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Confirm Cancellation</DialogTitle>
          </DialogHeader>
          <p className="text-sm sm:text-base">Are you sure you want to cancel the banner subscription for {selectedSeller?.user?.email}?</p>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-sm sm:text-base"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isRazorpayLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700 text-sm sm:text-base"
              size="sm"
              onClick={handleCancel}
              disabled={isRazorpayLoading}
            >
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannerPlanManagement;