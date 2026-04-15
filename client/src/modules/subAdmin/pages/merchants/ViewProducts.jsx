import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Pencil, Trash2, Save, X } from "lucide-react";

// ProductDetails Component
const ProductDetails = ({ product }) => {
  console.log("Product data in ProductDetails:", product); // Debug product structure
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md shadow-sm w-full box-border max-w-full">
      <h4 className="text-lg font-semibold mb-2">Additional Product Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0 w-full">
        <div className="flex justify-center">
          {product.product_image && product.product_image.length > 0 ? (
            <img
              src={product.product_image[0]}
              alt={product.product_name}
              className="h-32 w-32 object-cover rounded-md border border-gray-200"
              onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=No+Image")}
            />
          ) : (
            <div className="h-32 w-32 flex items-center justify-center bg-gray-200 rounded-md border border-gray-200">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
        </div>
        <div className="md:col-span-2 min-w-0 w-full">
          <div className="grid grid-cols-2 gap-4 min-w-0 w-full">
            <div>
              <p><strong>Product Name:</strong> {product.product_name}</p>
              <p><strong>Price:</strong> {product.price?.$numberDecimal || "N/A"}</p>
              <p><strong>Category:</strong> {product.category_id?.name || product.category_id?.category_name || product.category_name || "N/A"}</p>
              <p><strong>Subcategory:</strong> {product.sub_category_id?.name || product.sub_category_id?.sub_category_name || product.sub_category_name || "N/A"}</p>
            </div>
            <div>
              <p><strong>Stock:</strong> {product.stock_quantity || "N/A"}</p>
              <p><strong>Supersubcategory:</strong> {product.super_sub_category_id?.name || product.super_sub_category_id?.super_sub_category_name || product.super_sub_category_name || "N/A"}</p>
              <p><strong>Deepsubcategory:</strong> {product.deep_sub_category_id?.name || product.deep_sub_category_id?.deep_sub_category_name || product.deep_sub_category_name || "N/A"}</p>
              <p><strong>Last Updated:</strong> {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>
          <div className="mt-4 max-w-full w-full min-w-0">
            <p className="text-sm break-words whitespace-normal">
              <strong>Description:</strong>{" "}
              <span className="break-words inline-block w-full">
                {product.description || "No description available"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ProductEditForm Component
const ProductEditForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    product_name: product.product_name || "",
    description: product.description || "",
    price: product.price?.$numberDecimal || "",
    stock_quantity: product.stock_quantity || "",
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for the field being edited
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.product_name.trim()) {
      errors.product_name = "Product name is required";
    }
    if (!formData.price || isNaN(formData.price) || Number(formData.price) < 0) {
      errors.price = "Valid price is required";
    }
    if (!formData.stock_quantity || isNaN(formData.stock_quantity) || Number(formData.stock_quantity) < 0) {
      errors.stock_quantity = "Valid stock quantity is required";
    }
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    onSave(product._id, formData);
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex justify-center">
          {product.product_image && product.product_image.length > 0 ? (
            <img
              src={product.product_image[0]}
              alt={product.product_name}
              className="h-32 w-32 object-cover rounded-md border border-gray-200"
              onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=No+Image")}
            />
          ) : (
            <div className="h-32 w-32 flex items-center justify-center bg-gray-200 rounded-md border border-gray-200">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Product Name</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${formErrors.product_name ? "border-red-500" : ""}`}
              />
              {formErrors.product_name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.product_name}</p>
              )}
              <label className="block text-sm font-medium mt-2">Price</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${formErrors.price ? "border-red-500" : ""}`}
              />
              {formErrors.price && (
                <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Stock</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${formErrors.stock_quantity ? "border-red-500" : ""}`}
              />
              {formErrors.stock_quantity && (
                <p className="text-red-500 text-xs mt-1">{formErrors.stock_quantity}</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="mt-4 flex space-x-2">
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// DeleteConfirmationModal Component
const DeleteConfirmationModal = ({ isOpen, productName, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full pointer-events-auto">
        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "<strong>{productName}</strong>"? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-2">
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

// ViewProducts Component
const ViewProducts = ({ merchant, onBack }) => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [categoryCache, setCategoryCache] = useState({});
  const productsPerPage = 10;

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api/v1",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    },
  });

  const fetchCategoryName = async (categoryId, type) => {
    if (!categoryId) return "N/A";
    if (categoryCache[`${type}_${categoryId}`]) {
      return categoryCache[`${type}_${categoryId}`];
    }
    try {
      let endpoint;
      switch (type) {
        case "category":
          endpoint = `/categories/fetch-by-id-category/${categoryId}`;
          break;
        case "sub_category":
          endpoint = `/sub-categories/fetch-by-id-sub-category/${categoryId}`;
          break;
        case "super_sub_category":
          endpoint = `/super-sub-categories/fetch-super-sub-category-by-id/${categoryId}`;
          break;
        case "deep_sub_category":
          endpoint = `/deep-sub-categories/fetch-deep-sub-category-by-id/${categoryId}`;
          break;
        default:
          return "N/A";
      }
      const response = await api.get(endpoint);
      let name;
      switch (type) {
        case "category":
          name = response.data.data?.category_name || "N/A";
          break;
        case "sub_category":
          name = response.data.data?.sub_category_name || "N/A";
          break;
        case "super_sub_category":
          name = response.data.data?.super_sub_category_name || "N/A";
          break;
        case "deep_sub_category":
          name = response.data.data?.deep_sub_category_name || "N/A";
          break;
        default:
          name = "N/A";
      }
      setCategoryCache((prev) => ({ ...prev, [`${type}_${categoryId}`]: name }));
      return name;
    } catch (error) {
      console.error(`Error fetching ${type} name:`, error);
      return error.response?.status === 404 ? "Category Not Found" : "N/A";
    }
  };

  const fetchProducts = async (page = 1, searchQuery = "", filterOption = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = merchant.user_id?._id || merchant.user_id;
      if (!userId) {
        throw new Error("Merchant user ID is undefined");
      }
      const response = await api.get(`/products/fetch-all-products-by-seller-id/${userId}`, {
        params: {
          page,
          limit: productsPerPage,
          search: searchQuery,
          filter: filterOption,
        },
      });

      if (response.data.success) {
        const enrichedProducts = await Promise.all(
          response.data.products.map(async (product) => {
            const enrichedProduct = { ...product };
            enrichedProduct.category_id = {
              ...product.category_id,
              name: product.category_id?.category_name || product.category_name || (product.category_id?._id ? await fetchCategoryName(product.category_id._id, "category") : "N/A"),
            };
            enrichedProduct.sub_category_id = {
              ...product.sub_category_id,
              name: product.sub_category_id?.sub_category_name || product.sub_category_name || (product.sub_category_id?._id ? await fetchCategoryName(product.sub_category_id._id, "sub_category") : "N/A"),
            };
            enrichedProduct.super_sub_category_id = {
              ...product.super_sub_category_id,
              name: product.super_sub_category_id?.super_sub_category_name || product.super_sub_category_name || (product.super_sub_category_id?._id ? await fetchCategoryName(product.super_sub_category_id._id, "super_sub_category") : "N/A"),
            };
            enrichedProduct.deep_sub_category_id = {
              ...product.deep_sub_category_id,
              name: product.deep_sub_category_id?.deep_sub_category_name || product.deep_sub_category_name || (product.deep_sub_category_id?._id ? await fetchCategoryName(product.deep_sub_category_id._id, "deep_sub_category") : "N/A"),
            };
            return enrichedProduct;
          })
        );
        setProducts(enrichedProducts);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError("Failed to fetch products.");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(`Failed to fetch products: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userId = merchant.user_id?._id || merchant.user_id;
    if (userId) {
      fetchProducts(currentPage, search, filter);
    } else {
      setError("Merchant user ID is missing.");
      setIsLoading(false);
    }
  }, [merchant.user_id?._id || merchant.user_id, currentPage, search, filter]);

  const handleViewClick = (productId) => {
    setSelectedProductId((prevId) => (prevId === productId ? null : productId));
    setEditingProductId(null);
  };

  const handleEditClick = (productId) => {
    setEditingProductId(productId);
    setSelectedProductId(null);
  };

  const handleSaveEdit = async (productId, updatedData) => {
    setError(null);
    try {
      const formattedData = {
        ...updatedData,
        product_name: updatedData.product_name.trim().toLowerCase().replace(/\s+/g, "-"),
        price: updatedData.price ? String(updatedData.price) : null,
        stock_quantity: updatedData.stock_quantity ? Number(updatedData.stock_quantity) : null,
      };

      const response = await api.put(`/products/update-products/${productId}`, formattedData);

      if (response.data.success) {
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product._id === productId
              ? { ...product, ...response.data.product }
              : product
          )
        );
        setEditingProductId(null);
      } else {
        setError(response.data.message || "Failed to update product.");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setError(`Failed to update product: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  const handleDeleteClick = (productId, productName) => {
    setProductToDelete({ id: productId, name: productName });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      setError(null);
      try {
        const response = await api.delete(`/products/delete-products/${productToDelete.id}`);
        if (response.data.success) {
          setProducts((prevProducts) =>
            prevProducts.filter((product) => product._id !== productToDelete.id)
          );
          setSelectedProductId(null);
          setEditingProductId(null);
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        } else {
          setError(response.data.message || "Failed to delete product.");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        setError(`Failed to delete product: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className="flex flex-col flex-grow">
      <h3 className="text-xl font-semibold mb-4">Product Details</h3>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by product name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-72 rounded-md border-gray-300 focus:ring-2 focus:ring-gray-900 text-sm"
        />
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-48 rounded-md border-gray-300 focus:ring-2 focus:ring-gray-900 text-sm"
        >
          <option value="">All Products</option>
          <option value="verified">Verified</option>
          <option value="not_verified">Not Verified</option>
        </select>
      </div>

      {isLoading ? (
        <p>Loading products...</p>
      ) : products.length > 0 ? (
        <div className="rounded-md border bg-white shadow-sm max-w-full overflow-x-auto">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-black hover:bg-black">
                <TableHead className="text-white w-[20%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Product Name
                </TableHead>
                <TableHead className="text-white w-[15%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Category
                </TableHead>
                <TableHead className="text-white w-[15%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Subcategory
                </TableHead>
                <TableHead className="text-white w-[15%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Supersubcategory
                </TableHead>
                <TableHead className="text-white w-[15%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Deepsubcategory
                </TableHead>
                <TableHead className="text-white w-[20%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <React.Fragment key={product._id}>
                  <TableRow className="hover:bg-gray-100">
                    <TableCell className="whitespace-nowrap text-ellipsis overflow-hidden min-w-0 max-w-full">
                      {product.product_name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ellipsis overflow-hidden min-w-0 max-w-full">
                      {product.category_id?.name || product.category_id?.category_name || product.category_name || "N/A"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ellipsis overflow-hidden min-w-0 max-w-full">
                      {product.sub_category_id?.name || product.sub_category_id?.sub_category_name || product.sub_category_name || "N/A"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ellipsis overflow-hidden min-w-0 max-w-full">
                      {product.super_sub_category_id?.name || product.super_sub_category_id?.super_sub_category_name || product.super_sub_category_name || "N/A"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ellipsis overflow-hidden min-w-0 max-w-full">
                      {product.deep_sub_category_id?.name || product.deep_sub_category_id?.deep_sub_category_name || product.deep_sub_category_name || "N/A"}
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          title={selectedProductId === product._id ? "Close" : "View"}
                          onClick={() => handleViewClick(product._id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Edit"
                          onClick={() => handleEditClick(product._id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          title="Delete"
                          onClick={() => handleDeleteClick(product._id, product.product_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {editingProductId === product._id && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <ProductEditForm
                          product={product}
                          onSave={handleSaveEdit}
                          onCancel={handleCancelEdit}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="flex-grow">
          No product details available for {merchant.company_name || "this merchant"}.
        </p>
      )}

      {products.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-sm px-4 py-2"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-sm px-4 py-2"
          >
            Next
          </Button>
        </div>
      )}

      {selectedProductId && products.find((p) => p._id === selectedProductId) && (
        <div className="mt-4 max-w-4xl mx-auto">
          <ProductDetails product={products.find((p) => p._id === selectedProductId)} />
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        productName={productToDelete?.name}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <div className="flex justify-end mt-4">
        <Button
          onClick={onBack}
          className="bg-[#1c1b20] hover:bg-[#c0302c] text-white"
        >
          Back to Company Details
        </Button>
      </div>
    </div>
  );
};

export default ViewProducts;