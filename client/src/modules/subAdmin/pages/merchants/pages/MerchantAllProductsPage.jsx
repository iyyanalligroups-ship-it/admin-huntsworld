import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetProductsQuery,
  useVerifyProductMutation,
} from "@/redux/api/ProductApi";
import { Eye, Pencil, Trash2, CheckCircle, AlertCircle, X, FileText, Ban, ShieldCheck, Building2, User, Mail, Phone, MapPin, CreditCard, BadgeCheck } from "lucide-react";
import { useDeleteProductImageMutation } from "@/redux/api/ProductImageApi";
import {
  useDeleteProductMutation,
  useUnverifyProductMutation,
} from "@/redux/api/ProductApi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import showToast from "@/toast/showToast";
import DeleteDialog from "@/model/DeleteModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import StepperProductForm from "../forms/MerchantProductForm"; // Adjust the import path as needed
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";


const Truncate = ({ text }) => {
  // ⭐ Original fallback
  const rawText = text || "N/A";
  console.log(text, 'text value');

  // ⭐ 1. Replace hyphens & underscores with spaces
  let formattedText = rawText.replace(/[-_]/g, " ");

  // ⭐ 2. Capitalize each word
  formattedText = formattedText.replace(/\b\w/g, (c) => c.toUpperCase());

  // ⭐ 3. Truncate
  const isLong = formattedText.length > 15;
  const truncated = isLong ? `${formattedText.slice(0, 15)}…` : formattedText;

  return isLong ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block max-w-[10ch] truncate cursor-default group-hover/seller:text-blue-600 transition-colors">
            {truncated}
          </span>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs break-words p-2 bg-gray-900 text-white"
        >
          {formattedText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span className="inline-block max-w-[10ch] truncate">{formattedText}</span>
  );
};

