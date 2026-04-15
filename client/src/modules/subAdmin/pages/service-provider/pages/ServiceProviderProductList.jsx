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
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Pencil, Trash2 } from "lucide-react"; // Added icons
import DeleteDialog from "@/model/DeleteModel";
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
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "react-toastify";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const ServiceProviderProductList = ({
  products = [],
  pagination = {},
  onEdit,
  onDelete,
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  const [deleteProductImage] = useDeleteProductImageMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const currentPagePath = "service-providers/vehicles";

  const userId = user?.user._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check permissions for the current page
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions.includes("edit") || false;
  const canDelete = pagePermissions?.actions.includes("delete") || false;
  useEffect(() => {
    if (selectedProduct?.product_image?.length > 0) {
      setActiveImage(selectedProduct.product_image[0]);
    }
  }, [selectedProduct]);

  const handleImageHover = (imgUrl) => {
    setActiveImage(imgUrl);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleEdit = (product) => {
    onEdit?.(product);
    toast.success(`Editing: ${product.product_name || "Product"}`);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    toast.info(`Viewing: ${product.product_name}`);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const product = products.find((p) => p._id === deleteId);
    if (!product) return;

    try {
      if (product.product_image && product.product_image.length > 0) {
        const fileNames = product.product_image.map((url) => url.split("/").pop());
        await deleteProductImage({
          product_name: product.product_name,
          file_names: fileNames,
        }).unwrap();
      }

      const res = await deleteProduct(deleteId).unwrap();
      toast.success(res.message || "Product deleted successfully");
      onDelete?.(deleteId);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err?.data?.message || "Failed to delete product");
    } finally {
      setIsDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    toast.info(`Page ${newPage}`);
  };

  const filteredProducts = products.filter((product) =>
    product.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  const pageSize = pagination.pageSize || 10;
  const totalPages = pagination.totalPages || Math.ceil(filteredProducts.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  return (
    <div className="lg:p-4 space-y-6 max-w-6xl mx-auto">
      <h1 className="font-bold text-lg sm:text-xl border-b-2 pb-2 text-gray-900">
        Product Details
      </h1>

      <Input
        type="text"
        placeholder="Search by product name..."
        value={search}
        onChange={handleSearchChange}
        className="w-full sm:w-80 rounded-md border-gray-300 focus:ring-2 focus:ring-gray-900 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => toast.info("Filter: Today (server-side not implemented)")}
          className="bg-[#0c1f4d] hover:bg-[#153171] text-white text-sm px-4 py-2"
        >
          Today
        </Button>
        <Button
          onClick={() => toast.info("Filter: Last Week")}
          className="bg-[#0c1f4d] hover:bg-[#153171] text-white text-sm px-4 py-2"
        >
          Last Week
        </Button>
        <Button
          onClick={() => toast.info("Filter: Last Month")}
          className="bg-[#0c1f4d] hover:bg-[#153171] text-white text-sm px-4 py-2"
        >
          Last Month
        </Button>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {displayedProducts.length > 0 ? (
          displayedProducts.map((product, index) => (
            <Card key={product._id} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
                    {product.product_name || "Unnamed"}
                  </h3>

                  {/* Mobile: 3 Inline Action Buttons */}
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(product)}
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
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">S.No:</span> {startIndex + index + 1}
                  </p>
                  <p>
                    <span className="font-medium">Category:</span>{" "}
                    {product.category_id?.category_name || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Sub:</span>{" "}
                    {product.sub_category_id?.sub_category_name || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Super Sub:</span>{" "}
                    {product.super_sub_category_id?.super_sub_category_name || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Deep Sub:</span>{" "}
                    {product.deep_sub_category_id?.deep_sub_category_name || "-"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-medium text-xs">Image:</span>
                    {product.product_image?.[0] ? (
                      <img
                        src={product.product_image[0]}
                        alt="thumb"
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No image</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8 text-sm">No products found</p>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-medium text-gray-700">Category</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Sub Category</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Super Sub</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Deep Sub</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Image</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedProducts.length > 0 ? (
                  displayedProducts.map((product) => (
                    <TableRow key={product._id} className="hover:bg-gray-50">
                      <TableCell className="text-sm text-gray-600">
                        {product.category_id?.category_name || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {product.sub_category_id?.sub_category_name || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {product.super_sub_category_id?.super_sub_category_name || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {product.deep_sub_category_id?.deep_sub_category_name || "-"}
                      </TableCell>
                      <TableCell>
                        {product.product_image?.[0] ? (
                          <img
                            src={product.product_image[0]}
                            alt="thumb"
                            className="w-12 h-12 object-cover rounded border"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>

                      {/* Updated Actions: 3 Icon Buttons */}
                      <TableCell>
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDetails(product)}
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
                                  disabled={!canEdit}
                                  className={!canEdit ? "opacity-50 cursor-not-allowed text-green-600 hover:text-green-800" : "text-green-600 hover:text-green-800 cursor-pointer"}
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
                               
                                  disabled={!canDelete}
                                  className={!canDelete ? "opacity-50 cursor-not-allowed text-red-600 hover:text-red-800" : "text-red-600 hover:text-red-800 cursor-pointer"}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      {displayedProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredProducts.length)} of{" "}
            {filteredProducts.length} products
          </div>
          <div className="flex items-center gap-2">
            <Button
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-4 py-2"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 px-3">
              Page {page} of {totalPages}
            </span>
            <Button
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="bg-[#0c1f4d] hover:bg-[#153171] text-white text-sm px-4 py-2"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Product Details */}
      {selectedProduct && (
        <div className="mt-8">
          <h2 className="font-bold text-lg sm:text-xl border-b-2 pb-2 text-gray-900 mb-4">
            Product Details
          </h2>
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                {selectedProduct.product_name}
              </h3>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  {activeImage && (
                    <Zoom>
                      <img
                        src={activeImage}
                        alt="Main"
                        className="w-full max-w-sm h-64 object-contain rounded-lg border bg-gray-50"
                      />
                    </Zoom>
                  )}

                  <div className="flex gap-2 flex-wrap justify-center">
                    <TooltipProvider>
                      {selectedProduct.product_image?.map((img, i) => (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <button
                              onMouseEnter={() => handleImageHover(img)}
                              className={`w-16 h-16 border-2 rounded-md overflow-hidden transition-all ${activeImage === img ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300"
                                }`}
                            >
                              <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Quantity</p>
                      <p className="text-lg font-semibold">{selectedProduct.stock_quantity || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Price</p>
                      <p className="text-lg font-semibold text-green-600">
                        {selectedProduct.price?.$numberDecimal
                          ? `₹${parseFloat(selectedProduct.price.$numberDecimal).toFixed(2)}`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: selectedProduct.description || "<em>No description</em>",
                      }}
                    />
                  </div>

                  {selectedProduct.attributes?.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-gray-600 mb-2">Attributes</p>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedProduct.attributes.map((attr) => (
                          <div key={attr._id} className="bg-gray-50 p-2 rounded">
                            <p className="text-xs font-medium text-gray-700">{attr.attribute_key}</p>
                            <p className="text-sm text-gray-900">{attr.attribute_value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>

            <div className="mt-4 p-4 bg-gray-50 border-t text-right">
              <Button
                onClick={() => setSelectedProduct(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product?"
        description="This will permanently delete the product and all its images. This action cannot be undone."
      />
    </div>
  );
};

export default ServiceProviderProductList;