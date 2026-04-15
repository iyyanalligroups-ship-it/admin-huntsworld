import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import {
  useCreateRazorpayOrderMutation,
  useVerifyPaymentMutation,
  useCreateSubscriptionMutation,
} from '@/redux/api/UserSubscriptionPlanApi';
import { useContext } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import showToast from '@/toast/showToast';


const PurchaseDialog = ({ open, onOpenChange, plan, onPurchase }) => {
  const { user } = useContext(AuthContext);
  const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [createUserSubscription] = useCreateSubscriptionMutation();

  const handlePurchase = async () => {
    try {
      if (!plan) {
        showToast("Please select a plan", 'error')
        return;
      }

      const userId = user?.user?._id;
      if (!userId) {
        showToast("User not logged in", 'error')
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("Failed to load Razorpay script", 'error')
        return;
      }

      const { order } = await createRazorpayOrder({
        user_id: userId,
        subscription_plan_id: plan?.subscription_plan_id?._id,
        amount: plan?.subscription_plan_id?.price,
      }).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Subscription Payment",
        description: `Paying for ${plan.subscription_plan_id.plan_name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              await createUserSubscription({
                user_id: userId,
                subscription_plan_id: plan.subscription_plan_id._id,
              }).unwrap();
              onPurchase(plan);
              showToast("Payment Successful!", 'success');
            } else {
              alert("Payment verification failed");
              showToast("Payment verification failed", 'error');
            }
          } catch (error) {
            console.error("Verification failed:", error);
            showToast("Error verifying payment", 'error');
          }
        },
        prefill: {
          email: user?.user?.email || "demo@example.com",
          contact: user?.user?.phone || "9999999999",
        },
        theme: {
          color: "#0c1f4d",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Purchase Error:", err);
      showToast("Something went wrong. Try again.", 'error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>Confirm Purchase</DialogHeader>
        {plan ? (
          <>
            <p>
              Are you sure you want to buy {plan.subscription_plan_id.plan_name} for ₹
              {plan.subscription_plan_id.price}?
            </p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                className="bg-green-500 hover:bg-green-400 cursor-pointer"
                onClick={handlePurchase}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Confirm Purchase
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p>No plan selected. Please select a plan to proceed.</p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;