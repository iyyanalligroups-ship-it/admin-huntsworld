// components/admin/SubscriptionDetailsDialog.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, Zap, Calendar, CreditCard } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function SubscriptionDetailsDialog({ userId, open, onOpenChange }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && userId) {
            const fetchSubscription = async () => {
                setLoading(true);
                try {
                    // Endpoint matches your requirement: find record where user_id == userId
                    const res = await axios.get(`${API_BASE}/user-subscription-plan/extension-history/user/${userId}`);
                    setData(res.data);
                } catch (err) {
                    console.error("Fetch error:", err);
                    setData(null);
                } finally {
                    setLoading(false);
                }
            };
            fetchSubscription();
        }
    }, [open, userId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        Subscription Snapshot
                        {data && (
                            <Badge className={data.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {data.status?.toUpperCase()}
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Full plan details and feature permissions for this merchant.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <p className="mt-2 text-slate-500">Retrieving subscription data...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-6 pb-4">
                            {/* Summary Card */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Active Plan</p>
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-amber-500" />
                                        <span className="font-bold text-slate-800">{data.plan_snapshot?.plan_name}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Expiry Date</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-indigo-500" />
                                        <span className="font-medium text-slate-800">
                                            {format(new Date(data.end_date?.$date || data.end_date), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Transaction Amount:</span>
                                        <span className="font-bold text-slate-900">₹{data.total_amount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Features Grid */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-3">Enabled Features</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {data.features_snapshot?.map((feat, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
                                            <span className="text-xs font-medium text-slate-600">{feat.feature_name}</span>
                                            <Badge variant="secondary" className="text-[10px] bg-indigo-50 text-indigo-700 border-none">
                                                {feat.value?.data} {feat.value?.unit || ""}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Meta Info */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-400">
                                <p>Order ID: <span className="text-slate-600">{data.razorpay_order_id}</span></p>
                                <p>Payment ID: <span className="text-slate-600">{data.razorpay_payment_id}</span></p>
                                <p>Last Renewed: {format(new Date(data.last_renewed_at?.$date || data.last_renewed_at), "Pp")}</p>
                                <p>Created At: {format(new Date(data.createdAt?.$date || data.createdAt), "Pp")}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-500 italic">
                            No active subscription found for this user.
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
