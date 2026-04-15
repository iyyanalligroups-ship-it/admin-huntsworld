import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Loader2, Download, FileText, Search, Check } from 'lucide-react';
import showToast from '@/toast/showToast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import {
    useGetUserBySearchQuery,
} from '@/redux/api/UserSubscriptionPlanApi';

const AdminPaymentHistory = () => {
    const { isSidebarOpen } = useSidebar();

    // Search states
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedSeller, setSelectedSeller] = useState(null);

    // RTK Query hook for searching user
    const {
        data: searchResults,
        isLoading: isSearchLoading,
        error: searchError
    } = useGetUserBySearchQuery(debouncedSearch, {
        skip: !debouncedSearch,
    });

    // Payment history states
    const [history, setHistory] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 500);

        return () => clearTimeout(handler);
    }, [searchInput]);

    // Reset selected seller when input changes
    useEffect(() => {
        setSelectedSeller(null);
    }, [searchInput]);

    // Handle search results and validate role
    useEffect(() => {
        if (!debouncedSearch) {
            setSelectedSeller(null);
            return;
        }
        if (isSearchLoading) return;

        if (searchResults?.user && ['MERCHANT', 'SERVICE_PROVIDER'].includes(searchResults.user.role)) {
            setSelectedSeller(searchResults.user);
        } else if (debouncedSearch && !isSearchLoading) {
            setSelectedSeller(null);
        }
    }, [searchResults, debouncedSearch, isSearchLoading]);

    // Fetch payment history when seller is selected
    const fetchHistory = async (page = 1) => {
        if (!selectedSeller?._id) return;

        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/payment-history/payment-history/${selectedSeller._id}`,
                { params: { page, limit: pagination.limit } }
            );

            const { data, pagination: pag } = response.data;
            setHistory(data);
            setPagination((prev) => ({ ...prev, ...pag, page }));
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to fetch payment history', 'error');
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedSeller) {
            fetchHistory(pagination.page);
        } else {
            setHistory([]);
            setPagination({ total: 0, page: 1, limit: 10, totalPages: 1 });
        }
    }, [selectedSeller, pagination.page]);

    // --- Helpers ---
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    const getStatusVariant = (status) => {
        const s = status?.toLowerCase();
        if (s === 'paid' || s === 'captured' || s === 'success') return 'default';
        if (s === 'pending') return 'outline';
        return 'destructive';
    };

    const getDetailedDesc = (p) => {
        if (p.payment_type === 'subscription') return p.subscription_plan_id?.plan_name || 'Subscription';
        if (p.payment_type === 'banner') return p.banner_id?.title || 'Banner Ad';
        if (p.payment_type === 'e_book') return p.ebook_id?.title || 'E-Book';
        if (p.payment_type === 'trust_seal') return 'Trust Seal';
        if (p.payment_type === 'trending_point') return 'Trending Points';
        return p.payment_type;
    };

    // --- PDF Export ---
    const exportToPDF = (p) => {
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.setTextColor(40);
        doc.text('HUNTSWORLD', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('www.huntsworld.com', 14, 26);
        doc.setDrawColor(200);
        doc.line(14, 30, 196, 30);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('BILL TO:', 14, 40);
        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(`${p.user_id?.name || 'Customer'}`, 14, 46);
        doc.text(`Email: ${p.user_id?.email || 'N/A'}`, 14, 51);
        doc.text(`Phone: ${p.user_id?.phone || 'N/A'}`, 14, 56);

        doc.setFontSize(16);
        doc.text('INVOICE / PAYMENT RECEIPT', 14, 70);
        doc.setFontSize(10);
        doc.text(`Receipt No: ${p.receipt}`, 14, 80);
        doc.text(`Date: ${new Date(p.paid_at).toLocaleString('en-IN')}`, 14, 86);
        doc.text(`Status: ${p.status.toUpperCase()}`, 14, 92);

        const subtotal = p.amount / 100;
        const tax = p.gst_amount / 100;
        const grandTotal = subtotal + tax;

        const tableData = [
            ['Description', getDetailedDesc(p)],
            ['Payment Type', p.payment_type.toUpperCase()],
            ['Transaction ID', p.razorpay_payment_id || 'N/A'],
            ['Order ID', p.razorpay_order_id],
            ['Base Amount (Excl. GST)', `INR ${subtotal.toFixed(2)}`],
            ['GST Percentage', `${p.gst_percentage}%`],
            ['GST Amount', `INR ${tax.toFixed(2)}`],
        ];

        autoTable(doc, {
            startY: 100,
            head: [['Field', 'Details']],
            body: tableData,
            foot: [['TOTAL AMOUNT (Incl. GST)', `INR ${grandTotal.toFixed(2)}`]],
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 11 },
            styles: { cellPadding: 5, fontSize: 10 }
        });

        const finalY = doc.lastAutoTable.finalY;
        doc.setFontSize(11);
        doc.text('Notes:', 14, finalY + 15);
        doc.setFontSize(10);
        doc.setTextColor(80);
        const splitNotes = doc.splitTextToSize(p.notes || 'N/A', 180);
        doc.text(splitNotes, 14, finalY + 22);

        doc.setFontSize(9);
        doc.setTextColor(150);
        const footerY = doc.internal.pageSize.height - 10;
        doc.text('This is a computer-generated receipt and does not require a physical signature.', 14, footerY);

        doc.save(`Huntsworld_Invoice_${p.razorpay_payment_id || p.receipt}.pdf`);
        showToast('Invoice downloaded successfully', 'success');
    };

    const PaymentDetails = ({ p }) => (
        <div className="space-y-4 py-2">
            <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border">
                <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Status</p>
                    <Badge variant={getStatusVariant(p.status)}>{p.status}</Badge>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Method</p>
                    <p className="text-sm font-medium">{p.payment_method || 'Razorpay'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border-b pb-4">
                <div>
                    <p className="text-muted-foreground">Order ID</p>
                    <p className="font-mono break-all">{p.razorpay_order_id}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Payment ID</p>
                    <p className="font-mono break-all text-blue-600">{p.razorpay_payment_id}</p>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                    <span>Amount</span>
                    <span>{formatCurrency(p.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>GST ({p.gst_percentage}%)</span>
                    <span>{formatCurrency(p.gst_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg pt-1">
                    <span>Total Paid</span>
                    <span className="text-primary">{formatCurrency(p.total_amount)}</span>
                </div>
            </div>

            <div className="text-[11px] space-y-1 bg-muted/20 p-2 rounded">
                <p><strong>Paid At:</strong> {new Date(p.paid_at).toLocaleString()}</p>
                <p><strong>Receipt:</strong> {p.receipt}</p>
                <p><strong>Notes:</strong> {p.notes || 'N/A'}</p>
            </div>

            <Button className="w-full mt-2" onClick={() => exportToPDF(p)}>
                <Download className="w-4 h-4 mr-2" /> Download Invoice (PDF)
            </Button>
        </div>
    );

    return (
        <div className={`${isSidebarOpen ? ' lg:ml-52' : ' lg:ml-16'}`}>
            <div className=" p-4 md:p-8 space-y-6">
                <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-48 font-bold inline-block">
                    Sub-Admin: Payment History
                </h1>
                <p className="text-muted-foreground">View payment history for merchants and service providers.</p>

                {/* Search Card */}
                <Card className="mb-12 border-none shadow-2xl bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden">
                    <CardContent className="p-8">
                        <div className="max-w-2xl mx-auto">
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="flex-1">
                                    <Label htmlFor="searchInput" className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 block">
                                        Find Seller Account
                                    </Label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input
                                            id="searchInput"
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            placeholder="Enter email or phone number"
                                            className="pl-12 h-14 rounded-2xl border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50 text-base"
                                        />
                                    </div>
                                </div>

                                {selectedSeller && (
                                    <div className="flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="p-4 rounded-2xl border-2 border-green-100 bg-green-50 flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                <Check className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-green-700 uppercase">Seller Selected</p>
                                                <p className="text-sm font-medium text-slate-700">{selectedSeller.email}</p>
                                                <p className="text-xs text-slate-600">{selectedSeller.name || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isSearchLoading && debouncedSearch && (
                                <p className="text-xs text-indigo-600 mt-2 animate-pulse">Verifying seller details...</p>
                            )}
                            {searchError && (
                                <p className="text-xs text-red-500 mt-2">
                                    {searchError?.data?.message || 'Could not find seller.'}
                                </p>
                            )}
                            {!isSearchLoading && debouncedSearch && !selectedSeller && !searchError && (
                                <p className="text-xs text-red-500 mt-2">
                                    No merchant or service provider found with this email/phone.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment History Content */}
                {!selectedSeller ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Please search and select a merchant to view their payment history.
                    </div>
                ) : loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="animate-spin h-8 w-8" />
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block border rounded-lg shadow-sm">
                            <Table>
                                <TableHeader className="bg-[#0c1f4d] hover:bg-[#0e2d75]">
                                    <TableRow>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Merchant</TableHead>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Payment Type</TableHead>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Description</TableHead>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Amount</TableHead>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Status</TableHead>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Date</TableHead>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No payment history found for this merchant.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        history.map((p) => (
                                            <TableRow key={p._id}>
                                                <TableCell className="text-sm font-medium">
                                                    {p.user_id?.name || p.user_id?.email || 'N/A'}
                                                </TableCell>
                                                <TableCell className="capitalize font-semibold text-blue-600">{p.payment_type}</TableCell>
                                                <TableCell>{getDetailedDesc(p)}</TableCell>
                                                <TableCell className="font-medium">{formatCurrency(p.total_amount)}</TableCell>
                                                <TableCell><Badge variant={getStatusVariant(p.status)}>{p.status}</Badge></TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(p.paid_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={() => { setSelectedPayment(p); setIsDialogOpen(true); }}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => exportToPDF(p)}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                            {history.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        No payment history found for this merchant.
                                    </CardContent>
                                </Card>
                            ) : (
                                history.map((p) => (
                                    <Card key={p._id}>
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="text-muted-foreground">Merchant:</span>
                                                <span className="font-medium">{p.user_id?.name || p.user_id?.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <Badge variant="secondary">{p.payment_type}</Badge>
                                                <Badge variant={getStatusVariant(p.status)}>{p.status}</Badge>
                                            </div>
                                            <CardTitle className="text-sm mt-2">{getDetailedDesc(p)}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0 flex justify-between items-center">
                                            <span className="font-bold">{formatCurrency(p.total_amount)}</span>
                                            <Button
                                                size="sm"
                                                onClick={() => { setSelectedPayment(p); setIsDialogOpen(true); }}
                                            >
                                                Details
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        {pagination.totalPages > 1 && (
                            <Pagination className="justify-end">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            className="cursor-pointer"
                                            onClick={() => pagination.page > 1 && setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        />
                                    </PaginationItem>
                                    <PaginationItem><PaginationLink isActive>{pagination.page}</PaginationLink></PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext
                                            className="cursor-pointer"
                                            onClick={() => pagination.page < pagination.totalPages && setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </>
                )}

                {/* Transaction Details Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Transaction Details
                            </DialogTitle>
                            <DialogDescription>Full breakdown of the payment.</DialogDescription>
                        </DialogHeader>
                        {selectedPayment && <PaymentDetails p={selectedPayment} />}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminPaymentHistory;
