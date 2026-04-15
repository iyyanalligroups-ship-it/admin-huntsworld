import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import {
  useCreateRazorpayOrderMutation,
  useVerifyPaymentMutation,
  useUpgradeSubscriptionMutation,
} from '@/redux/api/UserSubscriptionPlanApi';
import { useGetGSTPlanQuery } from '@/redux/api/CommonSubscriptionPlanApi';
import { useState, useRef } from 'react';
import showToast from '@/toast/showToast';
import axios from 'axios';

const PurchaseDialog = ({
  open,
  onOpenChange,
  plan,
  seller,
  activePlan,
  oldSubscriptionId,
  onPaymentSuccess,
  isLoading: parentLoading,
}) => {
  const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [upgradeSubscription] = useUpgradeSubscriptionMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [autoOff, setAutoOff] = useState(true);
  const [autoRenew, setAutoRenew] = useState(false);

  const { data: gstPlanData, isLoading: isGSTLoading, error: gstError } = useGetGSTPlanQuery();

  const baseAmount = plan?.subscription_plan_id?.price || 0;
  const gstPercentage = gstPlanData?.data?.price || 0;

  const paymentInProgressRef = useRef(false);


  const handlePurchase = async () => {
    if (paymentInProgressRef.current) return;
    paymentInProgressRef.current = true;

    try {
      setIsLoading(true);

      if (!plan) {
        showToast("Please select a plan", "error");
        return;
      }

      const userId = seller?._id;
      if (!userId) {
        showToast("Seller information missing", "error");
        return;
      }


      const loaded = await loadRazorpayScript();
      if (!loaded) {
        showToast("Razorpay SDK failed to load", "error");
        return;
      }


      // Step A: Create Razorpay Order/Subscription
      const orderRes = await createRazorpayOrder({
        user_id: userId,
        subscription_plan_id: plan.subscription_plan_id._id,
        amount: plan.subscription_plan_id.price,
        auto_off: autoOff,
        auto_renew: autoRenew,
        is_upgrade: !!activePlan,
      }).unwrap();

      const { razorpayData, auto_renew: isAutoRenew } = orderRes;

      const currentBaseAmount = (baseAmount > 0 && !isAutoRenew) ? baseAmount - 1 : baseAmount;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        ...(isAutoRenew
          ? { subscription_id: razorpayData.id }
          : { order_id: razorpayData.id }
        ),
        name: "Sub-Admin Plan Assignment",
        description: `Assigning ${plan.subscription_plan_id.plan_name} to ${seller.name}`,
        handler: async (response) => {
          try {
            // Step B: Verify Payment
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id || null,
              razorpay_subscription_id: response.razorpay_subscription_id || null,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: userId,
              subscription_plan_id: plan.subscription_plan_id._id,
              amount: currentBaseAmount,
            }).unwrap();

            if (activePlan) {
              try {
                // Step C: Handle Upgrade logic
                await upgradeSubscription({
                  user_id: userId,
                  subscription_plan_id: plan.subscription_plan_id._id,
                  old_subscription_id: oldSubscriptionId,
                  amount: currentBaseAmount,
                  razorpay_order_id: response.razorpay_order_id || null,
                  razorpay_subscription_id: response.razorpay_subscription_id || null,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }).unwrap();
                showToast("Plan upgraded successfully 🎉", "success");
                onPaymentSuccess(plan);
              } catch (upgradeErr) {
                console.error("Upgrade error:", upgradeErr);
                showToast("Payment verified, but plan activation failed.", "error");
              }
            } else {
              showToast("Subscription activated successfully 🎉", "success");
              onPaymentSuccess(plan);
            }
          } catch (err) {
            console.error("Verification error:", err);
            showToast(err?.data?.message || "Payment verification failed", "error");
          } finally {
            paymentInProgressRef.current = false;
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            paymentInProgressRef.current = false;
            setIsLoading(false);
          },
        },
        prefill: {
          email: seller.email,
          contact: seller.phone,
        },
        theme: { color: "#0c1f4d" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        paymentInProgressRef.current = false;
        setIsLoading(false);
        showToast("Payment failed", "error");
      });
      razorpay.open();

    } catch (err) {
      console.error("Purchase Error:", err);
      showToast(err?.data?.message || err?.message || "Something went wrong", "error");
    } finally {
      paymentInProgressRef.current = false;
      setIsLoading(false);
    }
  };

  const isAnyLoading = isLoading || parentLoading || isGSTLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl overflow-hidden p-0 gap-0 border-none shadow-2xl">
        <div className="bg-[#0c1f4d] p-6 text-white">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {activePlan ? "Upgrade Subscription" : "Confirm Assignment"}
          </DialogTitle>
          <p className="text-indigo-200 text-xs mt-1 font-medium italic">
            Assigning plan to: {seller?.name || "Merchant"}
          </p>
        </div>

        <div className="p-8 space-y-6">
          {activePlan && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-900 leading-normal">
                <p className="font-bold mb-1 uppercase tracking-wider">Plan Switch Warning</p>
                <p>The current <strong>{activePlan.plan_name || 'Active'}</strong> plan will be discontinued and replaced by the new plan immediately upon payment.</p>
              </div>
            </div>
          )}

          {plan ? (
            <>
              {/* Price Display with Psychological Pricing (-1) */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium">Selected Plan</span>
                  <span className="font-bold text-slate-800">{plan.subscription_plan_id.plan_name}</span>
                </div>

                {(() => {
                  const originalBase = baseAmount;
                  // 🟢 FIX: Skip -1 discount if autoRenew is enabled (Razorpay Plan pricing requirement)
                  const reducedBase = (originalBase > 0 && !autoRenew) ? originalBase - 1 : originalBase;
                  const reducedGst = (reducedBase * gstPercentage) / 100;
                  const reducedTotal = reducedBase + reducedGst;

                  return (
                    <div className="space-y-2 pt-1 font-medium">
                      <div className="flex justify-between text-slate-500">
                        <span>Base Amount {autoRenew && <span className="text-[10px] text-indigo-500 font-bold ml-1 uppercase">(Std.)</span>}</span>
                        <span>₹{reducedBase.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>GST ({gstPercentage}%)</span>
                        <span>₹{reducedGst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pt-3 flex justify-between text-xl font-black text-indigo-900 border-t border-slate-200 mt-2">
                        <span>Total Amount</span>
                        <span>₹{reducedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Toggles */}
              <div className="space-y-4 px-2">
                {autoRenew && (
                   <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2 animate-in fade-in zoom-in duration-300">
                      <AlertTriangle className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-indigo-900 leading-tight">
                        <strong>Auto-Pay Notice:</strong> Psychological pricing (Price - 1) is not supported for recurring payments by Razorpay. The standard plan price will be used.
                      </p>
                   </div>
                )}

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="auto-off"
                    checked={autoOff}
                    onChange={(e) => setAutoOff(e.target.checked)}
                    disabled={isAnyLoading}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="auto-off" className="text-sm text-slate-600 cursor-pointer select-none leading-tight">
                    <span className="font-bold block text-slate-800 text-xs uppercase tracking-tighter">One-Time Billing</span>
                    Automatically disable this plan on expiry (no renewal).
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="auto-renew"
                    checked={autoRenew}
                    onChange={(e) => {
                      setAutoRenew(e.target.checked);
                      if (e.target.checked) setAutoOff(false); // Mutually exclusive
                    }}
                    disabled={isAnyLoading || baseAmount === 0 || !plan?.subscription_plan_id?.razorpay_plan_id}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                  />
                  <label htmlFor="auto-renew" className={`text-sm cursor-pointer select-none leading-tight ${(!plan?.subscription_plan_id?.razorpay_plan_id && baseAmount > 0) ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span className="font-bold block text-slate-800 text-xs uppercase tracking-tighter">Enable Auto-Renewal</span>
                    The card will be charged automatically every billing cycle.
                    {(!plan?.subscription_plan_id?.razorpay_plan_id && baseAmount > 0) && (
                      <span className="text-[10px] text-amber-600 font-bold block mt-0.5 italic">⚠️ Not configured for auto-pay in database.</span>
                    )}
                  </label>
                </div>
              </div>

              <DialogFooter className="pt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isAnyLoading}
                  className="flex-1 cursor-pointer h-12 rounded-2xl border-slate-200 font-bold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#0c1f4d] cursor-pointer hover:bg-[#1a2f63] text-white flex-1 h-12 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100"
                  onClick={handlePurchase}
                  disabled={isAnyLoading || gstError}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  {activePlan ? "Confirm Upgrade" : "Confirm & Pay"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-10 text-center text-slate-400 font-medium">No plan selected.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
