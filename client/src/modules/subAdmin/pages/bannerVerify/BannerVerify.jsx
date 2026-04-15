import React, { useState, useEffect } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft,
    ChevronRight,
    Trash2,
    Info,
    CheckCircle2,
    ShieldAlert,
    ImagePlus
} from "lucide-react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import noImage from "@/assets/images/no-image.jpg";
import showToast from "@/toast/showToast";

/* -------------------------------------------------- */
/* Parent Component */
/* -------------------------------------------------- */

const BannerVerify = () => {
    const [activeTab, setActiveTab] = useState("pending");
    const [filter, setFilter] = useState("all");
    const { isSidebarOpen } = useSidebar();

    return (
        <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>

            {/* ================= SOP SECTION ================= */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6 shadow-sm">
                <div className="flex items-start gap-3">
                    <Info className="text-blue-600 mt-1 shrink-0" size={24} />
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold text-blue-900">
                            Banner Verification & Management SOP
                        </h2>

                        <p className="text-sm text-blue-800">
                            This dashboard manages merchant banners. Banners are{" "}
                            <strong>hidden from the Home Page</strong> until manually verified
                            by an Admin.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">

                            <div className="flex items-start gap-2 bg-white/60 p-3 rounded border border-blue-100">
                                <CheckCircle2 className="text-green-600 shrink-0" size={18} />
                                <div className="text-sm text-gray-700">
                                    <span className="font-semibold text-gray-900">
                                        Approval Process:
                                    </span>{" "}
                                    Review company details and image quality before verifying.
                                </div>
                            </div>

                            <div className="flex items-start gap-2 bg-white/60 p-3 rounded border border-blue-100">
                                <Trash2 className="text-red-500 shrink-0" size={18} />
                                <div className="text-sm text-gray-700">
                                    <span className="font-semibold text-gray-900">
                                        Image Moderation:
                                    </span>{" "}
                                    Delete inappropriate images without removing merchant data.
                                </div>
                            </div>

                            <div className="flex items-start gap-2 bg-white/60 p-3 rounded border border-blue-100">
                                <ShieldAlert className="text-orange-500 shrink-0" size={18} />
                                <div className="text-sm text-gray-700">
                                    <span className="font-semibold text-gray-900">
                                        Paid vs Free:
                                    </span>{" "}
                                    Premium = Large banner. Free = Rectangle logo.
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            {/* ================================================= */}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-md border border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
                    Banner Management
                </h2>

                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter" />
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

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="pending" className="cursor-pointer">Pending</TabsTrigger>
                    <TabsTrigger value="approved" className="cursor-pointer">Approved</TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    <BannerSection
                        type="pending"
                        filter={filter}
                    />
                </TabsContent>

                <TabsContent value="approved">
                    <BannerSection
                        type="approved"
                        filter={filter}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

/* -------------------------------------------------- */
/* Shared Section Component */
/* -------------------------------------------------- */

const BannerSection = ({ type, filter }) => {
    const [page, setPage] = useState(1);
    const [banners, setBanners] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const limit = 6;

    const endpoint =
        type === "pending"
            ? "fetch-pending-banners-for-admin"
            : "fetch-approved-banners-for-admin";

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/banner-payment/${endpoint}?page=${page}&limit=${limit}&filter=${filter}`
            );
            const data = await res.json();
            if (data.success) {
                setBanners(data.data);
                setTotalPages(data.totalPages);
            }
        } catch {
            showToast("Failed to load banners", "error");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [page, filter, type]);

    const handleVerify = async (id, imageType) => {
        await fetch(
            `${import.meta.env.VITE_API_URL}/banner-payment/toggle-approval/${id}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: imageType === "premium" ? "paid" : "free",
                }),
            }
        );

        fetchData();
    };

    const handleMarkAsRead = async (id) => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/banner-payment/mark-read/${id}`,
                { method: "PUT" }
            );
            if (res.ok) {
                showToast("Marked as read", "success");
                fetchData();
            } else {
                const data = await res.json();
                showToast(data.message || "Failed to mark as read", "error");
            }
        } catch (error) {
            showToast("Network error", "error");
        }
    };

    const handleDelete = async (id, imageType, company_name, imageUrl) => {
        const deleteEndpoint =
            imageType === "premium"
                ? "/banner-image/delete"
                : "/banner-image/rectangle-logo/delete";

        await fetch(
            `${import.meta.env.VITE_API_IMAGE_URL}${deleteEndpoint}`,
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company_name,
                    image_url: imageUrl,
                }),
            }
        );

        await fetch(
            `${import.meta.env.VITE_API_URL}/banner-payment/update/${id}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    imageType === "premium"
                        ? { banner_image: null }
                        : { rectangle_logo: null }
                ),
            }
        );

        fetchData();
    };

    if (loading)
        return <p className="text-center py-10">Loading banners...</p>;

    if (!banners.length)
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center transition-all hover:border-gray-400">
                <div className="rounded-full bg-gray-100 p-3">
                    <ImagePlus className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No banners found</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-xs">
                    Your banner gallery is currently empty. Start by uploading a new promotion or announcement.
                </p>

            </div>
        );

    return (
        <>
            {/* DESKTOP TABLE - visible on md+ */}
            <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#0c1f4d] border-b hover:bg-[#153171] border-gray-300">
                            <TableHead className="text-xs sm:text-sm font-medium text-white">Company</TableHead>
                            <TableHead className="text-xs sm:text-sm font-medium text-white">Type</TableHead>
                            <TableHead className="text-xs sm:text-sm font-medium text-white">Image</TableHead>
                            <TableHead className="text-xs sm:text-sm font-medium text-white">Owner</TableHead>
                            <TableHead className="text-xs sm:text-sm font-medium text-white">Location</TableHead>
                            <TableHead className="text-xs sm:text-sm font-medium text-white">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {banners.map((banner) => (
                            <TableRow key={banner._id + banner.imageType}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={banner.merchant?.company_logo || noImage}
                                            className="w-10 h-10 rounded object-cover"
                                            onError={(e) => (e.target.src = noImage)}
                                            alt="Company logo"
                                        />
                                        <div>
                                            <h4 className="font-medium flex items-center gap-2">
                                                <span>{banner.merchant?.company_name || banner.company_name || "N/A"}</span>
                                                {banner.markAsRead === false && (
                                                    <Badge className="bg-red-500 hover:bg-red-600 text-[10px] px-1.5 py-0 h-4 uppercase">New</Badge>
                                                )}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {banner.user?.email || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <Badge variant="outline">
                                        {banner.imageType === "premium" ? "Premium" : "Rectangle"}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    <Zoom>
                                        <img
                                            src={banner.imageUrl || noImage}
                                            className="w-40 h-24 object-contain border rounded"
                                            alt="Banner"
                                        />
                                    </Zoom>
                                </TableCell>

                                <TableCell>{banner.user?.name || "—"}</TableCell>

                                <TableCell>
                                    {banner.address?.city
                                        ? `${banner.address.city}, ${banner.address.state || ""}`
                                        : "N/A"}
                                </TableCell>

                                <TableCell>
                                    <div className="flex gap-2">
                                        {banner.markAsRead === false && (
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                title="Mark as Read"
                                                onClick={() => handleMarkAsRead(banner.originalBannerId)}
                                            >
                                                <CheckCircle2 size={16} className="text-gray-500" />
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            className="cursor-pointer"
                                            variant={banner.approved ? "outline" : "default"}
                                            onClick={() =>
                                                handleVerify(banner.originalBannerId, banner.imageType)
                                            }
                                        >
                                            {banner.approved ? "Unverify" : "Verify"}
                                        </Button>

                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="cursor-pointer"
                                            onClick={() =>
                                                handleDelete(
                                                    banner.originalBannerId,
                                                    banner.imageType,
                                                    banner.company_name,
                                                    banner.imageUrl
                                                )
                                            }
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* MOBILE CARDS - visible below md */}
            <div className="md:hidden space-y-4">
                {banners.map((banner) => (
                    <div
                        key={banner._id + banner.imageType}
                        className="bg-white border rounded-lg shadow-sm overflow-hidden"
                    >
                        {/* Image at top for mobile */}
                        <div className="p-3 border-b bg-gray-50">
                            <Zoom>
                                <img
                                    src={banner.imageUrl || noImage}
                                    className="w-full h-40 object-contain mx-auto"
                                    alt="Banner"
                                />
                            </Zoom>
                        </div>

                        <div className="p-4 space-y-3">
                            {/* Company / Logo */}
                            <div className="flex items-center gap-3">
                                <img
                                    src={banner.merchant?.company_logo || noImage}
                                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                                    onError={(e) => (e.target.src = noImage)}
                                    alt="Logo"
                                />
                                <div>
                                    <h3 className="font-semibold text-base flex items-center gap-2">
                                        <span>{banner.merchant?.company_name || banner.company_name || "Unknown Company"}</span>
                                        {banner.markAsRead === false && (
                                            <Badge className="bg-red-500 hover:bg-red-600 text-[10px] px-1.5 py-0 h-4 uppercase">New</Badge>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {banner.user?.email || "—"}
                                    </p>
                                </div>
                            </div>

                            {/* Type */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Type:</span>
                                <Badge variant="outline" className="text-xs">
                                    {banner.imageType === "premium" ? "Premium" : "Rectangle"}
                                </Badge>
                            </div>

                            {/* Owner */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Owner:</span>
                                <span className="text-sm">{banner.user?.name || "—"}</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Location:</span>
                                <span className="text-sm">
                                    {banner.address?.city
                                        ? `${banner.address.city}, ${banner.address.state || ""}`
                                        : "N/A"}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2 border-t">
                                {banner.markAsRead === false && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleMarkAsRead(banner.originalBannerId)}
                                    >
                                        <CheckCircle2 size={16} className="mr-1 text-gray-500" /> Read
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant={banner.approved ? "outline" : "default"}
                                    className="flex-1"
                                    onClick={() =>
                                        handleVerify(banner.originalBannerId, banner.imageType)
                                    }
                                >
                                    {banner.approved ? "Unverify" : "Verify"}
                                </Button>

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() =>
                                        handleDelete(
                                            banner.originalBannerId,
                                            banner.imageType,
                                            banner.company_name,
                                            banner.imageUrl
                                        )
                                    }
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination - same for both views */}
            <div className="flex justify-center items-center gap-4 mt-6 flex-wrap">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                >
                    <ChevronLeft size={16} className="mr-1" /> Prev
                </Button>

                <span className="text-sm font-medium">
                    Page {page} of {totalPages}
                </span>

                <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => setPage(page + 1)}
                >
                    Next <ChevronRight size={16} className="ml-1" />
                </Button>
            </div>
        </>
    );
};

export default BannerVerify;
