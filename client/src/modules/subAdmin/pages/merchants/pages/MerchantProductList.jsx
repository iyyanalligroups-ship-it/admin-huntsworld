import React, { useState, useEffect, useCallback, useContext } from "react";
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
import { Eye, Edit, Trash } from "lucide-react";
import DeleteDialog from "@/model/DeleteModel";
import { useDeleteProductImageMutation } from "@/redux/api/ProductImageApi";
import { useGetProductsQuery, useDeleteProductMutation } from "@/redux/api/ProductApi";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "react-toastify";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetCategoryAccessQuery } from "@/redux/api/AccessApi";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Import your edit form component
import StepperProductForm from "../forms/MerchantProductForm"; // Adjust path if needed

const MerchantProductListing = ({
  products: initialProducts = [],
  selectedMerchant,
  pagination = {},
  onEdit,
  userId: merchantUserId,
  canEdit,
  canDelete,
  onRefresh
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const { user } = useContext(AuthContext);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deleteProduct] = useDeleteProductMutation();
  const [deleteProductImage] = useDeleteProductImageMutation();



  const { data: accessData } = useGetCategoryAccessQuery();

  // TEMPORARY: force category restriction OFF so edit/delete works
  // Change back to: accessData?.data?.is_category === true when ready
  const categoryRestrictionActive = false;

  const totalProducts = pagination?.totalProducts || initialProducts.length || 0;
  const totalPages = pagination?.totalPages || 1;

  const activeUserId = user?.user?._id;
  const { data: currentUser } = useGetUserByIdQuery(activeUserId, { skip: !activeUserId });

  const currentPagePath = "merchants/products";

  const pagePermissions = currentUser?.approved_permissions?.find(
    (p) => p.page === currentPagePath
  ) || null;

  const canEditPage = pagePermissions?.actions?.includes("edit") ?? false;
  const canDeletePage = pagePermissions?.actions?.includes("delete") ?? false;

  const [activeImage, setActiveImage] = useState(null);

  const productHasAnyCategory = (product) => {
    return !!(
      product?.category_id?._id ||
      product?.sub_category_id?._id ||
      product?.super_sub_category_id?._id ||
      product?.deep_sub_category_id?._id
    );
  };

  const canModifyProduct = (product, action) => {
    const hasPagePermission = action === "edit" ? canEditPage : canDeletePage;
    const restrictedByCategory = categoryRestrictionActive && productHasAnyCategory(product);
    return hasPagePermission && !restrictedByCategory;
  };

  const getActionTooltip = (product, action) => {
    const hasPagePerm = action === "edit" ? canEditPage : canDeletePage;
    const restricted = categoryRestrictionActive && productHasAnyCategory(product);

    if (!hasPagePerm) return action === "edit" ? "No edit permission" : "No delete permission";
    if (restricted) return `This ${action} is restricted for categorized products`;
    return action === "edit" ? "Edit product" : "Delete product";
  };

  const handlePaginationChange = useCallback(
    (newPage) => {
      if (newPage < 1 || newPage > totalPages) return;
      setPage(newPage);
    },
    [totalPages]
  );

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleImageHover = useCallback((imgUrl) => {
    setActiveImage(imgUrl);
  }, []);

  const handleEdit = useCallback((product) => {
    if (onEdit) {
      onEdit(product);
    } else {
      setEditingProduct(product);
      setIsEditModalOpen(true);
    }
  }, [onEdit]);

  const handleDelete = useCallback((id, product) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleView = useCallback((product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  }, []);

  useEffect(() => {
    if (selectedProduct?.product_image?.length) {
      setActiveImage(selectedProduct.product_image[0]);
    }
  }, [selectedProduct]);

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const deleteProductResponse = await deleteProduct(deleteId).unwrap();
      toast.success(deleteProductResponse.message || "Product Deleted Successfully");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.data?.message || "Error during deletion");
      console.error("Error during deletion:", err);
    } finally {
      setDeleteId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleProductSaved = () => {
    refetch(); // Refresh product list after save/update
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const products = initialProducts;

  return (
    <div className="lg:p-6 space-y-6">
      <h1 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold w-fit mb-3">
        Product Details:
      </h1>

      {categoryRestrictionActive && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
          Editing and deleting categorized products is currently restricted by administrator policy.
        </div>
      )}

      <Input
        type="text"
        placeholder="Search by product name"
        value={search}
        onChange={handleSearchChange}
        className="w-full max-w-md"
      />

      <div className="flex items-start space-x-4">
        <Button className="bg-[#0c1f4d] hover:bg-[#0c204dec]" onClick={() => handleFilterChange("today")}>
          Today
        </Button>
        <Button className="bg-[#0c1f4d] hover:bg-[#0c204dec]" onClick={() => handleFilterChange("last_week")}>
          Last Week
        </Button>
        <Button className="bg-[#0c1f4d] hover:bg-[#0c204dec]" onClick={() => handleFilterChange("last_month")}>
          Last Month
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card style={{ overflow: "visible" }}>
          <CardContent style={{ overflow: "visible" }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Sub Category</TableHead>
                  <TableHead>Super Sub Category</TableHead>
                  <TableHead>Deep Sub Category</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>{product.category_id?.category_name || "-"}</TableCell>
                    <TableCell>{product.sub_category_id?.sub_category_name || "-"}</TableCell>
                    <TableCell>{product.super_sub_category_id?.super_sub_category_name || "-"}</TableCell>
                    <TableCell>{product.deep_sub_category_id?.deep_sub_category_name || "-"}</TableCell>
                    <TableCell>
                      {product.product_image?.[0] ? (
                        <img
                          src={product.product_image[0]}
                          alt="Product"
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="View product details"
                        onClick={() => handleView(product)}
                      >
                        <Eye className="h-5 w-5" />
                      </Button>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!canModifyProduct(product, "edit")}
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{getActionTooltip(product, "edit")}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              disabled={!canModifyProduct(product, "delete")}
                              onClick={() => handleDelete(product._id, product)}
                            >
                              <Trash className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{getActionTooltip(product, "delete")}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {products.length === 0 && (
              <p className="text-center text-gray-600 text-sm py-4">No products found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {products.map((product) => (
          <Card key={product._id} className="shadow-md">
            <CardContent className="pt-4">
              <div className="space-y-2 text-xs sm:text-sm">
                <p><span className="font-medium">Category:</span> {product.category_id?.category_name || "-"}</p>
                <p><span className="font-medium">Sub Category:</span> {product.sub_category_id?.sub_category_name || "-"}</p>
                <p><span className="font-medium">Super Sub Category:</span> {product.super_sub_category_id?.super_sub_category_name || "-"}</p>
                <p><span className="font-medium">Deep Sub Category:</span> {product.deep_sub_category_id?.deep_sub_category_name || "-"}</p>
                <p>
                  <span className="font-medium">Image:</span>{" "}
                  {product.product_image?.[0] ? (
                    <img
                      src={product.product_image[0]}
                      alt="Product"
                      className="w-16 h-16 object-cover rounded inline-block mt-2"
                    />
                  ) : (
                    "-"
                  )}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="View product details"
                    onClick={() => handleView(product)}
                  >
                    <Eye className="h-5 w-5" />
                  </Button>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!canModifyProduct(product, "edit")}
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{getActionTooltip(product, "edit")}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          disabled={!canModifyProduct(product, "delete")}
                          onClick={() => handleDelete(product._id, product)}
                        >
                          <Trash className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{getActionTooltip(product, "delete")}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-4">No products found</p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-between items-center mt-6">
        <div className="text-sm text-gray-600">
          Total Records: {totalProducts}
        </div>
        <div className="flex justify-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            disabled={page === 1 || totalProducts === 0}
            onClick={() => handlePaginationChange(page - 1)}
            variant="outline"
          >
            Previous
          </Button>
          <span className="font-semibold text-gray-700">
            Page {page} of {totalPages}
          </span>
          <Button
            disabled={page >= totalPages || totalProducts === 0}
            onClick={() => handlePaginationChange(page + 1)}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>

      {/* View Product Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent
          className="max-w-[70vw] w-[70vw] max-h-[92vh] overflow-y-auto p-6 sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw]"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-1">
              {selectedProduct?.product_name || "Product Details"}
            </DialogTitle>
            <DialogDescription className="text-base">
              Complete product information
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="mt-6">
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex flex-col items-center lg:w-2/5">
                  {activeImage && (
                    <Zoom>
                      <img
                        src={activeImage}
                        alt="Main Product"
                        className="w-full max-w-[480px] h-auto max-h-[480px] object-contain rounded-xl border shadow-lg"
                      />
                    </Zoom>
                  )}

                  {selectedProduct.product_image?.length > 0 && (
                    <TooltipProvider>
                      <div className="flex gap-4 mt-8 flex-wrap justify-center">
                        {selectedProduct.product_image.map((imageUrl, index) => (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <div
                                onMouseEnter={() => handleImageHover(imageUrl)}
                                className={`w-24 h-24 cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-md ${
                                  activeImage === imageUrl
                                    ? "border-blue-600 ring-2 ring-blue-400"
                                    : "border-gray-300"
                                }`}
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">Hover to preview</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  )}
                </div>

                <div className="flex-1 space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-700 mb-1">Quantity</p>
                      <p className="text-xl font-medium">{selectedProduct.stock_quantity || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-700 mb-1">Price</p>
                      <p className="text-xl font-medium">
                        ₹{parseFloat(selectedProduct.price?.$numberDecimal || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2 text-lg">Description</p>
                    <div
                      className="prose prose-base max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: selectedProduct.description || "<p class='text-gray-500 italic'>No description available</p>"
                      }}
                    />
                  </div>

                  {selectedProduct.attributes?.length > 0 && (
                    <div>
                      <p className="font-semibold text-gray-800 mb-3 text-lg">Attributes</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedProduct.attributes.map((attribute) => (
                          <div
                            key={attribute._id}
                            className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm"
                          >
                            <span className="font-medium text-gray-800 block mb-1">
                              {attribute.attribute_key}
                            </span>
                            <span className="text-gray-600">
                              {attribute.attribute_value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-200 text-base">
                    <div>
                      <span className="font-semibold text-gray-700">Category:</span><br />
                      <span className="text-gray-600">{selectedProduct.category_id?.category_name || "-"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Sub Category:</span><br />
                      <span className="text-gray-600">{selectedProduct.sub_category_id?.sub_category_name || "-"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Super Sub Category:</span><br />
                      <span className="text-gray-600">{selectedProduct.super_sub_category_id?.super_sub_category_name || "-"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Deep Sub Category:</span><br />
                      <span className="text-gray-600">{selectedProduct.deep_sub_category_id?.deep_sub_category_name || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-10 sm:mt-8 gap-4">
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
              className="min-w-[100px]"
            >
              Close
            </Button>
            {canModifyProduct(selectedProduct, "edit") && (
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEdit(selectedProduct);
                }}
                className="min-w-[140px]"
              >
                Edit Product
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal with StepperProductForm */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update the product details below"
                : "Fill in the details to create a new product"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <StepperProductForm
              editingProduct={editingProduct}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingProduct(null);
              }}
              // Optional: refetch after save
              // You can also pass refetch or a callback from parent if needed
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingProduct(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product?"
        description="This action will permanently remove the product and its associated images."
      />
    </div>
  );
};

export default React.memo(MerchantProductListing);
