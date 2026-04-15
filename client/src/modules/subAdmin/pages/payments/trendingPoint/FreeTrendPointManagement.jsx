import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowUpCircle, XCircle, IndianRupee, Gift, AlertCircle, Loader2 } from 'lucide-react';
import showToast from '@/toast/showToast';
import {
  useCreateTrendingPointsOrderMutation,
  useVerifyTrendingPointsPaymentMutation,
  useUpgradeTrendingPointsMutation,
  useCancelTrendingPointsMutation,
  useGrantFreeTrendingPointsMutation,
} from '@/redux/api/UserTrendingPointSubscriptionApi';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';

const FreeTrendPointManagement = ({
  targetUser,
  hasSubscription,
  subscriptionId,
  activeTrendingPointsPayment,
  pendingTrendingPointsPayment,
  onRefresh,
  pointRate,
}) => {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isFreeGrantOpen, setIsFreeGrantOpen] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);

  const [points, setPoints] = useState('');
  const [amount, setAmount] = useState(0);

  const [freePoints, setFreePoints] = useState('');
  const [freeReason, setFreeReason] = useState('');

  const [createTrendingPointsOrder] = useCreateTrendingPointsOrderMutation();
  const [verifyTrendingPointsPayment] = useVerifyTrendingPointsPaymentMutation();
  const [upgradeTrendingPoints] = useUpgradeTrendingPointsMutation();
  const [cancelTrendingPoints] = useCancelTrendingPointsMutation();
  const [grantFreeTrendingPoints, { isLoading: isGranting }] = useGrantFreeTrendingPointsMutation();

  const user_id = targetUser?._id;
  const existingPoints = activeTrendingPointsPayment?.points || 0;

  const handlePointsChange = (e) => {
    const inputPoints = parseInt(e.target.value, 10);
    if (!isNaN(inputPoints) && inputPoints > 0) {
      setPoints(inputPoints);
      setAmount(inputPoints * pointRate);
    } else {
      setPoints('');
      setAmount(0);
    }
  };

  const handlePurchase = async () => {
    try {
      if (!points || !amount) throw new Error('Please specify the number of points');
      if (!user_id) throw new Error('No user selected');
      if (!hasSubscription) throw new Error('No active subscription found');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }

      const { order, trendingPointsPayment } = await createTrendingPointsOrder({
        user_id,
        points,
        amount,
        subscriptionId,
      }).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Trending Points Subscription Payment',
        description: `Purchasing ${points} trending points`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyTrendingPointsPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              showToast(`Payment for ${points} points completed.`, 'success');
              await onRefresh();
              setIsPurchaseOpen(false);
              setPoints('');
              setAmount(0);
            } else {
              showToast('Payment verification failed', 'error');
            }
          } catch (error) {
            showToast(`Error verifying payment: ${error.message}`, 'error');
          }
        },
        prefill: {
          email: targetUser?.email || 'demo@example.com',
          contact: targetUser?.contact || '9999999999',
        },
        theme: {
          color: '#0c1f4d',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', () => {
        showToast('Payment failed. Please try again.', 'error');
      });
      razorpay.open();
    } catch (error) {
      showToast(`Something went wrong: ${error.message}`, 'error');
    } finally {
      setIsRazorpayLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      if (!points || !amount) throw new Error('Please specify the number of points');
      if (!user_id) throw new Error('No user selected');
      if (!hasSubscription) throw new Error('No active subscription found');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }

      const pointsData = {
        user_id,
        old_trending_points_payment_id: activeTrendingPointsPayment?._id,
        points,
        amount,
        subscription_id: subscriptionId,
      };

      const { order, trendingPointsPayment } = await upgradeTrendingPoints(pointsData).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Trending Points Upgrade Payment',
        description: `Upgrading to ${points + existingPoints} points`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyTrendingPointsPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              showToast(`Upgraded to ${points + existingPoints} points`, 'success');
              await onRefresh();
            } else {
              showToast('Payment verification failed', 'error');
            }
          } catch (error) {
            showToast(`Error verifying upgrade: ${error.message}`, 'error');
          }
        },
        prefill: {
          email: targetUser?.email || 'demo@example.com',
          contact: targetUser?.contact || '9999999999',
        },
        theme: {
          color: '#0c1f4d',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', () => {
        showToast('Upgrade payment failed.', 'error');
      });
      razorpay.open();
    } catch (error) {
      showToast(`Something went wrong: ${error.message}`, 'error');
    } finally {
      setIsRazorpayLoading(false);
      setIsUpgradeOpen(false);
      setPoints('');
      setAmount(0);
    }
  };

  const handleCancel = async () => {
    if (!activeTrendingPointsPayment) {
      showToast('No active trending points to cancel.', 'warning');
      setIsCancelDialogOpen(false);
      return;
    }
    try {
      await cancelTrendingPoints({ trending_points_payment_id: activeTrendingPointsPayment._id, user_id }).unwrap();
      showToast('Trending points subscription cancelled successfully', 'success');
      setIsCancelDialogOpen(false);
      await onRefresh();
    } catch (error) {
      showToast(`Failed to cancel: ${error.message || error}`, 'error');
      setIsCancelDialogOpen(false);
    }
  };

  const handleGrantFreePoints = async () => {
    try {
      const numPoints = Number(freePoints);
      if (!numPoints || numPoints < 1 || !Number.isInteger(numPoints)) {
        showToast('Please enter a valid number of points (minimum 1)', 'error');
        return;
      }

      if (!user_id) {
        showToast('No merchant selected', 'error');
        return;
      }

      if (!hasSubscription || !subscriptionId) {
        showToast('An active subscription is required to grant trending points', 'error');
        return;
      }

      await grantFreeTrendingPoints({
        user_id,
        subscription_id: subscriptionId,
        points: numPoints,
        reason: freeReason.trim() || undefined,
      }).unwrap();

      showToast(`Successfully granted ${numPoints} free trending points`, 'success');

      setIsFreeGrantOpen(false);
      setFreePoints('');
      setFreeReason('');
      await onRefresh();
    } catch (err) {
      const message = err?.data?.message || err?.message || 'Failed to grant free points';
      showToast(message, 'error');
    }
  };

  return (
    <Card className="border-[#0c1f4d] bg-[#f0f4f6] rounded-xl shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#0c1f4d]">Trending Points Plan Management</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Active plan section */}
        {(activeTrendingPointsPayment || pendingTrendingPointsPayment) && (
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="text-lg font-semibold mb-3 text-[#0c1f4d]">Active Plan</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="font-medium">Points:</div>
              <div>{activeTrendingPointsPayment?.points || pendingTrendingPointsPayment?.points || 0}</div>

              <div className="font-medium">Amount:</div>
              <div>₹{(activeTrendingPointsPayment?.amount || 0).toFixed(2)}</div>

              <div className="font-medium">Status:</div>
              <div className="capitalize">{activeTrendingPointsPayment?.payment_status || '—'}</div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white flex items-center gap-2"
                onClick={() => setIsUpgradeOpen(true)}
              >
                <ArrowUpCircle className="w-4 h-4" />
                Upgrade Plan
              </Button>

              <Button
                variant="destructive"
                className="flex items-center gap-2"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                <XCircle className="w-4 h-4" />
                Cancel Plan
              </Button>

              <Button
                variant="outline"
                className="border-amber-600 text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                onClick={() => setIsFreeGrantOpen(true)}
              >
                <Gift className="w-4 h-4" />
                Grant Free Points
              </Button>
            </div>
          </div>
        )}

        {/* No active plan */}
        {!activeTrendingPointsPayment && !pendingTrendingPointsPayment && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-6">
              This merchant does not have active trending points yet.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white flex items-center gap-2"
                disabled={!hasSubscription || !subscriptionId}
                onClick={() => setIsPurchaseOpen(true)}
              >
                <IndianRupee className="w-4 h-4" />
                Purchase Trending Points
              </Button>

              <Button
                variant="outline"
                className="border-amber-600 text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                onClick={() => setIsFreeGrantOpen(true)}
              >
                <Gift className="w-4 h-4" />
                Grant Free Points (Admin)
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Trending Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Number of Points (e.g., 100)"
              value={points}
              onChange={handlePointsChange}
              min="1"
            />
            <p className="text-sm text-gray-600">
              Total Cost: ₹{amount?.toFixed(2)} (₹{pointRate?.toFixed(2)} per point)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!hasSubscription || !points || amount <= 0 || !subscriptionId}
              className="bg-[#0c1f4d] hover:bg-[#0c1f4ddb]"
              onClick={handlePurchase}
            >
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Trending Points Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Existing Points: {existingPoints}</p>
            <Input
              type="number"
              placeholder="Additional Points"
              value={points}
              onChange={handlePointsChange}
              min="1"
            />
            <p>Total after upgrade: {(points ? Number(points) : 0) + existingPoints}</p>
            <p>Cost: ₹{amount.toFixed(2)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4ddb]"
              disabled={!points || amount <= 0}
              onClick={handleUpgrade}
            >
              Proceed to Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to cancel this trending points subscription?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Free Grant Dialog */}
      <Dialog open={isFreeGrantOpen} onOpenChange={setIsFreeGrantOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              Grant Free Trending Points
            </DialogTitle>
            <DialogDescription>
              Add points at ₹0 cost. Admin action only. Requires active subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of points</label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={freePoints}
                onChange={(e) => setFreePoints(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isGranting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input
                placeholder="Promotional, support, testing..."
                value={freeReason}
                onChange={(e) => setFreeReason(e.target.value)}
                disabled={isGranting}
              />
            </div>

            {freePoints && Number(freePoints) > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm">
                Granting <strong>{freePoints}</strong> free points to{' '}
                <strong>{targetUser?.name || targetUser?.email}</strong>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsFreeGrantOpen(false)} disabled={isGranting}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={isGranting || !freePoints || Number(freePoints) < 1}
              onClick={handleGrantFreePoints}
            >
              {isGranting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Granting...
                </>
              ) : (
                'Grant Free Points'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FreeTrendPointManagement;
