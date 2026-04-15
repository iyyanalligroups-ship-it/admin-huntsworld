// components/admin/MerchantSubscriptionManager.jsx

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, Search, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";

// ────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ────────────────────────────────────────────────
export default function MerchantSubscriptionManager() {
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const token = sessionStorage.getItem('token');
    const [merchant, setMerchant] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const [extendLoading, setExtendLoading] = useState(false);
    const [extendMessage, setExtendMessage] = useState(null);

    // Date picker state
    const [expiryDate, setExpiryDate] = useState(null);
    const [dateError, setDateError] = useState(null);

    // Ref to control native date input
    const dateInputRef = useRef(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput]);

    // Auto search
    useEffect(() => {
        if (!debouncedSearch) {
            setMerchant(null);
            setSearchError(null);
            return;
        }

        let cancelled = false;

        const doSearch = async () => {
            setSearchLoading(true);
            setSearchError(null);
            setMerchant(null);
            setExtendMessage(null);

            try {
                const response = await axios.get(
                    `${API_BASE}/user-subscription-plan/search-merchant`,
                    {
                        params: { query: debouncedSearch },
                    }
                );

                if (!cancelled) {
                    setMerchant(response.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setSearchError(
                        err.response?.data?.message ||
                        "Could not find merchant. Please check the input."
                    );
                }
            } finally {
                if (!cancelled) {
                    setSearchLoading(false);
                }
            }
        };

        doSearch();

        return () => {
            cancelled = true;
        };
    }, [debouncedSearch]);

    const activeFeature = merchant?.activeFeature || null;

    // Validation
    const validateDate = () => {
        if (!expiryDate) {
            setDateError("Please select a new expiry date");
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiryDate < today) {
            setDateError("Expiry date must be today or in the future");
            return false;
        }

        setDateError(null);
        return true;
    };

    // Submit handler
    const handleExtend = async (e) => {
        e.preventDefault();

        if (!validateDate() || !activeFeature?._id) return;

        setExtendLoading(true);
        setExtendMessage(null);

        const newExpiresAt = new Date(expiryDate);
        newExpiresAt.setHours(23, 59, 59, 999);

        try {
            await axios.patch(
                `${API_BASE}/user-subscription-plan/extend-subscription`,
                {
                    data: {
                        activeFeatureId: activeFeature._id,
                        newExpiresAt: newExpiresAt.toISOString(),
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );


            setExtendMessage({
                type: "success",
                text: "Subscription extended successfully!",
            });

            // Refresh data
            setDebouncedSearch(debouncedSearch);
            setExpiryDate(null);
        } catch (err) {
            setExtendMessage({
                type: "error",
                text:
                    err.response?.data?.message ||
                    "Failed to extend subscription duration",
            });
        } finally {
            setExtendLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Search Card */}
            <Card className="shadow-2xl rounded-3xl border-none p-8 bg-white">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">
                    Find Merchant Account
                </Label>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="relative flex-1 w-full sm:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <Input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by email, phone number, or user code..."
                            className="pl-12 h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-indigo-500 text-base"
                        />
                    </div>

                    {merchant && (
                        <div className="bg-green-50 border border-green-100 px-5 py-3 rounded-2xl flex items-center gap-3 min-w-[220px]">
                            <Check className="text-green-600 h-5 w-5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">
                                    {merchant.user.email}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {merchant.user.user_code || merchant.user.phone || "—"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Loading / Error states */}
            {searchLoading && (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mr-3" />
                    <span className="text-slate-600">Searching merchant...</span>
                </div>
            )}

            {searchError && debouncedSearch && (
                <div className="text-center py-10 text-red-600 bg-red-50 rounded-xl border border-red-100">
                    {searchError}
                </div>
            )}

            {/* Merchant details + Extend form */}
            {merchant && !searchLoading && (
                <Card className="p-8 shadow-xl rounded-3xl bg-gradient-to-br from-indigo-50/30 to-white">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">
                        Merchant Subscription Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div>
                            <p className="text-sm text-slate-500">Email</p>
                            <p className="font-medium break-all">{merchant.user.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">User Code</p>
                            <p className="font-medium">{merchant.user.user_code || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Phone</p>
                            <p className="font-medium">{merchant.user.phone || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Current Expiry</p>
                            <p className="font-semibold text-indigo-700">
                                {activeFeature
                                    ? format(new Date(activeFeature.expires_at), "PPP p")
                                    : "No active subscription found"}
                            </p>
                        </div>
                    </div>

                    {/* Extension Section */}
                    <div className="border-t pt-8">
                        <h3 className="text-xl font-semibold mb-6 text-slate-800">
                            Extend Subscription Duration
                        </h3>

                        {extendMessage && (
                            <div
                                className={cn(
                                    "mb-6 p-4 rounded-xl border",
                                    extendMessage.type === "success"
                                        ? "bg-green-50 border-green-200 text-green-800"
                                        : "bg-red-50 border-red-200 text-red-800"
                                )}
                            >
                                {extendMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleExtend} className="space-y-6">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="expiry-date-hidden">New Expiry Date</Label>

                                {/* Invisible native input */}
                                <input
                                    ref={dateInputRef}
                                    id="expiry-date-hidden"
                                    type="date"
                                    value={expiryDate ? format(expiryDate, "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const selected = new Date(e.target.value);
                                            if (!isNaN(selected.getTime())) {
                                                setExpiryDate(selected);
                                                setDateError(null);
                                            }
                                        }
                                    }}
                                    min={format(new Date(), "yyyy-MM-dd")}
                                    className="sr-only" // completely hidden
                                />

                                {/* Visible custom trigger */}
                                <Button
                                    variant="outline"
                                    type="button"
                                    className={cn(
                                        "w-full sm:w-80 justify-start text-left font-normal h-11 rounded-xl px-4",
                                        !expiryDate && "text-muted-foreground",
                                        dateError && "border-red-500 focus-visible:ring-red-500"
                                    )}
                                    onClick={() => dateInputRef.current?.showPicker()}
                                >
                                    {expiryDate ? format(expiryDate, "PPP") : "Pick a date"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-70" />
                                </Button>

                                <p className="text-sm text-slate-500">
                                    Subscription will expire at the end of the selected day (23:59:59).
                                </p>

                                {dateError && (
                                    <p className="text-sm font-medium text-red-600">{dateError}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={extendLoading || !activeFeature?._id}
                                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 min-w-[180px]"
                            >
                                {extendLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Extending...
                                    </>
                                ) : (
                                    "Extend Subscription"
                                )}
                            </Button>
                        </form>
                    </div>
                </Card>
            )}

            {!merchant && debouncedSearch && !searchLoading && (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No merchant found matching "{debouncedSearch}"
                </div>
            )}
        </div>
    );
}
