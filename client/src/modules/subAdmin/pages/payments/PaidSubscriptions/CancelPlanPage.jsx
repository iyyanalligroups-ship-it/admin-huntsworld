import { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { useCancelSubscriptionMutation, useGetUserActiveSubscriptionQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import showToast from '@/toast/showToast';
import PurchasedSellersTable from './PurchasedSellersTable';

const CancelPlanPage = () => {
  const { state } = useLocation();
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // kept but currently unused
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [cancelSubscription] = useCancelSubscriptionMutation();

  // If subscriptionId was passed via navigation state → auto-open confirm dialog
  useEffect(() => {
    if (state?.subscriptionId) {
      setIsConfirmOpen(true);
    }
  }, [state]);

  // We'll use the passed subscriptionId if available, otherwise fall back to active one
  const preSubscriptionId = state?.subscriptionId;

  const { data: activeSubscription, isLoading: isSubLoading } = useGetUserActiveSubscriptionQuery(
    user?._id, // assuming admin wants to cancel their own active subscription
    {
      skip: !!preSubscriptionId || !user?._id, // skip if we already have subscriptionId from state
    }
  );

  const handleCancel = async () => {
    try {
      const subscriptionId = preSubscriptionId || activeSubscription?.subscription?._id;

      if (!subscriptionId) {
        throw new Error('No subscription ID found to cancel');
      }

      await cancelSubscription(subscriptionId).unwrap();
      showToast('Subscription cancelled successfully', 'success');
      navigate('/sub-admin-dashboard');
    } catch (error) {
      console.error('Cancel Error:', error);
      showToast(`Failed to cancel: ${error?.data?.message || error.message || 'Unknown error'}`, 'error');
    }

    setIsConfirmOpen(false);
  };

  const openConfirm = () => {
    if (!preSubscriptionId && !activeSubscription?.subscription?._id) {
      showToast('No active subscription found to cancel', 'error');
      return;
    }
    setIsConfirmOpen(true);
  };

  return (
    <div
      className={`flex-1 p-4 transition-all duration-300 ${
        isSidebarOpen ? 'ml-1 sm:ml-64' : 'ml-1 sm:ml-16'
      }`}
    >
      <div className="p-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#0c1f4d]">Cancel Subscription</h2>
          <p className="text-gray-600 mt-2">
            {preSubscriptionId
              ? 'You are about to cancel a specific subscription.'
              : 'Cancel your currently active subscription plan.'}
          </p>
        </div>

        {isSubLoading && <p className="text-center">Loading subscription info...</p>}

        {preSubscriptionId || activeSubscription ? (
          <div className="mb-8 text-center">
            {preSubscriptionId ? (
              <p className="text-lg font-medium">Subscription ID: {preSubscriptionId}</p>
            ) : (
              <>
                <h3 className="text-xl font-bold">
                  Active Plan: {activeSubscription?.subscription?.subscription_plan_id?.plan_name || '—'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  ID: {activeSubscription?.subscription?._id || '—'}
                </p>
              </>
            )}

            <Button
              className="bg-red-600 text-white mt-6 px-8"
              onClick={openConfirm}
              disabled={isSubLoading}
            >
              Cancel Subscription
            </Button>
          </div>
        ) : (
          !isSubLoading && (
            <p className="text-center text-gray-500">
              No active subscription found.
            </p>
          )
        )}

        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>Confirm Cancellation</DialogHeader>
            <p className="py-4">
              Are you sure you want to cancel this subscription?
              This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                No, keep it
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleCancel}>
                Yes, Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PurchasedSellersTable />
      </div>
    </div>
  );
};

export default CancelPlanPage;
