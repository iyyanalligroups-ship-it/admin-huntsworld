import { useState, useContext, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {AlertTriangle, MessageSquare, CheckCircle2, Trash2, Edit, MapPin } from "lucide-react";

import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUploadImagesMutation, useDeleteImageMutation } from "@/redux/api/ComplaintFormImageApi";

import {
  useCreateComplaintFormMutation,
  useUpdateComplaintFormMutation,
  useGetComplaintFormsQuery,
  useDeleteComplaintFormMutation,
} from "@/redux/api/ComplaintFormApi";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import DeleteDialog from "@/model/DeleteModel";
import { User } from "phosphor-react";
import { Trash } from "lucide-react";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const complaintOptions = [
  { label: "Issue with BuyLead/Inquiry", value: "buylead_issue", type: "type1" },
  { label: "Account Activation and Deactivation", value: "account_status", type: "type1" },
  { label: "Account Related", value: "account_related", type: "type1" },
  { label: "IPR Dispute", value: "ipr_dispute", type: "type2" },
  { label: "Complaint of Buyer", value: "buyer_complaint", type: "type3" },
  { label: "Complaint of Supplier", value: "supplier_complaint", type: "type3" },
  { label: "Others", value: "others", type: "type1" },
];

const ComplaintList = ({ onEdit, user }) => {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteId, setDeleteId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [deleteComplaint] = useDeleteComplaintFormMutation();
  const navigate = useNavigate();

  const { data: complaintsData, isLoading, error, refetch } = useGetComplaintFormsQuery({
    page,
    limit: itemsPerPage,
    type: filter === "all" ? undefined : complaintOptions.find(opt => opt.value === filter)?.type,
    option: filter === "all" ? undefined : filter,
    userId: user?.user?._id,
  });

  const [displayedComplaints, setDisplayedComplaints] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const userId = user?.user?._id;
  const { data: currentUser } = useGetUserByIdQuery(userId, { skip: !userId });

  const currentPagePath = "others/complaint";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions.includes("edit") || false;
  const canDelete = pagePermissions?.actions.includes("delete") || false;

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const { setSelectedUser } = useSelectedUser();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (complaintsData?.complaints) {
      setDisplayedComplaints(complaintsData.complaints);
    }
  }, [complaintsData]);

  useEffect(() => {
    if (error) {
      toast.error(`Failed to fetch complaints: ${error.data?.message || error.message || "Unknown error"}`);
    }
  }, [error]);

  const totalComplaints = complaintsData?.pagination?.total || 0;
  const totalPages = totalComplaints > 0 ? Math.ceil(totalComplaints / itemsPerPage) : 0;

  const openAddressModal = (address) => {
    setSelectedAddress(address);
    setAddressModalOpen(true);
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "not_seen":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "in_process":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "solved":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    if (!complaintId || !newStatus) return;

    const previous = [...displayedComplaints];

    setDisplayedComplaints(prev =>
      prev.map(c => c._id === complaintId ? { ...c, status: newStatus } : c)
    );

    setIsUpdating(true);

    try {
      const url = `${import.meta.env.VITE_API_URL}/complaint-form/${complaintId}`;
      await axios.patch(url, { status: newStatus }, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Status updated");
    } catch (err) {
      setDisplayedComplaints(previous);
      toast.error("Failed to update status");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = (id) => {
    setIsDialogOpen(true);
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      await deleteComplaint(deleteId).unwrap();
      toast.success("Complaint deleted");
      refetch();
    } catch (err) {
      toast.error("Failed to delete complaint");
    } finally {
      setIsDialogOpen(false);
    }
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleUserId = (userId) => {
    setSelectedUser({ _id: userId });
    navigate("/admin-dashboard/chat");
  };

  const getPaginationItems = (isMobileView = false) => {
    const items = [];
    const maxPagesToShow = isMobileView ? 3 : 5;

    if (totalPages >= 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)} isActive={page === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (page > maxPagesToShow) {
      items.push(<PaginationItem key="ellipsis-start"><PaginationEllipsis /></PaginationItem>);
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={page === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (page < totalPages - maxPagesToShow + 1 && totalPages > maxPagesToShow + 1) {
      items.push(<PaginationItem key="ellipsis-end"><PaginationEllipsis /></PaginationItem>);
    }

    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={page === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-bold text-[#0c1f4d] bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 inline-block">
          Manage Complaints
        </h2>
        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {complaintOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* SOP Banner */}
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-rose-600 mt-1 shrink-0" size={24} />
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-rose-900">Complaint & Dispute Resolution SOP</h2>
            <p className="text-sm text-rose-800">
              This dashboard lists grievances submitted by users. Treat these with high priority.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="bg-white/60 p-3 rounded border border-rose-100">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-gray-900 text-sm">1. Investigate</span>
                </div>
                <p className="text-xs text-gray-600">Read details carefully. Contact user if needed.</p>
              </div>
              <div className="bg-white/60 p-3 rounded border border-rose-100">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-gray-900 text-sm">2. Resolve & Close</span>
                </div>
                <p className="text-xs text-gray-600">Update status to "Solved" once resolved.</p>
              </div>
              <div className="bg-white/60 p-3 rounded border border-rose-100">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-gray-900 text-sm">3. Remove Spam</span>
                </div>
                <p className="text-xs text-gray-600">Delete fake/abusive complaints.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Mobile or Desktop */}
      {isMobile ? (
        <div className="space-y-5">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">Failed to load complaints</div>
          ) : displayedComplaints.length > 0 ? (
            <>
              {displayedComplaints.map(complaint => (
                <Card key={complaint._id} className="overflow-hidden border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2 bg-gray-50">
                    <CardTitle className="text-base">
                      {complaintOptions.find(o => o.value === complaint.option)?.label || complaint.option}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {complaint?.user_id?.name || "Unknown"}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-3 space-y-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Description</p>
                      <p className="mt-1 text-gray-600 whitespace-pre-wrap break-words">
                        {complaint.details?.complaint_description || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 mb-1.5">Status</p>
                      <div className="flex items-center gap-3">
                        <Badge className={`px-3 py-1 ${getStatusStyles(complaint.status)}`}>
                          {complaint.status === "not_seen" ? "Not Seen" :
                           complaint.status === "in_process" ? "In Process" : "Solved"}
                        </Badge>

                        <select
                          value={complaint.status || "not_seen"}
                          onChange={e => handleStatusChange(complaint._id, e.target.value)}
                          disabled={isUpdating}
                          className={`w-full max-w-[160px] rounded-md border py-1.5 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 ${getStatusStyles(complaint.status)}`}
                        >
                          <option value="not_seen">Not Seen</option>
                          <option value="in_process">In Process</option>
                          <option value="solved">Solved</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {user?.user?.role?.role !== "ADMIN" && (
                        <Button variant="outline" size="sm" onClick={() => onEdit(complaint)}>
                          <Edit size={14} className="mr-1.5" /> Edit
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(complaint._id)}
                      >
                        <Trash size={14} className="mr-1.5" /> Delete
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleUserId(complaint?.user_id?._id)}
                      >
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {totalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent className="flex-wrap justify-center gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(page - 1)}
                        className={page === 1 ? "opacity-50 pointer-events-none" : ""}
                      />
                    </PaginationItem>
                    {getPaginationItems(true)}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(page + 1)}
                        className={page === totalPages ? "opacity-50 pointer-events-none" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">No complaints found</div>
          )}
        </div>
      ) : (
        /* ────────────────────────────────────────────────
           DESKTOP TABLE VIEW
        ──────────────────────────────────────────────── */
        <div className="border rounded-lg overflow-hidden bg-white">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-600">Failed to load complaints</div>
          ) : displayedComplaints.length > 0 ? (
            <Table>
              <TableHeader className="bg-[#0c1f4d]">
                <TableRow>
                  <TableCell className="text-white">Customer Name</TableCell>
                  <TableCell className="text-white">Email / Phone</TableCell>
                  <TableCell className="text-white">Address</TableCell>
                  <TableCell className="text-white">Complaint Type</TableCell>
                  <TableCell className="text-white">Description</TableCell>
                  <TableCell className="text-white">Status</TableCell>
                  <TableCell className="text-white">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedComplaints.map(complaint => (
                  <TableRow key={complaint._id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {complaint?.user_id?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {complaint?.user_id?.email || complaint?.user_id?.phone || "—"}
                    </TableCell>
                    <TableCell>
                      {complaint?.user_id?.personal_address ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => openAddressModal(complaint.user_id.personal_address)}
                        >
                          <MapPin size={16} className="mr-1" />
                          View
                        </Button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {complaintOptions.find(o => o.value === complaint.option)?.label || complaint.option}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {complaint.details?.complaint_description || "—"}
                    </TableCell>
                    <TableCell>
                      <select
                        value={complaint.status || "not_seen"}
                        onChange={e => handleStatusChange(complaint._id, e.target.value)}
                        disabled={isUpdating}
                        className={`w-36 rounded-md border py-1.5 px-3 text-sm font-medium focus:outline-none focus:ring-2 ${getStatusStyles(complaint.status)}`}
                      >
                        <option value="not_seen">Not Seen</option>
                        <option value="in_process">In Process</option>
                        <option value="solved">Solved</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleDelete(complaint._id)}>
                          <Trash size={16} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleUserId(complaint?.user_id?._id)}>
                          Chat
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-gray-500">No complaints found</div>
          )}
        </div>
      )}

      {/* Address Modal */}
      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Customer Address
            </DialogTitle>
            <DialogDescription>
              Personal address details
            </DialogDescription>
          </DialogHeader>
          {selectedAddress && (
            <div className="space-y-3 py-4 text-sm">
              <div className="flex gap-3">
                <span className="font-semibold text-gray-700 min-w-[70px]">City:</span>
                <span>{selectedAddress.city || "N/A"}</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-gray-700 min-w-[70px]">State:</span>
                <span>{selectedAddress.state || "N/A"}</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-gray-700 min-w-[70px]">Country:</span>
                <span>{selectedAddress.country || "N/A"}</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-gray-700 min-w-[70px]">Pincode:</span>
                <span>{selectedAddress.pincode || "N/A"}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setAddressModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pagination - shown for both views when needed */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent className="flex-wrap justify-center sm:justify-end gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={page === 1 ? "opacity-50 pointer-events-none" : ""}
              />
            </PaginationItem>
            {getPaginationItems(isMobile)}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                className={page === totalPages ? "opacity-50 pointer-events-none" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Complaint?"
        description="This action cannot be undone."
      />
    </div>
  );
};



const ComplaintForm = () => {
  const { user } = useContext(AuthContext);
  console.log(user, "user");

  const [selectedOption, setSelectedOption] = useState(null);
  const [uploadedImages, setUploadedImages] = useState({
    court_order_attachment: [],
    related_attachment: [],
    attachment_1: [],
  });
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    user_id: user?.user?._id,
    complaint_description: "",
    ipr_type: "",
    brand_name: "",
    court_order: "",
    court_order_attachment: [],
    infringing_urls: "",
    you_are: "",
    agreement: false,
    buyer_name: "",
    buyer_mobile: "",
    product_name: "",
    supplier_name: "",
    supplier_mobile: "",
    supplier_product_name: "",
    related_attachment: [],
    attachment_1: [],
    copyright_title: "",
  });
  const [charCount, setCharCount] = useState(3000);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(null);
  const [uploadImage] = useUploadImagesMutation();
  const [deleteImage] = useDeleteImageMutation();
  const [createComplaintForm] = useCreateComplaintFormMutation();
  const [updateComplaintForm] = useUpdateComplaintFormMutation();
  const [deleteComplaintForm] = useDeleteComplaintFormMutation();

  const parseAttachments = (attachments) => {
    try {
      return attachments.map((attachment) => JSON.parse(attachment));
    } catch (error) {
      console.error("Error parsing attachments:", error);
      return [];
    }
  };

  const handleOptionChange = (value) => {
    const opt = complaintOptions.find((o) => o.label === value);
    setSelectedOption(opt);
    setFormData({
      user_id: user?.user?._id || "",
      complaint_description: "",
      ipr_type: "",
      brand_name: "",
      court_order: "",
      court_order_attachment: [],
      infringing_urls: "",
      you_are: "",
      agreement: false,
      buyer_name: "",
      buyer_mobile: "",
      product_name: "",
      supplier_name: "",
      supplier_mobile: "",
      supplier_product_name: "",
      related_attachment: [],
      attachment_1: [],
      copyright_title: "",
    });
    setUploadedImages({
      court_order_attachment: [],
      related_attachment: [],
      attachment_1: [],
    });
    setCharCount(3000);
    setError("");
  };

  const handleEdit = (edit) => {
    setIsEditMode(edit);
    console.log(edit, "selected complaint");

    const selectedOption = complaintOptions.find((opt) => opt.value === edit.option);

    if (!selectedOption) {
      console.error("Selected option not found in complaintOptions:", edit.option);
      toast.error("Invalid complaint type selected");
      return;
    }

    const courtOrderAttachments = parseAttachments(edit.details?.court_order_attachment || []);
    const relatedAttachments = parseAttachments(edit.details?.related_attachment || []);
    const attachment1 = parseAttachments(edit.details?.attachment_1 || []);

    setFormData({
      user_id: user?.user?._id || "",
      complaint_description: edit.details?.complaint_description || "",
      ipr_type: edit.details?.ipr_type || "",
      brand_name: edit.details?.brand_name || "",
      court_order: edit.details?.court_order || "",
      court_order_attachment: courtOrderAttachments,
      infringing_urls: edit.details?.infringing_urls || "",
      you_are: edit.details?.you_are || "",
      agreement: edit.details?.agreement || false,
      buyer_name: edit.details?.buyer_name || "",
      buyer_mobile: edit.details?.buyer_mobile || "",
      product_name: edit.details?.product_name || "",
      supplier_name: edit.details?.supplier_name || "",
      supplier_mobile: edit.details?.supplier_mobile || "",
      supplier_product_name: edit.details?.supplier_product_name || "",
      related_attachment: relatedAttachments,
      attachment_1: attachment1,
      copyright_title: edit.details?.copyright_title || "",
    });

    setUploadedImages({
      court_order_attachment: courtOrderAttachments,
      related_attachment: relatedAttachments,
      attachment_1: attachment1,
    });

    setSelectedOption(selectedOption);
    setCharCount(3000 - (edit.details?.complaint_description?.length || 0));
  };

  const handleChange = async (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      const selectedFiles = files;

      if (selectedFiles.length > 0) {
        const formDataToSend = new FormData();
        for (const file of selectedFiles) {
          formDataToSend.append("files", file);
        }

        formDataToSend.append("entity_type", "complaint_form");
        const complaintName =
          selectedOption.type === "type2" ? "IPR_dispute" : "complaint_of_buyer_and_seller";

        formDataToSend.append("complaint_name", complaintName);

        try {
          const res = await uploadImage(formDataToSend).unwrap();
          const urls = res.files;

          setUploadedImages((prev) => ({
            ...prev,
            [name]: [...(prev[name] || []), ...urls],
          }));

          setFormData((prev) => ({
            ...prev,
            [name]: [...(prev[name] || []), ...urls],
          }));
        } catch (err) {
          console.error("File upload failed:", err);
          toast.error("Failed to upload files");
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (name === "complaint_description") {
        setCharCount(3000 - value.length);
        if (value.length < 30) {
          setError("Minimum 30 characters required");
        } else {
          setError("");
        }
      }
    }
  };

  const handleDeleteImage = async (fieldName, url) => {
    const filename = url.fileUrl.split("/").pop();
    const complainName = url.fileUrl.split("/");
    const complaint_name = complainName[complainName.length - 2];

    try {
      await deleteImage({
        entity_type: "complaint_form",
        complaint_name: complaint_name || "default_name",
        filename,
      }).unwrap();

      setUploadedImages((prev) => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((item) => item.fileUrl !== url.fileUrl),
      }));

      setFormData((prev) => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((item) => item.fileUrl !== url.fileUrl),
      }));

      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Image delete failed:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      setError("Please select complaint type");
      return;
    }

    if (selectedOption.type === "type1") {
      if (!formData.complaint_description || formData.complaint_description.length < 30) {
        setError("Minimum 30 characters required in complaint description");
        return;
      }
    } else if (selectedOption.type === "type2") {
      if (!formData.ipr_type) {
        setError("Please select an IPR complaint type");
        return;
      }
      if (!formData.brand_name) {
        setError("Please enter a brand name");
        return;
      }
      if (!formData.agreement) {
        setError("You must agree to the terms and conditions");
        return;
      }
    } else if (selectedOption.type === "type3") {
      if (
        !formData.buyer_name &&
        !formData.supplier_name &&
        !formData.attachment_1.length
      ) {
        setError("Please fill in at least one field for the complaint");
        return;
      }
    }

    const details = {
      complaint_description: formData.complaint_description || "",
      ipr_type: formData.ipr_type || "",
      brand_name: formData.brand_name || "",
      court_order: formData.court_order || "",
      court_order_attachment: formData.court_order_attachment.length
        ? formData.court_order_attachment.map((v) => JSON.stringify(v))
        : [],
      infringing_urls: formData.infringing_urls || "",
      you_are: formData.you_are || "",
      agreement: formData.agreement || false,
      buyer_name: formData.buyer_name || "",
      buyer_mobile: formData.buyer_mobile || "",
      product_name: formData.product_name || "",
      supplier_name: formData.supplier_name || "",
      supplier_mobile: formData.supplier_mobile || "",
      supplier_product_name: formData.supplier_product_name || "",
      related_attachment: formData.related_attachment.length
        ? formData.related_attachment.map((v) => JSON.stringify(v))
        : [],
      attachment_1: formData.attachment_1.length
        ? formData.attachment_1.map((v) => JSON.stringify(v))
        : [],
      copyright_title: formData.copyright_title || "",
    };

    if (selectedOption.type === "type1") {
      delete details.ipr_type;
      delete details.brand_name;
      delete details.court_order;
      delete details.court_order_attachment;
      delete details.infringing_urls;
      delete details.you_are;
      delete details.agreement;
      delete details.buyer_name;
      delete details.buyer_mobile;
      delete details.product_name;
      delete details.supplier_name;
      delete details.supplier_mobile;
      delete details.supplier_product_name;
      delete details.related_attachment;
      delete details.attachment_1;
      delete details.copyright_title;
    } else if (selectedOption.type === "type2") {
      delete details.complaint_description;
      delete details.buyer_name;
      delete details.buyer_mobile;
      delete details.product_name;
      delete details.supplier_name;
      delete details.supplier_mobile;
      delete details.supplier_product_name;
      delete details.attachment_1;
    } else if (selectedOption.type === "type3") {
      delete details.complaint_description;
      delete details.ipr_type;
      delete details.brand_name;
      delete details.court_order;
      delete details.court_order_attachment;
      delete details.infringing_urls;
      delete details.you_are;
      delete details.agreement;
      delete details.related_attachment;
      delete details.copyright_title;
      if (selectedOption.value === "buyer_complaint") {
        delete details.supplier_name;
        delete details.supplier_mobile;
        delete details.supplier_product_name;
      } else if (selectedOption.value === "supplier_complaint") {
        delete details.buyer_name;
        delete details.buyer_mobile;
        delete details.product_name;
      }
    }

    const payload = {
      type: selectedOption.type,
      option: selectedOption.value,
      user_id: user?.user?._id || "",
      details,
    };

    console.log("Submitting payload:", JSON.stringify(payload, null, 2));

    try {
      if (isEditMode) {
        await updateComplaintForm({ id: isEditMode._id, body: payload }).unwrap();
        toast.success("Complaint updated successfully");
      } else {
        await createComplaintForm(payload).unwrap();
        toast.success("Complaint submitted successfully");
      }

      setFormData({
        user_id: user?.user?._id || "",
        complaint_description: "",
        ipr_type: "",
        brand_name: "",
        court_order: "",
        court_order_attachment: [],
        infringing_urls: "",
        you_are: "",
        agreement: false,
        buyer_name: "",
        buyer_mobile: "",
        product_name: "",
        supplier_name: "",
        supplier_mobile: "",
        supplier_product_name: "",
        related_attachment: [],
        attachment_1: [],
        copyright_title: "",
      });
      setUploadedImages({
        court_order_attachment: [],
        related_attachment: [],
        attachment_1: [],
      });
      setSelectedOption(null);
      setIsEditMode(null);
      setCharCount(3000);
      setError("");
    } catch (err) {
      console.error("Error submitting complaint:", err);
      toast.error(`Failed to submit complaint: ${err.data?.message || err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto text-center mt-12 p-4">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Login Required</h2>
        <p className="text-gray-700 mb-6">
          You need to be logged in to submit a complaint.
        </p>
        <a
          href="/login"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Login Now
        </a>
      </div>
    );
  }

  return (
    <div className="lg:px-4 sm:px-6">

      {/* {
       user?.user?.role?.role != "ADMIN" &&
       <Card className="w-full" ref={formRef}>
         <h2 className="text-md border-1 border-[#0c1f4d] mb-3 w-fit text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Add Complaint</h2>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg lg:text-xl">
            <span className="text-[#0c1f4d]">Huntswolrd</span>{" "}
            <span className="text-red-500">Complaint Form</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Select Complaint Type</Label>
            <Select
              onValueChange={handleOptionChange}
              value={selectedOption?.label || ""}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Select Complaint Type --" />
              </SelectTrigger>
              <SelectContent>
                {complaintOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.label}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOption && (
            <>
              {selectedOption.type === "type1" && (
                <div className="space-y-2">
                  <Textarea
                    name="complaint_description"
                    placeholder="Describe your complaint *"
                    value={formData.complaint_description}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                  />
                  <p className="text-xs sm:text-sm text-gray-600">
                    Characters remaining: {charCount}
                  </p>
                </div>
              )}

              {selectedOption.type === "type2" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                    <Label
                      htmlFor="ipr_type"
                      className="text-sm sm:text-base sm:text-right break-words"
                    >
                      Select Complaint Type
                    </Label>
                    <div className="sm:col-span-2">
                      <Select
                        onValueChange={(value) =>
                          handleChange({ target: { name: "ipr_type", value } })
                        }
                        value={formData.ipr_type}
                      >
                        <SelectTrigger className="w-full text-sm sm:text-base">
                          <SelectValue placeholder="-- Select IPR Complaint --" />
                        </SelectTrigger>
                        <SelectContent>
                          {iprOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.ipr_type === "Copyright Violation" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                      <Label
                        htmlFor="copyright_title"
                        className="text-sm sm:text-base sm:text-right break-words"
                      >
                        Copyright Work Title
                      </Label>
                      <Input
                        id="copyright_title"
                        name="copyright_title"
                        placeholder="e.g., Logo Design"
                        className="w-full sm:col-span-2 text-sm sm:text-base"
                        value={formData.copyright_title}
                        onChange={handleChange}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                    <Label
                      htmlFor="related_attachment"
                      className="text-sm sm:text-base sm:text-right break-words"
                    >
                      Upload Supporting Documents
                    </Label>
                    <div className="flex flex-col gap-3 w-full sm:col-span-2">
                      <div className="relative w-full">
                        <Input
                          id="related_attachment"
                          type="file"
                          multiple
                          accept="*"
                          name="related_attachment"
                          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={handleChange}
                        />
                        <div className="flex items-center justify-center gap-2 border border-dashed border-gray-400 rounded-xl p-3 bg-gray-50 hover:bg-gray-100 transition">
                          <UploadCloud className="w-5 h-5 text-red-500" />
                          <span className="text-xs sm:text-sm text-gray-700 text-center">
                            Choose Supporting Documents
                          </span>
                        </div>
                      </div>

                      {uploadedImages?.related_attachment?.length > 0 && (
                        <div className="overflow-x-auto">
                          <ul className="flex flex-wrap gap-2">
                            {uploadedImages.related_attachment.map((url, index) => (
                              <li
                                key={index}
                                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border flex-shrink-0"
                              >
                                <img
                                  src={url?.fileUrl}
                                  alt={`uploaded-${index}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage("related_attachment", url)}
                                  className="absolute top-0 right-0 bg-black bg-opacity-50 text-white p-1 rounded-bl-md hover:bg-red-600 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedOption.type === "type3" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                    <Label
                      htmlFor="buyer_name"
                      className="text-sm sm:text-base sm:text-right break-words"
                    >
                      Buyer Name
                    </Label>
                    <Input
                      id="buyer_name"
                      name="buyer_name"
                      placeholder="Buyer Name"
                      value={formData.buyer_name}
                      onChange={handleChange}
                      className="w-full sm:col-span-2 text-sm sm:text-base"
                    />
                  </div>
                </div>
              )}

              {selectedOption.type === "type2" && (
                <div className="flex items-start gap-2 sm:gap-4">
                  <Checkbox
                    id="agreement"
                    name="agreement"
                    checked={formData.agreement}
                    onChange={handleChange}
                  />
                  <Label htmlFor="agreement" className="text-sm sm:text-base break-words">
                    I agree to the terms and conditions
                  </Label>
                </div>
              )}

              <Button className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c204de9] w-full text-sm sm:text-base" onClick={handleSubmit}>
                {isEditMode ? "Update Complaint" : "Submit Complaint"}
              </Button>

              {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}
            </>
          )}
        </CardContent>
      </Card>
     } */}

      <div className="mt-5 max-w-full" >
        <ComplaintList onEdit={handleEdit} user={user} formRef={formRef} />
      </div>
    </div>
  );
};

export default ComplaintForm;
