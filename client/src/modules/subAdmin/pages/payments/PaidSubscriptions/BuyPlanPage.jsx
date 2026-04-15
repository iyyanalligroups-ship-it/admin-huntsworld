import { useState, useEffect, useRef } from 'react';
import { useNavigate, createSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from "@/components/ui/skeleton";
import PurchaseDialog from './PurchaseDialog';
import {
  useGetAllPlansQuery,
  useGetUserBySearchQuery,
  useGetUserActiveSubscriptionQuery,
  useCreateRazorpayOrderMutation,
  useVerifyPaymentMutation,
  useCancelSubscriptionMutation,
  useToggleAutoPayMutation,
} from '@/redux/api/UserSubscriptionPlanApi';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import showToast from '@/toast/showToast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Search, Check, X, ShieldCheck, AlertTriangle,
  RefreshCw, Receipt, CreditCard, CalendarClock,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';

const BuyPlanPage = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isTogglingAutoPay, setIsTogglingAutoPay] = useState(false);
  const plansRef = useRef(null);

  // Mutations
  const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [cancelSubscription] = useCancelSubscriptionMutation();
  const [toggleAutoPay] = useToggleAutoPayMutation();

  // 1. Debounce Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300); // 🟢 Reduced to 300ms for snappier feel
    return () => clearTimeout(handler);
  }, [searchInput]);

  // 2. Fetch Data
  const { data: plans, isLoading: isPlansLoading } = useGetAllPlansQuery();
  // 🟢 use currentData to ensure we only get results for the ACTUAL current term
  const { currentData: searchResults, isLoading: isSearchLoading, isFetching: isSearchFetching, error: searchError } = useGetUserBySearchQuery(debouncedSearch, {
    skip: !debouncedSearch,
    refetchOnMountOrArgChange: true, 
  });

  const {
    data: activeSubData,
    isLoading: isSubLoading,
    isFetching: isSubFetching,
    refetch: refetchSub
  } = useGetUserActiveSubscriptionQuery(selectedSeller?._id, {
    skip: !selectedSeller?._id,
    refetchOnMountOrArgChange: true,
  });

  // 3. Sync Selected Seller & Handle Errors
  useEffect(() => {
    // If we have a valid user result FOR THE CURRENT SEARCH, set it
    if (searchResults?.user && ['MERCHANT', 'SERVICE_PROVIDER', 'GROCERY_SELLER'].includes(searchResults.user.role)) {
      setSelectedSeller(searchResults.user);
    } 
    // If loading or fetching, clear it to prevent old data from sticking
    else if (isSearchLoading || isSearchFetching) {
      if (selectedSeller) setSelectedSeller(null);
    }
    // If finished and no results, ensure it's null
    else if (debouncedSearch && !isSearchLoading && !isSearchFetching) {
      setSelectedSeller(null);
      
      // 🔴 Show Toast on Search Failure
      if (searchError) {
        showToast(searchError?.data?.message || "No users found with matching roles", "error");
      }
    }
  }, [searchResults, debouncedSearch, isSearchLoading, isSearchFetching, searchError]);

  const handleSearchChange = (val) => {
    setSearchInput(val);
    
    // 🟢 Immediate reset when typing something new
    if (selectedSeller && (val.trim() !== selectedSeller.email && val.trim() !== selectedSeller.phone)) {
       setSelectedSeller(null);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPurchaseOpen(false);
    setSelectedPlan(null);
  };

  const handleCancelSubscription = async () => {
    const subId = activeSubData?.subscription?._id;
    if (!subId) return;

    try {
      setIsProcessing(true);
      await cancelSubscription(subId).unwrap();
      showToast("Subscription cancelled. Reverted to Free Plan.", "success");
      setIsCancelDialogOpen(false);
    } catch (error) {
      console.error("Cancellation failed:", error);
      showToast(error?.data?.message || "Failed to cancel subscription", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleAutoPay = async () => {
    const subscription = activeSubData?.subscription;
    if (!subscription) return;

    const currentAutoRenew = subscription.auto_renew;
    
    // Per backend logic, we can only turn it OFF easily. 
    // Turning it ON requires a new checkout usually.
    if (!currentAutoRenew) {
      showToast("To enable Auto-Pay, please assign a new plan or renew.", "info");
      return;
    }

    try {
      setIsTogglingAutoPay(true);
      await toggleAutoPay({ 
        id: subscription._id, 
        auto_renew: !currentAutoRenew 
      }).unwrap();
      showToast(`Auto-Renewal ${!currentAutoRenew ? 'Enabled' : 'Disabled'}`, "success");
    } catch (error) {
      console.error("Toggle AutoPay failed:", error);
      showToast(error?.data?.message || "Failed to update Auto-Pay", "error");
    } finally {
      setIsTogglingAutoPay(false);
    }
  };

  const scrollToPlans = () => {
    if (plansRef.current) {
      plansRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen pb-24 transition-all">
      <div className="bg-slate-900 pb-32 pt-20 text-center relative overflow-hidden">
        {/* Back Button */}
        <div className="absolute top-8 left-8 z-30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-4 gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Back</span>
          </Button>
        </div>

        <Badge className="mb-6 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Sub-Admin Control Panel</Badge>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Manage Seller Subscriptions</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
        {/* Search Card */}
        <Card className="mb-8 shadow-2xl rounded-3xl border-none p-8 bg-white">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Find Merchant Account</Label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              {isSearchLoading ? (
                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />
              ) : (
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              )}
              <Input
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by email or phone number..."
                className="pl-12 pr-10 h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {selectedSeller && (
              <div className="bg-green-50 border border-green-100 px-4 py-2 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 shadow-sm shrink-0">
                <Check className="text-green-600 w-4 h-4" />
                <span className="text-sm font-bold text-slate-700 truncate">{selectedSeller.email}</span>
              </div>
            )}
            {searchError && debouncedSearch && !isSearchLoading && !selectedSeller && (
              <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 shadow-sm shrink-0 max-w-full overflow-hidden">
                <AlertCircle className="text-red-500 w-4 h-4 flex-shrink-0" />
                <span className="text-[11px] font-bold text-red-600 truncate uppercase tracking-tighter italic">
                  {searchError?.data?.message || "Account search failed"}
                </span>
                <X 
                  className="w-3.5 h-3.5 text-red-300 hover:text-red-500 cursor-pointer transition-colors" 
                  onClick={() => setSearchInput('')}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Active Subscription View */}
        {selectedSeller && (
          <div className="mb-12">
            {isSubLoading || isSubFetching ? (
              <Skeleton className="h-96 w-full rounded-3xl" />
            ) : activeSubData?.subscription ? (
              <AdminActivePlanCard 
                data={activeSubData} 
                onUpgrade={scrollToPlans} 
                onCancel={() => setIsCancelDialogOpen(true)}
                onToggleAutoPay={handleToggleAutoPay}
                isTogglingAutoPay={isTogglingAutoPay}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center justify-center gap-3">
                  <AlertTriangle className="text-amber-500 w-5 h-5" />
                  <span className="text-amber-800 font-bold text-sm tracking-wide uppercase">No Active Subscription Found</span>
                </div>
                
                <div className="p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-[#0c1f4d] font-black text-2xl shadow-inner border border-slate-200">
                         {selectedSeller.name?.substring(0, 1).toUpperCase() || "S"}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 leading-tight">
                          {selectedSeller.name || "Selected Seller"}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-wider">
                            {selectedSeller.role === "GROCERY_SELLER" ? "BASEMEMBER" : selectedSeller.role?.replace("_", " ")}
                          </span>
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Ready for Plan Assignment
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[200px]">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Details</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{selectedSeller.email}</p>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">{selectedSeller.phone}</p>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[200px]">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Business Address</p>
                        {searchResults?.address ? (
                          <p className="text-sm font-bold text-slate-700 line-clamp-2">
                            {searchResults.address.address_line_1}, {searchResults.address.city}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-slate-400 italic">No business address found</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <p className="text-slate-500 text-sm max-w-lg font-medium">
                      This account is currently on a lifetime free plan or has no active subscription. 
                      You can assign a new premium plan from the options listed below.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={scrollToPlans}
                      className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold"
                    >
                      View Available Plans
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing Grid */}
        <div ref={plansRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isPlansLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-96 rounded-3xl" />)
          ) : (
            (plans?.data || [])
              .filter(plan => {
                if (!selectedSeller) return true;
                const role = selectedSeller.role;
                const bizType = plan.subscription_plan_id.business_type;

                if (role === 'GROCERY_SELLER') {
                  return bizType === 'grocery_seller';
                }
                if (['MERCHANT', 'SERVICE_PROVIDER'].includes(role)) {
                  return bizType === 'merchant';
                }
                return true;
              })
              .map((plan) => {
              const activePlanId = activeSubData?.subscription?.subscription_plan_id?._id;
              const isActivePlan = plan.subscription_plan_id._id === activePlanId;

              return (
                <Card 
                  key={plan.subscription_plan_id._id} 
                  className={`rounded-3xl border-none shadow-lg bg-white flex flex-col overflow-hidden transition-all hover:shadow-2xl relative ${
                    isActivePlan ? "ring-4 ring-green-500/30 border-2 border-green-500" : ""
                  }`}
                >
                  {isActivePlan && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-green-500 text-white border-none px-3 py-1 font-bold shadow-lg">
                        CURRENT ACTIVE
                      </Badge>
                    </div>
                  )}
                  <CardHeader className={`text-center pt-10 pb-6 ${isActivePlan ? "bg-green-50/50" : "bg-slate-50/50"}`}>
                    <CardTitle className="text-2xl font-bold text-slate-800">{plan.subscription_plan_id.plan_name}</CardTitle>
                    <div className="mt-4 flex items-baseline justify-center gap-1 min-h-[60px]">
                      {plan.subscription_plan_id.plan_code === "FREE" || plan.subscription_plan_id.price <= 1 ? (
                        <span className="text-4xl font-black text-indigo-600 uppercase tracking-widest"></span>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-slate-400">₹</span>
                          <span className="text-5xl font-black text-slate-900">
                            {(plan.subscription_plan_id.price - 1).toLocaleString('en-IN')}
                          </span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-8 py-8 flex-grow">
                    <ul className="space-y-4">
                      {plan.elements.map((el, i) => {
                        const valData = typeof el.value === 'object' ? el.value?.data : el.value;
                        const valUnit = typeof el.value === 'object' ? el.value?.unit : '';
                        const isDisabled = el.is_enabled === false || valData?.toLowerCase() === "no";

                        return (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            {isDisabled ? (
                              <X className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex flex-col">
                              <span className={isDisabled ? "text-slate-400 line-through" : "text-slate-700 font-medium"}>
                                {el.feature_name}
                              </span>
                              {!isDisabled && valData && valData !== "Enable" && valData !== "Yes" && (
                                <span className="text-[10px] font-bold text-indigo-500 uppercase">
                                  {valData} {valUnit || ""}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                  <CardFooter className="p-8 pt-0">
                    <Button
                      disabled={!selectedSeller || isActivePlan}
                      onClick={() => { setSelectedPlan(plan); setIsPurchaseOpen(true); }}
                      className={`w-full cursor-pointer h-14 rounded-2xl font-bold text-lg transition-all ${
                        isActivePlan 
                          ? "bg-green-100 text-green-700 cursor-not-allowed border-2 border-green-200 hover:bg-green-100" 
                          : "bg-[#0c1f4d] hover:bg-[#1a2f63] text-white"
                      }`}
                    >
                      {isActivePlan 
                        ? "Current Active Plan" 
                        : selectedSeller 
                          ? `Assign ${plan.subscription_plan_id.plan_name}` 
                          : 'Search Merchant First'
                      }
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <PurchaseDialog
        open={isPurchaseOpen}
        onOpenChange={setIsPurchaseOpen}
        plan={selectedPlan}
        seller={selectedSeller}
        activePlan={activeSubData?.subscription?.subscription_plan_id}
        oldSubscriptionId={activeSubData?.subscription?._id}
        onPaymentSuccess={handlePaymentSuccess}
        isLoading={isProcessing}
      />

      {/* Cancellation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white p-0 gap-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <div className="p-8 text-center pt-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 mb-6 animate-in zoom-in duration-300 border border-red-100">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Cancel Subscription?</DialogTitle>
            <p className="text-slate-500 font-medium leading-relaxed px-4">
              You are about to cancel the <strong className="text-slate-900 font-bold">{activeSubData?.subscription?.subscription_plan_id?.plan_name}</strong> plan for this seller. 
              Premium features will be revoked and they will be moved to the <span className="text-indigo-600 font-bold">Lifetime Free Plan</span>.
            </p>
          </div>
          <div className="p-8 bg-slate-50 flex gap-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              className="flex-1 h-14 rounded-2xl cursor-pointer bg-white border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-lg transition-all"
            >
              Keep Plan
            </Button>
            <Button
              onClick={handleCancelSubscription}
              disabled={isProcessing}
              className="flex-1 h-14 rounded-2xl cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-lg shadow-red-100 transition-all"
            >
              {isProcessing ? "Processing..." : "Yes, Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AdminActivePlanCard = ({ data, onUpgrade, onCancel, onToggleAutoPay, isTogglingAutoPay }) => {
  const plan = data?.subscription;
  const razorpayOrder = data?.razorpayOrder;
  const razorpayPayment = data?.razorpayPayment;
  const snapshotFeatures = plan?.features_snapshot || [];

  return (
    <Card className="border-none bg-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0c1f4d] p-5 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-indigo-300" />
          <span className="font-bold text-lg tracking-tight">Active Plan Details</span>
        </div>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">ACTIVE</Badge>
      </div>

      <CardContent className="p-8">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-black text-slate-800">{plan?.subscription_plan_id?.plan_name}</h2>
              <div className="mt-2 space-y-1 text-sm text-slate-500">
                 <p className="flex items-center gap-2">
                   <CalendarClock className="w-4 h-4" /> 
                   Expires: {" "}
                   {plan?.end_date && new Date(plan.end_date).getFullYear() > 1970
                     ? new Date(plan.end_date).toLocaleDateString('en-IN', { dateStyle: 'long' })
                     : "Permanent / N/A"}
                 </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">Feature Snapshot</h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {snapshotFeatures.map((f, i) => f.is_enabled && (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-sm border border-slate-100">
                    <span className="text-slate-600 font-medium">{f.feature_name}</span>
                    <span className="font-bold text-indigo-600">
                      {typeof f.value === 'object' ? (f.value?.data || 'Yes') : (f.value || 'Yes')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 flex flex-col justify-center">
            <h4 className="flex items-center gap-2 font-bold mb-6 text-slate-800"><Receipt className="w-5 h-5 text-indigo-600" /> Order Summary</h4>
            {(() => {
                const total = (razorpayOrder?.amount || plan?.total_amount) / 100;
                const gstP = plan?.gst_percentage || 18;
                const base = total / (1 + (gstP / 100));
                const gst = total - base;

                return (
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between border-b border-indigo-100 pb-2">
                       <span className="text-slate-500">Order ID</span>
                       <span className="font-mono text-[10px] font-bold text-slate-400">{razorpayOrder?.id || plan?.razorpay_order_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                       <span className="text-slate-500">Base Amount</span>
                       <span className="text-slate-800 font-bold">₹{base.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                       <span className="text-slate-500">GST ({gstP}%)</span>
                       <span className="text-slate-800 font-bold">₹{gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-black text-indigo-900 border-t-2 border-indigo-200/50 pt-4 mt-2">
                        <span>Total Paid</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                );
            })()}
          </div>

          <div className="space-y-6 flex flex-col justify-between">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 h-full flex flex-col justify-center">
              <h4 className="flex items-center gap-2 font-bold mb-4 text-slate-800"><CreditCard className="w-5 h-5 text-indigo-600" /> Payment Info</h4>
              <div className="space-y-4">
                <div className="flex justify-between text-sm"><span>Method</span><span className="capitalize font-semibold text-slate-600">{razorpayPayment?.method || 'N/A'}</span></div>
                <div className="flex justify-between text-sm"><span>Status</span><span className="text-green-600 font-bold">Captured / Paid</span></div>
                
                {/* Modernized Toggle UI */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div 
                    className={`flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                      plan?.auto_renew 
                        ? 'bg-green-50/50 border-green-200' 
                        : 'bg-amber-50/50 border-amber-200'
                    }`}
                  >
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Auto-Renewal</span>
                       <span className={`text-xs font-bold ${plan?.auto_renew ? 'text-green-700' : 'text-amber-700'}`}>
                         {plan?.auto_renew ? 'ENABLED' : 'DISABLED'}
                       </span>
                    </div>

                    <button
                      onClick={onToggleAutoPay}
                      disabled={isTogglingAutoPay || !plan?.auto_renew}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        plan?.auto_renew ? 'bg-green-500' : 'bg-slate-300 opacity-50 cursor-not-allowed'
                      } ${!isTogglingAutoPay && plan?.auto_renew ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                          plan?.auto_renew ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {!plan?.auto_renew && (
                    <p className="text-[9px] text-amber-600 font-bold italic mt-2 text-center px-4 leading-tight">
                      Renew manually to enable auto-pay
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto pt-4">
              <Button onClick={onUpgrade} className="w-full cursor-pointer h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all">
                <RefreshCw className="w-5 h-5" /> Change Plan
              </Button>
              <Button 
                onClick={onCancel} 
                variant="outline"
                className="w-full h-14 cursor-pointer rounded-2xl border-2 border-red-100 text-red-600 hover:bg-red-50 font-bold flex items-center justify-center gap-2 transition-all"
              >
                <X className="w-5 h-5" /> Cancel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuyPlanPage;
