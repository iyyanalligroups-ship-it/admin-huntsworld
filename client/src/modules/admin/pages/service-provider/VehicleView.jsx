import React, { useState, useEffect } from "react";
import { ArrowLeft, Package, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VehicleView = ({ providerId, handleBack }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(""); // For verified filter: "", "verified", "not-verified"
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const limit = 10;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  // Function to fetch products
  const fetchProducts = async () => {
    if (!providerId) {
      setError("No provider ID provided");
      setProducts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        search,
        filter,
      }).toString();

      const response = await fetch(
        `${API_URL}/products/fetch-all-products-for-seller-by-id/${providerId}?${queryParams}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProducts(data.products || []);
        setPagination(
          data.pagination || {
            totalItems: 0,
            totalPages: 1,
            currentPage: page,
            limit,
          }
        );
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (err) {
      setError(err.message);
      setProducts([]);
      setPagination({
        totalItems: 0,
        totalPages: 1,
        currentPage: page,
        limit,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch products when page, search, filter, or provider changes
  useEffect(() => {
    fetchProducts();
  }, [providerId, page, search, filter]);

  const handleNextPage = () => {
    if (page < pagination.totalPages) setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  return (
    <>
      <div className="flex items-center mb-4">
        <button
          onClick={handleBack}
          className="flex items-center text-[#32242C] hover:text-[#e03733]"
        >
          <ArrowLeft className="w-5 h-5 mr-2 text-[#32242C]" />
          Back to Details
        </button>
      </div>
      <h2 className="text-xl font-bold text-black mb-4">Products</h2>
      <div className="mb-4 flex gap-4">
        <Input
          type="text"
          placeholder="Search products by name..."
          className="w-full sm:w-72 rounded-md border-gray-300 focus:ring-2 focus:ring-gray-900 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Reset to first page on search
          }}
        />
        <Select
          value={filter}
          onValueChange={(value) => {
            setFilter(value);
            setPage(1); // Reset to first page on filter change
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="not-verified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[#32242C]" />
          <span className="ml-2 text-black">Loading products...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-10 text-red-500">
          <AlertCircle className="w-6 h-6 mr-2 text-[#32242C]" />
          <span className="text-black">Error fetching products: {error}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grid View: Only shown if products exist */}
          {products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white p-4 rounded-md shadow-sm"
                >
                  <p className="text-black font-medium">
                    <Package className="w-4 h-4 inline mr-2 text-[#32242C]" />
                    Name: {product.product_name || "N/A"}
                  </p>
                  <p className="text-black">
                    Category: {product.category_id?.name || "N/A"}
                  </p>
                  <p className="text-black">
                    Price: ${product.price || "N/A"}
                  </p>
                  <p className="text-black">
                    Stock: {product.stock_quantity || "N/A"}
                  </p>
                  <p className="text-black">
                    Status: {product.status || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          )}
          {/* Table View */}
          <div className="overflow-x-auto rounded-md shadow-sm">
            <Table className="min-w-full bg-white">
              <TableHeader className="bg-black">
                <TableRow className="hover:bg-black">
                  <TableHead className="text-white text-sm font-semibold">
                    Product Name
                  </TableHead>
                  <TableHead className="text-white text-sm font-semibold">
                    Category
                  </TableHead>
                  <TableHead className="text-white text-sm font-semibold">
                    Subcategory
                  </TableHead>
                  <TableHead className="text-white text-sm font-semibold">
                    Supersubcategory
                  </TableHead>
                  <TableHead className="text-white text-sm font-semibold">
                    Deepsubcategory
                  </TableHead>
                  <TableHead className="text-white text-sm font-semibold">
                    Price
                  </TableHead>
                  <TableHead className="text-white text-sm font-semibold">
                    Stock
                  </TableHead>
                  <TableHead className="text-white text-sm font-semibold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {products.length > 0 ? (
                  products.map((product) => (
                    <TableRow
                      key={product._id}
                      className="border-b hover:bg-gray-100"
                    >
                      <TableCell className="p-3 text-sm text-black">
                        {product.product_name || "N/A"}
                      </TableCell>
                      <TableCell className="p-3 text-sm text-black">
                        {product.category_id?.name || "N/A"}
                      </TableCell>
                      <TableCell className="p-3 text-sm text-black">
                        {product.sub_category_id?.name || "N/A"}
                      </TableCell>
                      <TableCell className="p-3 text-sm text-black">
                        {product.super_sub_category_id?.name || "N/A"}
                      </TableCell>
                      <TableCell className="p-3 text-sm text-black">
                        {product.deep_sub_category_id?.name || "N/A"}
                      </TableCell>
                      <TableCell className="p-3 text-sm text-black">
                        ${product.price || "N/A"}
                      </TableCell>
                      <TableCell className="p-3 text-sm text-black">
                        {product.stock_quantity || "N/A"}
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              console.log(`View product ${product._id}`)
                            }
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              console.log(`Edit product ${product._id}`)
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              console.log(`Delete product ${product._id}`)
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="p-3 text-center text-sm text-black"
                    >
                      No products available for this provider.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          {products.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
              <Button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-sm px-4 py-2"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages} (Total:{" "}
                {pagination.totalItems})
              </span>
              <Button
                onClick={handleNextPage}
                disabled={page === pagination.totalPages}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-sm px-4 py-2"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default VehicleView;
