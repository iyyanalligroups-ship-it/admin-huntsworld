// pages/admin/SubscriptionExtensionHistory.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Search, Loader2, ChevronLeft, ChevronRight, Calendar, User, ShieldCheck } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import SubscriptionDetailsDialog from './SubscriptionDetailsDialog';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const DEFAULT_LIMIT = 10;

export default function SubscriptionExtensionHistory() {
    const [history, setHistory] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
    });
    const { isSidebarOpen } = useSidebar();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
const [selectedUserId, setSelectedUserId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);
// TRIGGER FUNCTION
    const handleRowClick = (userId) => {
        if (!userId) return;
        setSelectedUserId(userId);
        setIsDialogOpen(true);
    };
    // Fetch data when page or search changes
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = {
                    page: pagination.currentPage,
                    limit: DEFAULT_LIMIT,
                };

                if (debouncedSearch) {
                    params.search = debouncedSearch;
                }

                const res = await axios.get(`${API_BASE}/user-subscription-plan/extension-history/all`, {
                    params,
                });

                const { history: data, pagination: pag } = res.data;

                setHistory(data || []);
                setPagination(pag || { currentPage: 1, totalPages: 1, totalItems: 0 });
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load extension history"
                );
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [pagination.currentPage, debouncedSearch]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
            // Scroll to top on mobile when page changes
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading && !history.length) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <span className="ml-4 text-lg text-slate-600">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 md:p-8">
                <Card className="p-8 text-center text-red-600 bg-red-50 border border-red-200">
                    {error}
                </Card>
            </div>
        );
    }

    return (
        <div className={`p-4 transition-all duration-300 ${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>
{/* INTEGRATE DIALOG COMPONENT */}
            <SubscriptionDetailsDialog
                userId={selectedUserId}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Extension History</h1>

                {/* Search */}
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                        placeholder="Search email, phone, code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-11 md:h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 w-full bg-white shadow-sm"
                    />
                </div>
            </div>

            {/* Results info */}
            <p className="text-sm text-slate-600 mb-4">
                Showing {history.length} of {pagination.totalItems} records
                {debouncedSearch && ` matching "${debouncedSearch}"`}
            </p>
            <div class="p-6 border-b border-slate-100 mb-8 bg-slate-50/50">
                <h2 class="text-lg font-bold text-slate-800">Manual Plan Extension</h2>
                <p class="text-sm text-slate-500">Extend merchant duration for discounts or service recovery.</p>
            </div>
            {history.length === 0 ? (
                <Card className="p-12 text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl">
                    No extension records found
                    {debouncedSearch && ` for "${debouncedSearch}"`}
                </Card>
            ) : (
                <>
                    {/* --- DESKTOP VIEW (Table) --- */}
                    <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Owner Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Extended On</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Days Added</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Old Expiry</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">New Expiry</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Admin</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {history.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => handleRowClick(log.user_id?._id)} >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className='text-slate-900 font-medium text-sm'>{log.user_id?.name}</p>
                                            <p className='text-slate-400 text-xs'>{log.user_id?.email || "—"}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            <span className="font-mono bg-slate-100 px-2 py-1 rounded">{log.user_id?.user_code || "—"}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {format(new Date(log.extended_at), "MMM d, yyyy")}
                                            <span className="block text-xs text-slate-400">{format(new Date(log.extended_at), "p")}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                                            +{log.days_extended} days
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {format(new Date(log.old_expires_at), "MMM d, yyyy")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-700 font-semibold">
                                            {format(new Date(log.new_expires_at), "MMM d, yyyy")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className='text-slate-700 text-sm font-medium'>{log.admin_id?.name}</p>
                                            <p className='text-slate-400 text-xs'>{log.admin_id?.email || "—"}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* --- MOBILE VIEW (Cards) --- */}
                    <div className="md:hidden space-y-4">
                        {history.map((log) => (
                            <Card key={log._id} className="p-5 flex flex-col gap-4 shadow-sm cursor-pointer border-slate-200" onClick={() => handleRowClick(log.user_id?._id)}>
                                {/* Header: User Info */}
                                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                                    <div className="flex gap-3">
                                        <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{log.user_id?.name}</p>
                                            <p className="text-xs text-slate-500">{log.user_id?.email}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{log.user_id?.phone}</p>
                                        </div>
                                    </div>
                                    <span className="bg-slate-100 text-slate-600 text-xs font-mono px-2 py-1 rounded">
                                        {log.user_id?.user_code}
                                    </span>
                                </div>

                                {/* Body: Dates Grid */}
                                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                    <div className="space-y-1">
                                        <span className="text-slate-400 text-xs flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Extended On
                                        </span>
                                        <p className="text-slate-700 font-medium">
                                            {format(new Date(log.extended_at), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-slate-400 text-xs">Days Added</span>
                                        <p className="text-green-600 font-bold bg-green-50 w-fit px-2 py-0.5 rounded-md">
                                            +{log.days_extended} Days
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-slate-400 text-xs">Old Expiry</span>
                                        <p className="text-slate-500 line-through decoration-red-400 decoration-2">
                                            {format(new Date(log.old_expires_at), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-slate-400 text-xs">New Expiry</span>
                                        <p className="text-indigo-700 font-bold">
                                            {format(new Date(log.new_expires_at), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer: Admin Info */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Action by: <span className="text-slate-700 font-medium">{log.admin_id?.name}</span></span>
                                    </div>
                                    <span className="text-slate-400">{format(new Date(log.extended_at), "p")}</span>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* --- PAGINATION (Responsive) --- */}
                    <div className="sticky bottom-0 bg-white/80 backdrop-blur-md p-4 border-t border-slate-200 mt-4 -mx-4 md:mx-0 md:bg-transparent md:border-t-0 md:static md:p-0 md:mt-6 md:backdrop-blur-none">
                        <div className="flex items-center justify-between gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={!pagination.hasPrev || loading}
                                className="h-10 px-4 rounded-xl border-slate-300 hover:bg-slate-100 hover:text-indigo-700 disabled:opacity-50"
                            >
                                <ChevronLeft className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Previous</span>
                            </Button>

                            <div className="text-center">
                                <span className="text-sm font-medium text-slate-700">
                                    Page {pagination.currentPage}
                                </span>
                                <span className="text-xs text-slate-500 block">
                                    of {pagination.totalPages}
                                </span>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={!pagination.hasNext || loading}
                                className="h-10 px-4 rounded-xl border-slate-300 hover:bg-slate-100 hover:text-indigo-700 disabled:opacity-50"
                            >
                                <span className="hidden md:inline">Next</span>
                                <ChevronRight className="h-4 w-4 md:ml-2" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
