import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Mail, CheckCircle, Circle, Loader2, Trash2, CheckCircle2, LifeBuoy } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import showToast from '@/toast/showToast';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';

const Contact = () => {
    const [contacts, setContacts] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('all');
    const [emailForm, setEmailForm] = useState({ to: '', comments: '' });
    const [selectedContact, setSelectedContact] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSending, setIsSending] = useState(false); // NEW: Track email sending state
    const { isSidebarOpen } = useSidebar();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch contacts with pagination and filter
    const fetchContacts = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/contact/fetch-all-contacts-for-admin?page=${page}&limit=10&filter=${filter}`);
            setContacts(response.data.contacts);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            showToast("Failed to fetch contacts", "error");
        }
    };

    // Toggle mark as read
    const handleMarkAsRead = async (id, currentStatus) => {
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/contact/mark-as-read/${id}`, { markAsRead: !currentStatus });
            fetchContacts();
            showToast(currentStatus ? "Marked as Unread" : "Marked as Read", "success");
        } catch (error) {
            console.error('Error updating read status:', error);
            showToast("Failed to update read status", "error");
        }
    };

    // Handle email form submission
    const handleEmailSubmit = async (e) => {
        e.preventDefault();

        if (!emailForm.comments.trim()) {
            showToast("Please add a comment before sending", "error");
            return;
        }

        setIsSending(true); // Start loading

        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/contact/send-email/${selectedContact._id}`, {
                emailSent: true,
                comments: emailForm.comments
            });
            fetchContacts();
            showToast("Email sent successfully!", "success");
            setEmailForm({ to: '', comments: '' });
            setSelectedContact(null);
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error sending email:', error);
            showToast("Failed to send email", "error");
        } finally {
            setIsSending(false); // Stop loading
        }
    };

    // Open dialog and reset form
    const openEmailDialog = (contact) => {
        setSelectedContact(contact);
        setEmailForm({ to: contact.email, comments: '' }); // Reset comment
        setIsDialogOpen(true);
    };

    useEffect(() => {
        fetchContacts();
    }, [page, filter]);

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    // Button enable condition
    const isSendButtonEnabled = emailForm.comments.trim() !== '' && !isSending;

    return (
        <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>
            <div className="container mx-auto lg:p-4">
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-md border-1 w-fit border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
                        Contact Management
                    </h2>
                    <Select onValueChange={setFilter} defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by date" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* SOP / Support Workflow Guide */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6 shadow-sm">
                    <div className="flex items-start gap-3">
                        <LifeBuoy className="text-blue-600 mt-1 shrink-0" size={24} />
                        <div className="space-y-3">
                            <h2 className="text-lg font-bold text-blue-900">
                                Customer Support Ticket SOP
                            </h2>
                            <p className="text-sm text-blue-800">
                                This dashboard tracks incoming "Contact Us" inquiries. Follow this workflow to ensure every query is resolved within 24 hours.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                                {/* Step 1: Triage */}
                                <div className="bg-white/60 p-3 rounded border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-blue-100 text-blue-700 font-bold text-xs px-2 py-0.5 rounded">Step 1</span>
                                        <span className="font-semibold text-gray-900 text-sm">Review Details</span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        Check the <strong>Date & Time</strong> to prioritize urgent or older requests first.
                                    </p>
                                </div>

                                {/* Step 2: Response */}
                                <div className="bg-white/60 p-3 rounded border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mail className="w-3 h-3 text-indigo-600" />
                                        <span className="font-semibold text-gray-900 text-sm">Respond</span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        Click <strong>Send Email</strong> to open the response form, or use the <strong>Phone</strong> number for urgent issues.
                                    </p>
                                </div>

                                {/* Step 3: Status */}
                                <div className="bg-white/60 p-3 rounded border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        <span className="font-semibold text-gray-900 text-sm">Track Status</span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        The system auto-tracks emails sent. Manually click <strong>Mark Read</strong> when the ticket is closed.
                                    </p>
                                </div>

                                {/* Step 4: Clean Up */}
                                <div className="bg-white/60 p-3 rounded border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trash2 className="w-3 h-3 text-red-600" />
                                        <span className="font-semibold text-gray-900 text-sm">Maintenance</span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        If the request is spam or fully resolved and no longer needed, use the <strong>Trash Icon</strong> to remove it.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {!isMobile ? (
                    <Table className="min-w-[800px] w-full divide-y divide-gray-200">
                        <TableHeader className="bg-[#0c1f4d] group-hover:bg-[#0a1d49f7]">
                            <TableRow>
                                <TableHead className="text-white">Name</TableHead>
                                <TableHead className="text-white">Email</TableHead>
                                <TableHead className="text-white">Phone</TableHead>
                                <TableHead className="text-white">Date</TableHead>
                                <TableHead className="text-white">Time</TableHead>
                                <TableHead className="text-white">Read</TableHead>
                                <TableHead className="text-white">Email Sent</TableHead>
                                <TableHead className="text-white">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.map((contact) => (
                                <TableRow key={contact?._id}>
                                    <TableCell>
                                        {contact?.name}
                                        {!contact?.markAsRead && (
                                            <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0 h-4">New</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{contact?.email}</TableCell>
                                    <TableCell>{contact?.phone}</TableCell>
                                    <TableCell>{format(new Date(contact?.createdAt), 'PP')}</TableCell>
                                    <TableCell>{contact?.time}</TableCell>
                                    <TableCell>
                                        {contact?.markAsRead ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-gray-500" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {contact?.emailSent ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-gray-500" />
                                        )}
                                    </TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleMarkAsRead(contact?._id, contact?.markAsRead)}
                                            className="cursor-pointer"
                                        >
                                            {contact?.markAsRead ? 'Mark Unread' : 'Mark Read'}
                                        </Button>

                                        <Dialog open={isDialogOpen && selectedContact?._id === contact._id} onOpenChange={setIsDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEmailDialog(contact)}
                                                    className="cursor-pointer flex items-center gap-1"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                    Send Email
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Send Email</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleEmailSubmit} className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="to">To</Label>
                                                        <Input
                                                            id="to"
                                                            value={selectedContact?.email || ''}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="name">Name</Label>
                                                        <Input
                                                            id="name"
                                                            value={selectedContact?.name || ''}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="phone">Phone</Label>
                                                        <Input
                                                            id="phone"
                                                            value={selectedContact?.phone || ''}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="comments">Comments</Label>
                                                        <Input
                                                            id="comments"
                                                            placeholder="Type your message here..."
                                                            value={emailForm.comments}
                                                            onChange={(e) => setEmailForm({ ...emailForm, comments: e.target.value })}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="submit"
                                                        disabled={!isSendButtonEnabled}
                                                        className="relative cursor-pointer"
                                                    >
                                                        {isSending ? (
                                                            <>
                                                                <svg
                                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <circle
                                                                        className="opacity-25"
                                                                        cx="12"
                                                                        cy="12"
                                                                        r="10"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                    />
                                                                    <path
                                                                        className="opacity-75"
                                                                        fill="currentColor"
                                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                    />
                                                                </svg>
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            "Send Email"
                                                        )}
                                                    </Button>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="space-y-4">
                        {contacts.map((contact) => (
                            <Card key={contact?._id} className="mb-4">
                                <CardHeader>
                                    <CardTitle>{contact?.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p><strong>Email:</strong> {contact?.email}</p>
                                    <p><strong>Phone:</strong> {contact?.phone}</p>
                                    <p><strong>Date:</strong> {format(new Date(contact?.createdAt), 'PP')}</p>
                                    <p><strong>Time:</strong> {contact?.time}</p>
                                    <div className="flex items-center">
                                        <strong>Read:</strong>
                                        {contact?.markAsRead ? (
                                            <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-gray-500 ml-2" />
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <strong>Email Sent:</strong>
                                        {contact?.emailSent ? (
                                            <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-gray-500 ml-2" />
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleMarkAsRead(contact?._id, contact?.markAsRead)}
                                            className="cursor-pointer"
                                        >
                                            {contact?.markAsRead ? 'Mark Unread' : 'Mark Read'}
                                        </Button>

                                        <Dialog open={isDialogOpen && selectedContact?._id === contact._id} onOpenChange={setIsDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEmailDialog(contact)}
                                                    className="cursor-pointer flex items-center gap-1"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                    Send Email
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Send Email</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleEmailSubmit} className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="to">To</Label>
                                                        <Input
                                                            id="to"
                                                            value={selectedContact?.email || ''}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="name">Name</Label>
                                                        <Input
                                                            id="name"
                                                            value={selectedContact?.name || ''}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="phone">Phone</Label>
                                                        <Input
                                                            id="phone"
                                                            value={selectedContact?.phone || ''}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="comments">Comments</Label>
                                                        <Input
                                                            id="comments"
                                                            placeholder="Type your message here..."
                                                            value={emailForm.comments}
                                                            onChange={(e) => setEmailForm({ ...emailForm, comments: e.target.value })}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="submit"
                                                        disabled={!isSendButtonEnabled}
                                                        className="relative cursor-pointer"
                                                    >
                                                        {isSending ? (
                                                            <>
                                                                <svg
                                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <circle
                                                                        className="opacity-25"
                                                                        cx="12"
                                                                        cy="12"
                                                                        r="10"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                    />
                                                                    <path
                                                                        className="opacity-75"
                                                                        fill="currentColor"
                                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                    />
                                                                </svg>
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            "Send Email"
                                                        )}
                                                    </Button>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Pagination className="mt-4 flex justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => handlePageChange(page - 1)}
                                className={page === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        {isMobile ? (
                            <PaginationItem>
                                <PaginationLink isActive>{page}</PaginationLink>
                            </PaginationItem>
                        ) : (
                            [...Array(totalPages)].map((_, index) => (
                                <PaginationItem key={index}>
                                    <PaginationLink
                                        onClick={() => handlePageChange(index + 1)}
                                        isActive={page === index + 1}
                                        className="cursor-pointer"
                                    >
                                        {index + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))
                        )}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => handlePageChange(page + 1)}
                                className={page === totalPages ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
};

export default Contact;
