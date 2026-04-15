import React, { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { useGetUserSellerProductsByIdQuery } from "@/redux/api/ProductApi";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useDeleteProductImageMutation } from "@/redux/api/ProductImageApi";
import {
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/redux/api/ProductApi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import showToast from "@/toast/showToast";
import DeleteDialog from "@/model/DeleteModel";
import noImage from "@/assets/images/no-image.jpg";
import { X } from "lucide-react";


const TruncateValue = ({ text }) => {
  // ⭐ Original fallback
  const rawText = text || "N/A";

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
          <span className="inline-block max-w-[10ch] truncate cursor-default">
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

const MerchantProductListing = ({ products: initialProducts = [], pagination, onEdit, onRefresh, userId }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [deleteProductImage] = useDeleteProductImageMutation();

  const products = initialProducts;

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

  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (selectedProduct?.product_image?.length) {
      setActiveImage(selectedProduct.product_image[0]);
    }
  }, [selectedProduct]);

  const handleImageHover = (imgUrl) => {
    setActiveImage(imgUrl);
  };

  const seller_info = null; // Info should come from parent if needed

  const handleEdit = (product) => {
    onEdit(product);
    showToast(`Editing product: ${product.product_name}`,'info');
  };

  const handleDelete = async (id) => {
    setIsDialogOpen(true);
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const selectedProduct = products?.find((item) => item._id === deleteId);

    try {
      if (
        Array.isArray(selectedProduct?.product_image) &&
        selectedProduct.product_image.length > 0
      ) {
        const fileNames = selectedProduct.product_image.map((url) =>
          url.split("/").pop()
        );
        await deleteProductImage({
          product_name: selectedProduct.product_name,
          file_names: fileNames,
        }).unwrap();
      }

      const deleteProductResponse = await deleteProduct(deleteId).unwrap();
      if (deleteProductResponse.success) {
        showToast(
          deleteProductResponse.message || "Product Deleted Successfully",'success'
        );
        if (onRefresh) onRefresh();
      } else {
        showToast(deleteProductResponse.message || "Failed to Delete",'error');
      }
    } catch (err) {
      showToast(err.data?.message || "Error during deletion",'error');
    } finally {
      setDeleteId(null);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="pt-2  space-y-6">
      {/* <h1 className="font-bold text-xl border-b-2 text-gray-900">
        Product Details
      </h1> */}
      <Input
        type="text"
        placeholder="e.g. Search by product name"
        value={search}
        onChange={handleSearchChange}
        className="w-full max-w-md rounded-md border-2 border-slate-300 focus:ring-2 focus:ring-gray-900 text-sm"
      />
      <div className="flex flex-wrap items-start gap-4">
        <Button
          onClick={() => handleFilterChange("today")}
          className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white rounded-md text-sm"
        >
          Today
        </Button>
        <Button
          onClick={() => handleFilterChange("last_week")}
          className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white rounded-md text-sm"
        >
          Last Week
        </Button>
        <Button
          onClick={() => handleFilterChange("last_month")}
          className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white rounded-md text-sm"
        >
          Last Month
        </Button>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {products?.map((product) => (
          <Card
            key={product._id}
            className="border rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            <CardContent className="p-4">
              {/* Reusable Truncate + Tooltip Component */}
              {(() => {
                const Truncate = ({ text }) => {
                  const displayText = text || "-";
                  const isLong = displayText.length > 20; // Slightly longer threshold for cards
                  const truncated = isLong
                    ? `${displayText.slice(0, 20)}…`
                    : displayText;

                  return isLong ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block max-w-full truncate cursor-default font-medium">
                            {truncated}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-xs break-words p-2"
                        >
                          {displayText}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="font-medium">{displayText}</span>
                  );
                };

                return (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-sm text-gray-900 leading-tight">
                        <TruncateValue text={product.product_name} />
                      </p>

                      <div className="flex gap-1.5 ml-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedProduct(product)}
                                className="text-blue-600 hover:text-blue-800 h-8 w-8"
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
                                className="text-green-600 hover:text-green-800 h-8 w-8"
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
                                className="text-red-600 hover:text-red-800 h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium text-gray-700">
                          Company Name:
                        </span>{" "}
                        <TruncateValue text={seller_info?.company_name} />
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">
                          Category:
                        </span>{" "}
                        <TruncateValue
                          text={product.category_id?.category_name}
                        />
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">
                          Sub Category:
                        </span>{" "}
                        <TruncateValue
                          text={product.sub_category_id?.sub_category_name}
                        />
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">
                          Super Sub:
                        </span>{" "}
                        <TruncateValue
                          text={
                            product.super_sub_category_id
                              ?.super_sub_category_name
                          }
                        />
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">
                          Deep Sub:
                        </span>{" "}
                        <TruncateValue
                          text={
                            product.deep_sub_category_id?.deep_sub_category_name
                          }
                        />
                      </p>

                      <div className="pt-2">
                        <img
                          src={
                            product.product_image?.[0] ||
                            "/placeholder-image.jpg"
                          }
                          alt={product.product_name || "Product"}
                          className="w-16 h-16 object-cover rounded border shadow-sm"
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && (
          <p className="text-center text-gray-600 text-sm">No products found</p>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <Card className="border rounded-lg shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-sm font-medium text-gray-700">
                    Company Name
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700">
                    Category
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700">
                    Sub Category
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700">
                    Super Sub Category
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700">
                    Deep Sub Category
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700">
                    Image
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => {
                  /* Reusable Truncate + Tooltip Component - Same as Code 1 */
                  const Truncate = ({ text }) => {
                    const displayText = text || "-";
                    const isLong = displayText.length > 15;
                    const truncated = isLong
                      ? `${displayText.slice(0, 15)}…`
                      : displayText;

                    return isLong ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block max-w-[12ch] truncate cursor-default">
                              {truncated}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="center"
                            className="max-w-xs break-words p-2"
                          >
                            {displayText}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="inline-block max-w-[12ch] truncate">
                        {displayText}
                      </span>
                    );
                  };

                  return (
                    <TableRow key={product._id} className="hover:bg-gray-50">
                      {/* Category */}
                      <TableCell className="text-sm text-gray-600">
                        <TruncateValue text={seller_info?.company_name} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <TruncateValue
                          text={product.category_id?.category_name}
                        />
                      </TableCell>

                      {/* Sub Category */}
                      <TableCell className="text-sm text-gray-600">
                        <TruncateValue
                          text={product.sub_category_id?.sub_category_name}
                        />
                      </TableCell>

                      {/* Super Sub Category */}
                      <TableCell className="text-sm text-gray-600">
                        <TruncateValue
                          text={
                            product.super_sub_category_id
                              ?.super_sub_category_name
                          }
                        />
                      </TableCell>

                      {/* Deep Sub Category */}
                      <TableCell className="text-sm text-gray-600">
                        <TruncateValue
                          text={
                            product.deep_sub_category_id?.deep_sub_category_name
                          }
                        />
                      </TableCell>

                      {/* Image */}
                      <TableCell>
                        <div className="w-12 h-12 rounded border bg-gray-50 flex items-center justify-center overflow-hidden">
                          <img
                            src={product.product_image?.[0] || ""}
                            alt="Product"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = noImage;
                              e.currentTarget.className =
                                "w-full h-full object-contain p-1";
                            }}
                            loading="lazy"
                          />
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedProduct(product)}
                                className="text-blue-600 hover:text-blue-800"
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
                                className="text-green-600 hover:text-green-800"
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
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {products.length === 0 && (
              <p className="text-center text-gray-600 text-sm p-4">
                No products found
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-between items-center mt-6">
        <div className="text-sm text-gray-600">
          Total Records: {pagination?.totalProducts || 0}
        </div>
        <div className="flex justify-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
          <Button
            disabled={page === 1 || pagination?.totalProducts === 0}
            onClick={() => handlePaginationChange(page - 1)}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
          >
            Previous
          </Button>
          <span className="font-semibold text-gray-700 text-sm">
            Page {page} of {pagination?.totalPages || 1}
          </span>
          <Button
            disabled={
              page === pagination?.totalPages || pagination?.totalProducts === 0
            }
            onClick={() => handlePaginationChange(page + 1)}
            variant="outline"
            className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white rounded-md text-sm"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Modal Popup */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={() => setSelectedProduct(null)}
      >
        <DialogContent
          className="p-0 overflow-hidden bg-white"
          style={{
            width: "95vw",
            maxWidth: "95vw",
            height: "90vh",
            maxHeight: "90vh",
          }}
        >
          {/* CUSTOM HEADER WITH CLOSE BUTTON */}
          <div className="flex items-center justify-between p-5 sm:p-6 bg-gradient-to-r from-[#0c1f4d] to-[#1e3a8a] text-white sticky top-0 z-10 border-b border-white/20">
            <div>
              <h1 className="text-2xl sm:text-2xl font-bold tracking-tight">
                {selectedProduct?.product_name || "Product Details"}
              </h1>
              <p className="text-blue-100 text-sm mt-1 opacity-90">
                View complete product information
              </p>
            </div>

            {/* Custom Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedProduct(null)}
              className="text-white hover:bg-white/20 rounded-full transition-all hover:scale-110"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
            {selectedProduct && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* LEFT: IMAGES */}
                <div className="flex flex-col space-y-6">
                  {/* Main Image */}
                  <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-inner flex items-center justify-center">
                    {activeImage ? (
                      <Zoom>
                        <img
                          src={activeImage}
                          alt="Product"
                          className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300"
                          onError={(e) => (e.currentTarget.src = noImage)}
                        />
                      </Zoom>
                    ) : (
                      <div className="text-center text-gray-400">
                        <div className="w-32 h-32 bg-gray-200 border-2 border-dashed rounded-xl mx-auto mb-4" />
                        <p>No Image Available</p>
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  <div className="flex gap-3 flex-wrap justify-center">
                    {(selectedProduct.product_image && selectedProduct.product_image.length > 0
                      ? selectedProduct.product_image
                      : [noImage]
                    ).map((imageUrl, index) => {
                      const displayUrl = imageUrl || noImage;
                      const isActive = activeImage === displayUrl;

                      return (
                        <button
                          key={index}
                          onClick={() => handleImageHover(displayUrl)}
                          onMouseEnter={() => handleImageHover(displayUrl)}
                          disabled={!imageUrl}
                          className={`
                      w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all
                      ${isActive
                              ? "border-[#0c1f4d] ring-4 ring-[#0c1f4d]/30 shadow-lg scale-110"
                              : "border-gray-300 hover:border-[#0c1f4d] hover:shadow-md"
                            }
                      ${!imageUrl ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                        >
                          <img
                            src={displayUrl}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.src = noImage)}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT: DETAILS */}
                <div className="space-y-8">
                  {/* Price & Stock */}
                  <div className="grid grid-cols-2 gap-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl">
                    <div>
                      <p className="text-gray-600 font-medium">Available Stock</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {selectedProduct.stock_quantity || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Price</p>
                      <p className="text-4xl font-extrabold text-green-600 mt-2">
                        ₹
                        {selectedProduct.price?.$numberDecimal
                          ? parseFloat(selectedProduct.price.$numberDecimal).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Description</h3>
                    <div
                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed bg-gray-50 p-5 rounded-xl"
                      dangerouslySetInnerHTML={{
                        __html: selectedProduct.description || "No description available.",
                      }}
                    />
                  </div>

                  {/* Specifications */}
                  {selectedProduct.attributes && selectedProduct.attributes.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-5">Specifications</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedProduct.attributes.map((attr) => (
                          <div
                            key={attr._id}
                            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span className="text-sm font-medium text-gray-500 block">
                              {attr.attribute_key}
                            </span>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                              {attr.attribute_value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product?"
        description="This action will permanently remove the product."
      />
    </div>
  );
};

export default MerchantProductListing;
