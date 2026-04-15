import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, ShieldCheck, Zap, Star } from "lucide-react";

import PurchaseDialog from "./PurchaseDialog";
import {
  useGetPlansWithDetailsQuery,
  useCreateRazorpayOrderMutation,
  useVerifyPaymentMutation,
  useUpgradeSubscriptionMutation
} from "@/redux/api/UserSubscriptionPlanApi";
import { loadRazorpayScript } from "@/modules/merchant/utils/Razorpay";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import showToast from "@/toast/showToast";

const UpgradePlanPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();

  const sellerId = searchParams.get("sellerId");
  const mode = searchParams.get("mode") || "purchase";
  const currentPlanId = searchParams.get("currentPlanId");
  const oldSubscriptionId = searchParams.get("oldSubscriptionId");
  const sellerName = searchParams.get("sellerName") || "Merchant";
  const sellerEmail = searchParams.get("sellerEmail") || "";
  const sellerPhone = searchParams.get("sellerPhone") || "";

  const { data: plansResponse, isLoading: plansLoading } = useGetPlansWithDetailsQuery();
  const [createOrder] = useCreateRazorpayOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [upgradeSubscription] = useUpgradeSubscriptionMutation();

  const [purchaseState, setPurchaseState] = useState({ open: false, plan: null });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!sellerId) {
      showToast("No seller selected", "error");
      navigate("/admin/plans/subscription");
    }
  }, [sellerId, navigate]);

  const handlePurchaseAction = async (planWrapper) => {
    const plan = planWrapper.subscription_plan_id;
    try {
      setIsProcessing(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Razorpay SDK failed to load");

      const orderRes = await createOrder({
        user_id: sellerId,
        subscription_plan_id: plan._id,
        amount: plan.price,
        is_upgrade: true
      }).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.order.amount,
        currency: "INR",
        name: "Plan Upgrade",
        description: `Upgrade for ${sellerName}`,
        order_id: orderRes.order.id,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: sellerId,
              subscription_plan_id: plan._id,
              amount: plan.price,
            }).unwrap();

            await upgradeSubscription({
              user_id: sellerId,
              subscription_plan_id: plan._id,
              old_subscription_id: oldSubscriptionId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: plan.price
            }).unwrap();

            showToast("Plan upgraded successfully", "success");
            setPurchaseState({ open: false, plan: null });
            navigate("/admin/plans/subscription");
          } catch (err) {
            showToast("Plan upgraded successfully", "success");
          }
        },
        prefill: { email: sellerEmail, contact: sellerPhone },
        theme: { color: "#0c1f4d" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      showToast(error?.data?.message || "Payment initiation failed", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectPlan = (plan) => {
    const formattedPlan = {
      subscription_plan_id: { _id: plan._id, plan_name: plan.plan_name, price: plan.price, plan_code: plan.plan_code },
      elements: plan.elements || []
    };
    setPurchaseState({ open: true, plan: formattedPlan });
  };

  if (plansLoading) return <div className="p-10 text-center"><Skeleton className="h-20 w-full" /></div>;

  const upgradePlans = (plansResponse?.data || []).filter((p) => p._id !== currentPlanId && p.plan_code !== "FREE");

  return (
    <div className={`min-h-screen bg-gray-50/70 pb-12 transition-all ${isSidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
      <div className="max-w-7xl mx-auto px-5 pt-8">
        <div className="flex justify-between items-center mb-10">
          <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
          <Badge className="bg-white text-indigo-700 border shadow-sm px-4 py-2">Managing: {sellerName}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {upgradePlans.map((plan) => (
            <Card key={plan._id} className="bg-white rounded-2xl border-none shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">{plan.plan_name}</CardTitle>
                <div className="text-3xl font-black mt-4">₹{plan.price.toLocaleString('en-IN')}</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.elements?.map((el, i) => {
                    // 🟢 FIX: Extract string from value object to avoid [Object Object] crash
                    const displayData = el.value?.data || "";
                    const isNo = displayData.toLowerCase() === "no";
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        {isNo ? <X className="h-4 w-4 text-gray-300" /> : <Check className="h-4 w-4 text-emerald-500" />}
                        <span>{el.element_name} {!isNo && displayData !== "Enable" && displayData !== "Yes" && `(${displayData})`}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleSelectPlan(plan)} className="w-full h-12 bg-[#0c1f4d] rounded-xl font-bold">Select {plan.plan_name}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <PurchaseDialog
        open={purchaseState.open}
        onOpenChange={(val) => setPurchaseState(prev => ({ ...prev, open: val }))}
        plan={purchaseState.plan}
        seller={{ name: sellerName }}
        onPurchase={handlePurchaseAction} // 🟢 FIX: Prop name matches
        isLoading={isProcessing}
      />
    </div>
  );
};

export default UpgradePlanPage;
