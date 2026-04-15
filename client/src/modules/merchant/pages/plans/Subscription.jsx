import { useState, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import PurchaseDialog from './subcription/PurchaseDialog';
import ActivePlanCard from './subcription/ActiveCard';
import {
  useGetAllPlansQuery,
  useCreateRazorpayOrderMutation,
  useGetUserActiveSubscriptionQuery,
  useCancelSubscriptionMutation
} from '@/redux/api/UserSubscriptionPlanApi';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import showToast from '@/toast/showToast';

const SubscriptionPlan = () => {
  const { user } = useContext(AuthContext);
  const { data: plans, isLoading } = useGetAllPlansQuery();
  const {
    data: activeSubscriptionData,
    isLoading: isActiveSubscriptionLoading,
    refetch // Get refetch function from the hook
  } = useGetUserActiveSubscriptionQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });
  const { isSidebarOpen } = useSidebar();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [createUserSubscription] = useCreateRazorpayOrderMutation();
  const [cancelSubscription] = useCancelSubscriptionMutation();

  const activePlan = activeSubscriptionData?.subscription;

  const getPlanType = (price) => {
    if (price <= 1000) return 'Standard Plan';
    if (price > 1000 && price <= 2000) return 'Professional Plan';
    if (price > 2000) return 'Enterprise Plan';
    return 'Custom Plan';
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setIsPurchaseOpen(true);
  };

  const handlePurchase = async (plan) => {
    try {
      if (!plan) throw new Error('No plan selected');
      const userId = user?.user?._id;
      if (!userId) throw new Error('User not logged in');
      await createUserSubscription({
        user_id: userId,
        subscription_plan_id: plan.subscription_plan_id._id
      }).unwrap();
      showToast(`Purchased ${plan.subscription_plan_id.plan_name} for ₹${plan.subscription_plan_id.price}`, 'error');
    } catch (error) {
      console.error(error);
      showToast('Failed to purchase plan', 'error');
    }
    setIsPurchaseOpen(false);
  };

  const handleCancel = () => {
    setIsCancelDialogOpen(true); // Open confirmation dialog
  };

  const confirmCancel = async () => {
    if (!activePlan) {
      showToast("No active plan to cancel.", 'error');
      setIsCancelDialogOpen(false);
      return;
    }
    try {
      await cancelSubscription(activePlan._id).unwrap();
      showToast("Subscription cancelled successfully", 'success');
      setIsCancelDialogOpen(false);
      await refetch(); // Explicitly re-fetch active subscription data
    } catch (error) {
      console.error('Cancel Subscription Error:', error);
      showToast("Failed to cancel subscription", 'error');
      setIsCancelDialogOpen(false);
    }
  };

  if (isLoading || isActiveSubscriptionLoading) return <div>Loading...</div>;

  return (
    <div
      className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen
        ? 'ml-1 sm:ml-64'
        : 'ml-1 sm:ml-16'
        }`}
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-[#0c1f4d]">No Hidden Fee! Choose Your Plan.</h2>
        <p className="text-gray-600 mt-2">
          Discover the most robust and cohesive social media business solution, built to scale as you grow or cancel anytime.
        </p>
      </div>
      {activePlan && (
        <div className="mb-6">
          <ActivePlanCard
            plan={activePlan}
            onCancel={handleCancel}
            razorpayOrder={activeSubscriptionData?.razorpayOrder}
            razorpayPayment={activeSubscriptionData?.razorpayPayment}
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.data?.map((plan) => {
          const planType = getPlanType(plan.subscription_plan_id.price);
          const isActive = activePlan?.subscription_plan_id?._id === plan.subscription_plan_id._id;

          return (
            <Card key={plan.subscription_plan_id._id} className="flex flex-col h-full">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {planType}
                  </span>
                </div>
                <CardTitle className="text-2xl text-[#0c1f4d]">
                  ₹{(Math.round(plan.subscription_plan_id.price - 1)).toLocaleString("en-IN")}
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">Billed Annually</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2 text-sm text-gray-600">
                  {plan.elements.map((elem) => (
                    <li key={elem.element_id} className="flex items-center">
                      <span className="mr-2 text-[#0c1f4d]">✔</span>
                      {elem.element_name}: {elem.value}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button
                  className={`w-full ${isActive

                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white cursor-pointer'

                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white cursor-pointer'

                    }`}
                  onClick={() => !isActive && handleSelectPlan(plan)}
                  disabled={isActive}
                >
                  {isActive ? 'Current Plan' : 'Get Started'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      <PurchaseDialog
        open={isPurchaseOpen}
        onOpenChange={setIsPurchaseOpen}
        plan={selectedPlan}
        onPurchase={handlePurchase}
      />
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to cancel your {activePlan?.subscription_plan_id?.plan_name} subscription?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-500" onClick={confirmCancel}>
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlan;