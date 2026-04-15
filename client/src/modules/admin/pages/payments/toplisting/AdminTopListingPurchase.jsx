import { useState, useEffect } from 'react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { 
    useGetActiveTopListingQuery, 
    useCreateTopListingOrderMutation, 
    useVerifyTopListingPaymentMutation,
    useUpgradeTopListingMutation,
    useCancelTopListingMutation,
    useGetTopListingConfigQuery,
    useGetGSTConfigQuery
} from '@/redux/api/TopListingApi';
import { useGetUserBySearchQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { useCheckUserSubscriptionQuery } from '@/redux/api/BannerPaymentApi';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
    Search, 
    Zap, 
    ArrowRight, 
    Loader2, 
    Calendar, 
    Clock, 
    XCircle,
    User,
    TrendingUp,
    AlertCircle
} from "lucide-react";
import showToast from '@/toast/showToast';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import Loader from '@/loader/Loader';

const AdminTopListingPurchase = () => {
    const { isSidebarOpen } = useSidebar();
    
    // Merchant Search States
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedMerchant, setSelectedMerchant] = useState(null);

    // Purchase States
    const [days, setDays] = useState('');
    const [amount, setAmount] = useState(0);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);

    // Handle Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // API Queries
    const { 
        currentData: searchResults, 
        isFetching: isSearching,
        isError: isSearchError 
    } = useGetUserBySearchQuery(debouncedSearch, {
        skip: !debouncedSearch,
    });

    const userId = selectedMerchant?._id;
    const { data: subData, isLoading: isSubLoading } = useCheckUserSubscriptionQuery(userId, {
        skip: !userId,
    });
    const { data: topData, isLoading: isTopLoading, refetch: refetchTopListing } = useGetActiveTopListingQuery(userId, {
        skip: !userId,
    });
    const { data: priceConfig } = useGetTopListingConfigQuery();
    const { data: gstConfig } = useGetGSTConfigQuery();

    // Mutations
    const [createOrder, { isLoading: isCreatingOrder }] = useCreateTopListingOrderMutation();
    const [upgradeOrder, { isLoading: isUpgradingOrder }] = useUpgradeTopListingMutation();
    const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifyTopListingPaymentMutation();
    const [cancelTopListing, { isLoading: isCancelling }] = useCancelTopListingMutation();

    const isAnyActionLoading = isCreatingOrder || isUpgradingOrder || isVerifyingPayment || isCancelling || isRazorpayLoading;

    // Derived Values
    const pricePerDay = priceConfig?.data?.pricePerMonth || 0;
    const gstRate = gstConfig?.data?.gstPercentage || 18;
    const activeTopListing = topData?.activeTopListing;
    
    // Calculate totals
    const subtotal = days ? parseInt(days) * pricePerDay : 0;
    const gstAmount = (subtotal * gstRate) / 100;
    const totalAmount = subtotal + gstAmount;

    const selectMerchant = (merchant) => {
        setSelectedMerchant(merchant);
        setSearchInput("");
        setDays("");
    };

    const handlePurchase = async () => {
        if (!days || parseInt(days) <= 0) {
            showToast('Enter a valid duration (days)', 'error');
            return;
        }

        setIsRazorpayLoading(true);
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) throw new Error('Razorpay failed to load');

            const payload = {
                user_id: userId,
                days: parseInt(days),
                amount: subtotal,
                subscription_id: subData?.subscriptionId,
            };

            let response;
            if (activeTopListing) {
                response = await upgradeOrder({
                    ...payload,
                    old_top_listing_payment_id: activeTopListing._id,
                }).unwrap();
            } else {
                response = await createOrder(payload).unwrap();
            }

            const { order } = response;
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'Top Listing Service',
                description: `${activeTopListing ? 'Extension' : 'Activation'} for ${days} days`,
                order_id: order.id,
                handler: async (rzpResponse) => {
                    try {
                        const verifyRes = await verifyPayment({
                            user_id: userId,
                            razorpay_payment_id: rzpResponse.razorpay_payment_id,
                            razorpay_order_id: rzpResponse.razorpay_order_id,
                            razorpay_signature: rzpResponse.razorpay_signature,
                        }).unwrap();

                        if (verifyRes.success) {
                            showToast(activeTopListing ? 'Plan extended successfully!' : 'Top listing activated!', 'success');
                            setIsCheckoutOpen(false);
                            refetchTopListing();
                        }
                    } catch (err) {
                        showToast('Payment verification failed', 'error');
                    }
                },
                prefill: {
                    name: selectedMerchant?.name || '',
                    email: selectedMerchant?.email || '',
                    contact: selectedMerchant?.phone || '',
                },
                theme: { color: '#0c1f4d' },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            showToast(err.message || 'Payment initiation failed', 'error');
        } finally {
            setIsRazorpayLoading(false);
        }
    };

    const handleCancel = async () => {
        try {
            await cancelTopListing({ 
                user_id: userId,
                top_listing_payment_id: activeTopListing._id 
            }).unwrap();
            showToast('Plan terminated successfully', 'success');
            setIsCancelOpen(false);
            refetchTopListing();
        } catch (err) {
            showToast('Failed to cancel campaign', 'error');
        }
    };

    return (
        <div className={`transition-all duration-300 min-h-screen bg-slate-50 p-6 lg:p-10 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
            {isAnyActionLoading && <Loader />}
            
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Top Listing Purchase</h1>
                    <p className="text-slate-500 text-sm">Manage priority search visibility for merchant accounts</p>
                </div>

                {/* Merchant Selector */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-3 px-6 pt-6">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                            Merchant Discovery
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        {!selectedMerchant ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search merchant by email, phone or name..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all ring-offset-0 focus-visible:ring-1 focus-visible:ring-slate-300"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                    </div>
                                )}

                                {/* Search Results Dropdown */}
                                {debouncedSearch && !isSearching && searchResults?.user && (
                                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
                                        <div 
                                            onClick={() => selectMerchant(searchResults.user)}
                                            className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900 leading-tight">{searchResults.user.name}</span>
                                                <span className="text-xs text-slate-500 mt-0.5">{searchResults.user.email} | {searchResults.user.phone}</span>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                        </div>
                                    </div>
                                )}

                                {debouncedSearch && !isSearching && (isSearchError || !searchResults?.user) && (
                                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-red-100 rounded-md shadow-lg p-4 text-center">
                                        <p className="text-red-500 text-sm font-medium flex items-center justify-center gap-2">
                                            <XCircle className="w-4 h-4" /> No merchant matches "{debouncedSearch}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                                        <User className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 leading-none">{selectedMerchant.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{selectedMerchant.email}</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                        setSelectedMerchant(null);
                                        setSearchInput('');
                                    }}
                                    className="text-slate-500 border-slate-300 h-9"
                                >
                                    Change Merchant
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Dashboard Section */}
                {selectedMerchant && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Status Check Card */}
                        {(isSubLoading || isTopLoading) ? (
                            <Card className="border-slate-200 shadow-sm h-40 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                    <p className="text-sm text-slate-500">Checking visibility status...</p>
                                </div>
                            </Card>
                        ) : !subData?.hasSubscription ? (
                            <Card className="border-red-100 bg-red-50/50 shadow-sm">
                                <CardContent className="p-10 text-center space-y-4">
                                    <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-slate-900">Subscription Required</h3>
                                        <p className="text-slate-600 text-sm max-w-sm mx-auto">
                                            This merchant must have an active Paid Subscription plan before activating Top Listing.
                                        </p>
                                    </div>
                                    <Button className="bg-slate-900" asChild>
                                        <a href="/admin-dashboard/payments/subscriptions">View Subscriptions</a>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Visibility Summary Card */}
                                <Card className="md:col-span-2 border-slate-200 shadow-sm flex flex-col h-full">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                                                Campaign Status
                                            </CardTitle>
                                            {activeTopListing && (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 px-3 py-1">
                                                    ActiveNow
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-center py-6">
                                        {activeTopListing ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time Left</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-black text-slate-900 font-mono">{activeTopListing.remainingDays}</span>
                                                        <span className="text-sm font-bold text-slate-500">Days</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expires On</p>
                                                    <div className="mt-1">
                                                        <span className="text-sm font-bold text-slate-900">
                                                            {new Date(activeTopListing.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 border-dashed">
                                                    <Zap className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <p className="text-slate-400 font-medium">No active campaign</p>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="p-6 pt-0 mt-auto border-t border-slate-100 bg-slate-50/50 flex gap-3">
                                        <Button 
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-11"
                                            onClick={() => setIsCheckoutOpen(true)}
                                        >
                                            {activeTopListing ? 'Extend Duration' : 'Start New Campaign'}
                                        </Button>
                                        {activeTopListing && (
                                            <Button 
                                                variant="outline"
                                                className="border-red-200 text-red-600 h-11 hover:bg-red-50"
                                                onClick={() => setIsCancelOpen(true)}
                                            >
                                                End Early
                                            </Button>
                                        )}
                                    </div>
                                </Card>

                                {/* Quick Info Card */}
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader className="pb-3 px-6 pt-6">
                                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                                            Pricing
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 space-y-5">
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Daily Rate</p>
                                            <p className="text-2xl font-black text-slate-900">₹{pricePerDay.toFixed(0)} <span className="text-xs text-slate-400 font-normal">/ day</span></p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Tax Calculation</p>
                                            <p className="text-lg font-bold text-indigo-700">+{gstRate}% <span className="text-xs font-normal text-slate-500 uppercase tracking-tight">Gst</span></p>
                                        </div>
                                        <ul className="text-xs space-y-2 mt-4 text-slate-500 font-medium leading-relaxed">
                                            <li className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 flex-shrink-0" />
                                                Appear at top of search results
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 flex-shrink-0" />
                                                Increased profile impressions
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-xl">
                    <div className="bg-[#0c1f4d] p-6 text-white border-b border-white/5">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-indigo-400 fill-indigo-400" />
                            {activeTopListing ? 'Extend Visibility' : 'Initialize Campaign'}
                        </DialogTitle>
                        <DialogDescription className="text-indigo-200 text-xs mt-1">
                            Set duration for the merchant's priority listing
                        </DialogDescription>
                    </div>

                    <div className="p-8 space-y-8">
                        <div>
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                Plan Duration
                            </Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 30"
                                    value={days}
                                    onChange={(e) => setDays(e.target.value)}
                                    className="h-14 text-xl font-bold border-slate-200 rounded-xl pl-4 pr-16 bg-slate-50/50 focus:bg-white transition-all ring-offset-0 focus-visible:ring-1 focus-visible:ring-slate-300"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">Days</span>
                            </div>
                        </div>

                        <Card className="bg-slate-50 border-slate-200/60 shadow-none rounded-xl overflow-hidden">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Subtotal</span>
                                    <span className="font-bold text-slate-700">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium font-indigo-600">GST ({gstRate}%)</span>
                                    <span className="font-bold text-slate-700">+ ₹{gstAmount.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-slate-200/60" />
                                <div className="flex justify-between items-end pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                                        <span className="text-4xl font-black text-indigo-950 leading-none mt-1">
                                            ₹{totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <ArrowRight className="h-6 w-6 text-indigo-200 mb-1" />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                                variant="outline" 
                                className="h-12 border-slate-200 text-slate-500 font-bold"
                                onClick={() => setIsCheckoutOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200"
                                onClick={handlePurchase}
                            >
                                Pay Now
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                <DialogContent className="sm:max-w-md rounded-xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 font-bold text-xl">Terminate Campaign Early?</DialogTitle>
                        <DialogDescription className="py-2 text-slate-500 leading-relaxed font-medium">
                            Ending this campaign will immediately remove the merchant from priority search results. 
                            <span className="font-bold ml-1 text-slate-900 italic">This action cannot be undone.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setIsCancelOpen(false)}>
                            Keep Active
                        </Button>
                        <Button variant="destructive" className="flex-1 font-bold shadow-lg shadow-red-200" onClick={handleCancel}>
                            Confirm End
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminTopListingPurchase;