const NotVerifiedProducts = () => {
  const { user } = useContext(AuthContext);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");



  // Modal open state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const handleSellerClick = (seller) => {
    setSelectedSeller(seller);
    setIsSellerModalOpen(true);
  };
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [unverifyProduct, { isLoading: isUnverifying }] =
    useUnverifyProductMutation();
  const userId = user?.user?._id;
  const {
    data: currentUser,
  } = useGetUserByIdQuery(userId, { skip: !userId });

  const currentPagePath = "products";
  const pagePermissions = currentUser?.approved_permissions?.find(
    (p) => p.page === currentPagePath
  );

  const canEdit = pagePermissions?.actions?.includes("edit") || false;
  const canDelete = pagePermissions?.actions?.includes("delete") || false;

  const { data, isLoading, isError } = useGetProductsQuery({
    page,
    filter,
    search,
    userId: user?.user?._id,
  });
  const [deleteProduct] = useDeleteProductMutation();
  const [deleteProductImage] = useDeleteProductImageMutation();
  const [verifyProduct, { isLoading: isVerifying }] =
    useVerifyProductMutation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    console.log("editingProduct passed to StepperProductForm:", editingProduct);
  }, [editingProduct]);



  useEffect(() => {
    if (selectedProduct?.product_image?.length) {
      setActiveImage(selectedProduct.product_image[0]);
    }
  }, [selectedProduct]);

  const handleImageHover = (imgUrl) => {
    setActiveImage(imgUrl);
  };

  const handleEdit = (product) => {
    console.log("Opening edit modal for product:", product);
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    console.log("Closing modal, resetting editingProduct");
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    setIsDialogOpen(true);
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const selectedProduct = data?.products?.find(
      (item) => item._id === deleteId
    );
    console.log("Deleting product:", selectedProduct);

    try {
      if (
        Array.isArray(selectedProduct?.product_image) &&
        selectedProduct.product_image.length > 0
      ) {
        const fileNames = selectedProduct.product_image.map((url) =>
          url.split("/").pop()
        );
        console.log("Deleting images:", fileNames);

        await deleteProductImage({
          product_name: selectedProduct.product_name,
          file_names: fileNames,
        }).unwrap();
      }

      const deleteProductResponse = await deleteProduct(deleteId).unwrap();
      if (deleteProductResponse.success) {
        showToast(
          deleteProductResponse.message || "Product Deleted Successfully", 'success'
        );
      } else {
        showToast(deleteProductResponse.message || "Failed to Delete", 'error');
      }
    } catch (err) {
      showToast(err.data?.message || "Error during deletion", 'error');
      console.error("Error during deletion:", err);
    } finally {
      setDeleteId(null);
      setIsDialogOpen(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      const response = await verifyProduct(id).unwrap();
      if (response.success) {
        showToast(response.message || "Product verified successfully", 'success');
      } else {
        showToast(response.message || "Failed to verify product", 'error');
      }
    } catch (error) {
      showToast(error?.data?.message || "Error verifying product", 'error');
      console.error("Verification error:", error);
    }
  };

  const handleUnverify = async (id) => {
    try {
      const response = await unverifyProduct(id).unwrap();
      showToast(response.message || "Verification revoked", 'success');
    } catch (error) {
      const msg = error?.data?.message || "Failed to revoke";

      if (msg.includes("already unverified") || msg.includes("not verified")) {
        showToast("Already unverified", 'info');
      } else {
        showToast(msg, 'error');
      }
    }
  };

  const handlePaginationChange = (newPage) => {
    setPage(newPage);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setActiveImage(product.product_image?.[0] || "");
    setIsProductModalOpen(true);
  };

  const closeDetails = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError) {
    return <p className="text-center text-red-600">Failed to load products.</p>;
  }

  const products = data?.products || [];

  return (
    <div>
      <h1 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
        Product Details
      </h1>
      {/* ---------------------------------------------------------------------------
            LEFT PANEL: VERIFICATION SOP
           --------------------------------------------------------------------------- */}
      <div className="xl:col-span-1">

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
            Approved Catalog
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Governance protocols for live, admin-verified products.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 space-y-4 mb-4 md:space-y-0">

          {/* SOP 1: Verification Integrity */}
          <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <ShieldCheck size={16} className="text-emerald-600" />
                1. Live Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                Products listed here are visible to customers.
                <br />
                <span className="font-semibold">Periodic Audit:</span> Ensure images and descriptions remain accurate post-approval.
              </p>
            </CardContent>
          </Card>

          {/* SOP 2: Revocation */}
          <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <Ban size={16} className="text-amber-600" />
                2. Revocation (Un-Verify)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                If a product violates policy or is out of stock indefinitely, use the <span className="text-purple-600 font-bold">Un-Verify</span> button.
                <br />
                <span className="italic">This hides the product from the storefront but keeps the data for correction.</span>
              </p>
            </CardContent>
          </Card>

          {/* SOP 3: Modification */}
          <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <FileText size={16} className="text-blue-600" />
                3. Editing Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                Admin edits override Merchant data.
                <br />
                Use <strong>Delete</strong> only for duplicates or illegal content. Deleted products cannot be recovered.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
      <Input
        type="text"
        placeholder="Search by product name"
        value={search}
        onChange={handleSearchChange}
        className="mb-4 w-full max-w-md"
      />
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          onClick={() => handleFilterChange("today")}
          className="flex-1 sm:flex-none bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4d] text-white"
        >
          Today
        </Button>
        <Button
          onClick={() => handleFilterChange("last_week")}
          className="flex-1 sm:flex-none bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4d] text-white"
        >
          Last Week
        </Button>
        <Button
          onClick={() => handleFilterChange("last_month")}
          className="flex-1 sm:flex-none cursor-pointer"
        >
          Last Month
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#0c1f4d]">
            <TableRow>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Company Name
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Category
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Sub Category
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Super Sub Category
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Deep Sub Category
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Product Name
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Price (₹)
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Stock
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Verified
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id}>
                <TableCell className="px-2 py-2 text-xs sm:text-sm">
                  <div className="flex flex-col gap-0.5 leading-tight">
                    {/* Company Name */}
                    <span 
                      className="font-bold text-[#0c1f4d] flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors group/seller"
                      onClick={() => handleSellerClick(product.seller)}
                    >
                      <Truncate text={product.seller?.company_name || "N/A"} />
                      <Eye className="h-3 w-3 opacity-0 group-hover/seller:opacity-100 transition-opacity text-blue-400" />
                    </span>

                    {/* Username */}
                    <span className="text-[10px] sm:text-xs text-gray-500">
                      @{product.seller?.user_name || "unknown"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="px-2 py-1 text-xs sm:text-sm ">
                  <Truncate
                    text={product.category_id?.category_name || "N/A"}
                  />
                </TableCell>

                <TableCell className="px-2 py-1 text-xs sm:text-sm">
                  <Truncate
                    text={product.sub_category_id?.sub_category_name || "N/A"}
                  />
                </TableCell>

                <TableCell className="px-2 py-1 text-xs sm:text-sm">
                  <Truncate
                    text={
                      product.super_sub_category_id
                        ?.super_sub_category_name || "N/A"
                    }
                  />
                </TableCell>

                <TableCell className="px-2 py-1 text-xs sm:text-sm">
                  <Truncate
                    text={
                      product.deep_sub_category_id?.deep_sub_category_name ||
                      "N/A"
                    }
                  />
                </TableCell>

                <TableCell className="px-2 py-1 text-xs sm:text-sm">
                  <Truncate text={product.product_name} />
                </TableCell>
                <TableCell className="px-2 py-1 text-xs sm:text-sm font-bold text-slate-800">
                  {product.askPrice ? (
                     <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200">Ask Price</span>
                  ) : (
                    `₹${parseFloat(product.price?.$numberDecimal || 0).toLocaleString('en-IN')}`
                  )}
                </TableCell>
                <TableCell className="px-2 py-1 text-xs sm:text-sm">
                   <span className={`px-2 py-0.5 rounded-full ${product.stock_quantity > 0 ? "bg-emerald-50 text-emerald-700 font-bold" : "bg-rose-50 text-red-500 font-medium"}`}>
                     {product.stock_quantity || 0} {product.unitOfMeasurement || ""}
                   </span>
                </TableCell>
                <TableCell className="px-2 py-1 text-xs sm:text-sm">
                  {product.product_verified_by_admin ? "Yes" : "No"}
                </TableCell>
                <TableCell className="px-2 py-1 flex gap-1 sm:gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openProductModal(product)}
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View Details</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                          className="text-green-600 hover:text-green-800 cursor-pointer"
                          disabled={!canEdit}
                          title={!canEdit ? "You do not have permission to edit" : "Edit"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          disabled={!canDelete}
                          title={!canDelete ? "You do not have permission to delete" : "Delete"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnverify(product._id)}
                          className="text-purple-600  hover:text-purple-800 cursor-pointer"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Verify Product</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : products.length ? (
          products.map((product) => (
            <div
              key={product._id}
              className="border rounded-xl p-4 shadow-sm bg-white space-y-3"
            >
              {/* Better spacing & readability */}
              <div className="space-y-1.5 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Category:</span>{" "}
                  <span className="text-gray-900 line-clamp-2">
                    {product.category_id?.category_name || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Sub-Category:</span>{" "}
                  <span className="text-gray-900 line-clamp-2">
                    {product.sub_category_id?.sub_category_name || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Super Sub:</span>{" "}
                  <span className="text-gray-900 line-clamp-2">
                    {product.super_sub_category_id?.super_sub_category_name || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Deep Sub:</span>{" "}
                  <span className="text-gray-900 line-clamp-2">
                    {product.deep_sub_category_id?.deep_sub_category_name || "N/A"}
                  </span>
                </div>

                <div className="pt-1">
                  <span className="font-medium text-gray-700">Product:</span>{" "}
                  <span className="font-semibold text-gray-900 line-clamp-3">
                    {product.product_name || "—"}
                  </span>
                </div>

                <div className="pt-2">
                  <span className="font-medium text-gray-700">Verified:</span>{" "}
                  <span
                    className={`font-medium ${product.product_verified_by_admin ? "text-green-600" : "text-amber-600"
                      }`}
                  >
                    {product.product_verified_by_admin ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              {/* Buttons – better spacing on small screens */}
              <div className="flex flex-wrap gap-2 pt-3 border-t mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProduct(product)}
                  className="flex-1 min-w-[90px] justify-center"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  View
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(product)}
                  className="flex-1 min-w-[90px] justify-center bg-[#0c1f4d] hover:bg-[#0c1f4d]/90 text-white border-[#0c1f4d]"
                  disabled={!canEdit}
                  title={!canEdit ? "You do not have permission to edit" : "Edit"}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(product._id)}
                  className="flex-1 min-w-[90px] justify-center border-red-200 text-red-600 hover:bg-red-50"
                  disabled={!canDelete}
                  title={!canDelete ? "You do not have permission to delete" : "Delete"}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnverify(product._id)}
                  className="flex-1 min-w-[90px] justify-center"
                  disabled={product.product_verified_by_admin === false} // optional
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Verify
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 bg-gray-50/40 rounded-lg border border-dashed">
            No products found
          </div>
        )}
      </div>
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center mt-4 gap-4">
        <div className="text-xs sm:text-sm text-gray-600">
          Total Records: {data?.pagination?.totalProducts || 0}
        </div>
        <div className="flex justify-center gap-2 sm:gap-4">
          <Button
            disabled={page === 1 || data?.pagination?.totalProducts === 0}
            onClick={() => handlePaginationChange(page - 1)}
            variant="outline"
            className="text-xs sm:text-sm cursor-pointer"
          >
            Previous
          </Button>
          {isMobile ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink isActive>{page}</PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : (
            <span className="font-semibold text-xs sm:text-sm text-gray-700">
              Page {page} of {data?.pagination?.totalPages || 1}
            </span>
          )}
          <Button
            disabled={
              page === data?.pagination?.totalPages ||
              data?.pagination?.totalProducts === 0
            }
            onClick={() => handlePaginationChange(page + 1)}
            variant="outline"
            className="text-xs sm:text-sm cursor-pointer bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent
          className="p-0 overflow-hidden bg-white rounded-2xl"
          style={{
            width: "95vw",
            maxWidth: "95vw",
            height: "90vh",
            maxHeight: "90vh",
          }}
        >

          <div className="flex items-center justify-between p-5 sm:p-6 bg-gradient-to-r from-[#0c1f4d] to-[#1e3a8a] text-white sticky top-0 z-10 border-b border-white/20">
            <div className="flex justify-between w-full items-center">
              <h1 className="text-2xl sm:text-2xl font-bold tracking-tight">
                {selectedProduct?.product_name}
              </h1>
              <Button
                onClick={closeDetails}
                variant="ghost"
                size="icon"
                className="text-white cursor-pointer hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[calc(90vh-80px)] px-6 pt-4">
            {selectedProduct && (
              <div className="flex flex-col lg:flex-row gap-8 pb-8">
                {/* Image Gallery Section */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <Zoom>
                    <img
                      src={activeImage}
                      alt="Main Product"
                      className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] object-contain rounded-lg border shadow-md"
                    />
                  </Zoom>

                  {/* Thumbnails */}
                  <div className="flex gap-3 mt-6 flex-wrap justify-center">
                    {selectedProduct.product_image?.map((imageUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImage(imageUrl)}
                        className={`w-16 h-16 sm:w-20 sm:h-20 border-2 rounded-lg overflow-hidden transition-all ${activeImage === imageUrl
                          ? "border-blue-600 ring-2 ring-blue-600 ring-offset-2"
                          : "border-gray-300 hover:border-gray-400"
                          }`}
                      >
                        <img
                          src={imageUrl}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Details Section */}
                <div className="flex-1 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
                    <div>
                      <span className="font-semibold text-gray-700">Quantity:</span>{" "}
                      <span className="text-gray-900">{selectedProduct.stock_quantity}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Price:</span>{" "}
                      <span className="text-xl font-bold text-green-600">
                        ₹{parseFloat(selectedProduct.price?.$numberDecimal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Verified:</span>{" "}
                      <span className={selectedProduct.product_verified_by_admin ? "text-green-600" : "text-red-600"}>
                        {selectedProduct.product_verified_by_admin ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                    />
                  </div>

                  {/* Attributes */}
                  {selectedProduct.attributes && selectedProduct.attributes.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Specifications</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedProduct.attributes.map((attr) => (
                          <div key={attr._id} className="bg-gray-50 p-3 rounded-lg">
                            <span className="text-xs font-medium text-gray-600 block">
                              {attr.attribute_key}
                            </span>
                            <span className="text-sm font-semibold text-gray-800">
                              {attr.attribute_value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product?"
        description="This action will permanently remove the product."
      />
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-full sm:max-w-2xl h-[80vh] sm:h-[400px] overflow-y-auto">
          <DialogHeader>
            {/* <DialogTitle>Edit Product</DialogTitle> */}
          </DialogHeader>
          <StepperProductForm
            editingProduct={editingProduct}
            onClose={handleModalClose}
          />
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

export default NotVerifiedProducts;
