import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSidebar } from "../../hooks/useSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { io } from "socket.io-client";
import { Edit, Trash2, AlertCircle, LayoutList, GitPullRequest, HelpCircle, CheckCircle, Eye, X, Building2, User, Mail, Phone, ShieldCheck, MapPin, CreditCard, FileText, BadgeCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import StepperProductForm from "@/modules/admin/pages/merchants/forms/MerchantProductForm";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";
import noImage from "@/assets/images/no-image.jpg";

const ITEMS_PER_PAGE = 10;

const OthersProductsTable = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isSidebarOpen } = useSidebar();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const handleSellerClick = (seller) => {
    setSelectedSeller(seller);
    setIsSellerModalOpen(true);
  };

  // Admin usually has full permissions, setting to true for UI consistency
  const canEdit = true;
  const canDelete = true;

  const fetchOthersProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/fetch-others-products?page=${page}&limit=${ITEMS_PER_PAGE}`
      );

      if (response.data.success) {
        setProducts(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setCurrentPage(response.data.pagination?.page || 1);
      } else {
        setError(response.data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching Others products:', err);
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOthersProducts(1);

    // Real-time notifications
    const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/admin-notifications`, {
      reconnection: true,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Other Products] Socket connected');
    });

    socket.on('new-product', () => {
      console.log('[Other Products] New product event received, refreshing...');
      fetchOthersProducts(currentPage);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchOthersProducts(currentPage);
  }, [currentPage]);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingProduct(null);
    fetchOthersProducts(currentPage);
  };

  const handleMarkAsRead = async (productId) => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/products/mark-read/${productId}`);
      if (response.data.success) {
        fetchOthersProducts(currentPage);
        showToast("Product marked as read", "success");
      }
    } catch (err) {
      console.error('Mark as read failed:', err);
      showToast('Failed to mark product as read', 'error');
    }
  };

  const openDeleteDialog = (productId) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/products/delete-products/${productToDelete}`);
      fetchOthersProducts(currentPage);
      showToast("Product deleted successfully", "success");
      closeDeleteDialog();
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryName = (item) =>
    item
      ? item.category_name ||
      item.sub_category_name ||
      item.super_sub_category_name ||
      item.deep_sub_category_name ||
      'Others'
      : '-';

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (loading && products.length === 0) {
    return (
      <div className={`space-y-6 ${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"} transition-all duration-300`}>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"} transition-all duration-300 pb-12`}>

      {/* Re-Classification Header & Guidelines */}
      <div className="space-y-6">
        <div>
          <h1 className="text-md border-1 w-fit mb-4 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
            Other Category Products
          </h1>
          <h2 className="text-3xl font-black text-[#0c1f4d] tracking-tight">
            Re-Classification Hub
          </h2>
          <p className="text-sm text-slate-500 font-medium max-w-2xl">
            Audit and normalize inventory that merchants have listed under "Other/General" categories to maintain taxonomy integrity.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-l-4 border-l-orange-500 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <HelpCircle size={18} className="text-orange-500" />
                1. Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-slate-600 leading-relaxed">
              merchants select <strong>"Other"</strong> when unsure.<br />
              Analyze <strong>Product Name</strong> & <strong>Image</strong> to determine true type.
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <GitPullRequest size={18} className="text-blue-600" />
                2. Remapping
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-slate-600 leading-relaxed">
              Use <strong>Edit</strong> to re-assign.<br />
              Select full chain: Category → Sub → Super Sub → Deep Sub.
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <LayoutList size={18} className="text-purple-600" />
                3. Taxonomy Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-slate-600 leading-relaxed">
              If a product doesn't fit anywhere, create a new <strong>Deep Sub Category</strong> in Master Settings.
            </CardContent>
          </Card>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      ) : products.length === 0 && !loading ? (
        <Card className="rounded-3xl border-dashed border-2 bg-slate-50/50 p-12 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">All caught up!</h3>
          <p className="text-slate-500">No products are currently pending re-classification.</p>
        </Card>
      ) : (
        <Card className="rounded-2xl border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-extrabold text-[#0c1f4d]">
                  Pending Inventory
                </CardTitle>
                <CardDescription className="font-medium text-slate-400">
                  Products requiring manual category assignment
                </CardDescription>
              </div>
              <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-slate-100 text-[#0c1f4d] font-bold border-none">
                {totalItems} total
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-[#0c1f4d] font-bold uppercase text-[10px] tracking-widest pl-6">Hierarchy Path</TableHead>
                    <TableHead className="text-[#0c1f4d] font-bold uppercase text-[10px] tracking-widest">Merchant</TableHead>
                    <TableHead className="text-[#0c1f4d] font-bold uppercase text-[10px] tracking-widest">Product Information</TableHead>
                    <TableHead className="text-[#0c1f4d] font-bold uppercase text-[10px] tracking-widest">Price (₹)</TableHead>
                    <TableHead className="text-[#0c1f4d] font-bold uppercase text-[10px] tracking-widest">Stock</TableHead>
                    <TableHead className="text-[#0c1f4d] font-bold uppercase text-[10px] tracking-widest text-right pr-6">Management</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-600">{getCategoryName(product.category_id)}</span>
                            <span className="text-[10px] text-slate-300">/</span>
                            <span className="text-xs text-slate-500">{getCategoryName(product.sub_category_id)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 italic">
                            <span>{getCategoryName(product.super_sub_category_id)}</span>
                            <span>→</span>
                            <span>{getCategoryName(product.deep_sub_category_id)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 leading-tight">
                          <span 
                            className="font-bold text-[#0c1f4d] text-sm flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-all group/seller"
                            onClick={() => handleSellerClick(product.seller)}
                          >
                            <span className="truncate max-w-[150px]">
                              {product.seller?.company_name || "N/A"}
                            </span>
                            <Eye className="h-3 w-3 opacity-0 group-hover/seller:opacity-100 transition-opacity text-blue-400" />
                          </span>
                          <span className="text-[10px] text-slate-400">
                            @{product.seller?.user_name || "unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                            {product.product_image && product.product_image.length > 0 ? (
                              <img
                                src={product.product_image[0]}
                                alt={product.product_name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.src = noImage;
                                }}
                              />
                            ) : (
                              <img
                                src={noImage}
                                alt="No product"
                                className="h-full w-full object-cover opacity-50"
                              />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#0c1f4d] text-sm group-hover:text-blue-600 transition-colors">
                                {product.product_name?.replace(/-/g, ' ')}
                              </span>
                              {!product.markAsRead && (
                                <span className="flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {product._id?.slice(-8)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[#0c1f4d] text-sm">
                            {product.askPrice ? (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-[10px]">Ask Price</Badge>
                            ) : (
                              `₹${parseFloat(product.price?.$numberDecimal || 0).toLocaleString('en-IN')}`
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className={`font-bold border-none text-[10px] ${product.stock_quantity > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-red-500"}`}>
                           {product.stock_quantity || 0} {product.unitOfMeasurement || ""}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          {!product.markAsRead && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleMarkAsRead(product._id)}
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Mark as Read</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={!canEdit}
                            onClick={() => handleEdit(product)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={!canDelete}
                            onClick={() => openDeleteDialog(product._id)}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-4 bg-slate-50/30">
              {products.map((product) => (
                <Card key={product._id} className="rounded-2xl border-none shadow-sm overflow-hidden">
                  <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[#0c1f4d] text-sm line-clamp-1">
                          {product.product_name?.replace(/-/g, ' ')}
                        </span>
                        {!product.markAsRead && (
                          <Badge variant="destructive" className="h-4 px-1 text-[8px] animate-pulse">NEW</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Hierarchy Path:</p>
                      <p className="text-[10px] text-slate-600 font-bold line-clamp-1">
                        {getCategoryName(product.category_id)} / {getCategoryName(product.sub_category_id)}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-4 border-t mt-3 flex justify-end gap-2 bg-slate-50/50">
                    {!product.markAsRead && (
                      <Button size="sm" variant="ghost" className="h-8 px-3 text-emerald-600 font-bold text-xs" onClick={() => handleMarkAsRead(product._id)}>
                        Read
                      </Button>
                    )}
                    <Button size="sm" variant="outline" disabled={!canEdit} className="h-8 px-3 rounded-lg text-xs" onClick={() => handleEdit(product)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" disabled={!canDelete} className="h-8 px-3 rounded-lg text-red-500 text-xs" onClick={() => openDeleteDialog(product._id)}>
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} entries
                </p>
                <Pagination>
                  <PaginationContent className="gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={`h-9 border-none bg-slate-50 hover:bg-slate-100 rounded-xl transition-all ${currentPage === 1 ? "pointer-events-none opacity-30" : ""}`}
                      />
                    </PaginationItem>

                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .map((pageNum, idx, arr) => (
                          <React.Fragment key={pageNum}>
                            {idx > 0 && arr[idx - 1] !== pageNum - 1 && <span className="text-slate-300 mx-1">...</span>}
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                isActive={pageNum === currentPage}
                                className={`h-9 w-9 border-none rounded-xl font-bold text-xs transition-all ${pageNum === currentPage
                                  ? "bg-[#0c1f4d] text-white shadow-md"
                                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                  }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(pageNum);
                                }}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        ))
                      }
                    </div>

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={`h-9 border-none bg-slate-50 hover:bg-slate-100 rounded-xl transition-all ${currentPage === totalPages ? "pointer-events-none opacity-30" : ""}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 rounded-3xl border-none shadow-2xl overflow-hidden">
          <div className="bg-[#0c1f4d] p-6 text-white shrink-0">
            <DialogTitle className="text-xl font-bold tracking-tight">Modify Inventory Mapping</DialogTitle>
            <DialogDescription className="text-white/60 text-xs font-medium">Adjust the product hierarchy path and attributes</DialogDescription>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {editingProduct && (
              <StepperProductForm
                editingProduct={editingProduct}
                onClose={handleEditClose}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-sm text-center">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 className="h-8 w-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800">Delete Product?</DialogTitle>
            <DialogDescription className="text-slate-500 pt-2 pb-6">
              This will permanently remove the item from the catalog. This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-2xl border-slate-200 font-bold" onClick={closeDeleteDialog} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-red-100" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Removing…' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <SellerDetailsModal 
        isOpen={isSellerModalOpen} 
        onClose={() => setIsSellerModalOpen(false)} 
        seller={selectedSeller} 
      />
    </div>
  );
};

const SellerDetailsModal = ({ isOpen, onClose, seller }) => {
  if (!seller) return null;

  const InfoItem = ({ icon: Icon, label, value, color = "text-slate-600" }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100/50">
      <div className={`mt-0.5 p-2 rounded-lg bg-white shadow-sm ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-semibold text-slate-700 break-all">{value || "N/A"}</span>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80%] w-[95%] max-h-[90vh] p-0 overflow-hidden bg-white rounded-3xl border-none shadow-2xl transition-all duration-300 flex flex-col font-sans">
        {/* Header Section */}
        <div className="relative h-32 bg-[#0c1f4d] flex-shrink-0 flex items-end px-8 pb-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all outline-none"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="absolute top-4 right-12 text-white/10">
            <Building2 className="h-24 w-24" />
          </div>
          <div className="flex items-center gap-6 translate-y-8 bg-white p-2 rounded-2xl shadow-xl border border-slate-100 z-10">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border">
              {seller.company_logo ? (
                <img src={seller.company_logo} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-10 w-10 text-slate-300" />
              )}
            </div>
            <div className="pr-6">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                {seller.company_name || "N/A"}
              </h2>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-3 py-1.2 rounded-full border border-indigo-100 flex items-center gap-1.5 capitalize">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {seller.role?.toLowerCase() || "merchant"}
                </span>
                {seller.verified_status && (
                  <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-3 py-1.2 rounded-full border border-emerald-100 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    VERIFIED
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto px-8 pt-20 pb-10 scrollbar-hide">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Company Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                  <h3 className="text-xs font-black text-[#0c1f4d] uppercase tracking-widest">Company Information</h3>
                </div>
                <div className="grid gap-4">
                  <InfoItem icon={Mail} label="Company Email" value={seller.company_email} color="text-blue-600" />
                  <InfoItem icon={Phone} label="Company Phone" value={seller.company_phone_number} color="text-indigo-600" />
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem icon={FileText} label="GST Number" value={seller.gst_number} color="text-slate-500" />
                    <InfoItem icon={CreditCard} label="PAN" value={seller.pan} color="text-slate-500" />
                  </div>
                  {seller.domain_name && (
                    <InfoItem icon={Building2} label="Website" value={seller.domain_name} color="text-slate-500" />
                  )}
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-8 bg-amber-500 rounded-full" />
                  <h3 className="text-xs font-black text-[#0c1f4d] uppercase tracking-widest">Personal Information</h3>
                </div>
                <div className="grid gap-4">
                  <InfoItem icon={User} label="Authorized Person" value={seller.user_name} color="text-amber-600" />
                  <InfoItem icon={Mail} label="Personal Email" value={seller.user_email} color="text-slate-500" />
                  <InfoItem icon={Phone} label="Personal Phone" value={seller.user_phone} color="text-slate-500" />
                  <InfoItem icon={ShieldCheck} label="Account Role" value={seller.role || "MERCHANT"} color="text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Additional Info / MSME / KYC */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
               <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-8 bg-slate-400 rounded-full" />
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Compliance & Address</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <InfoItem icon={FileText} label="MSME Number" value={seller.msme_certificate_number} color="text-slate-400" />
                   <div className="md:col-span-2">
                      <InfoItem 
                        icon={MapPin} 
                        label="Physical Address" 
                        value={
                          seller.address_id 
                            ? `${seller.address_id.address_line_1 || ""} ${seller.address_id.address_line_2 || ""}, ${seller.address_id.city || ""}, ${seller.address_id.state || ""} ${seller.address_id.pincode || ""}`.trim().replace(/^,/, '').trim()
                            : "Address not found"
                        } 
                        color="text-rose-500" 
                      />
                   </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 flex-shrink-0 flex justify-end border-t border-slate-100 gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="rounded-xl px-8 h-12 font-bold text-slate-600 border-slate-200 hover:bg-slate-100 transition-all font-sans"
          >
            Close
          </Button>
          <Button 
            className="rounded-xl px-8 h-12 font-bold bg-[#0c1f4d] hover:bg-[#1e3a8a] text-white shadow-lg shadow-blue-100 transition-all"
            onClick={onClose}
          >
            Verified Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OthersProductsTable;
