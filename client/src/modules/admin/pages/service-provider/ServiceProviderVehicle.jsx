import React, { useState, useRef } from "react";
import { useSidebar } from "../../hooks/useSidebar";
import ServiceProviderProductForm from "./forms/ServiceProviderProductForm";
import {
  useLazyGetServiceByEmailOrPhoneQuery,
} from "@/redux/api/ServiceProviderApi";
import { useMerchant } from "@/modules/admin/context/MerchantContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ServiceProviderProductList from "./pages/ServiceProviderProductList";
import showToast from "@/toast/showToast";

const ServiceProviderVehicle = () => {
  const { isSidebarOpen } = useSidebar();
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [fetchServiceProvider, { isLoading }] = useLazyGetServiceByEmailOrPhoneQuery();
  const [selectedUser, setSelectedUser] = useState({});
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [pagination, setPagination] = useState({});
  const { selectedMerchant, setSelectedMerchant } = useMerchant();
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);

  // Create refs for scrolling
  const formRef = useRef(null);
  const productListRef = useRef(null);

  const handleSearch = async () => {
    setError(null);

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      setSelectedMerchant(null);
      setShowForm(false);
      setError("Please enter a valid email address");
      showToast("Invalid email address",'error');
      return;
    }

    try {
      const res = await fetchServiceProvider({ email }).unwrap();
      console.log(res,'service provider');

      if (res.serviceProvider && res?.serviceProvider) {
        setSelectedMerchant(res?.serviceProvider);
        setSelectedUser(res?.user);
        setSelectedProduct(res?.products);
        setPagination(res?.pagination);
        setShowForm(true);
        setEmail("");
        showToast("Fetch Service Provider Successfully",'success');
        // Scroll to form after successful search
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        setSelectedMerchant(null);
        setShowForm(false);
        showToast("Service Provider not found",'info');
        setError("Merchant not found");
      }
    } catch (err) {
      setSelectedMerchant(null);
      setShowForm(false);
      showToast("Error fetching merchant",'error');
      setError("Error fetching merchant");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    showToast(`Editing product: ${product.name || product._id}`,'info');
    // Scroll to form when editing
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleView = (product) => {
    // Assuming "View" highlights or focuses on the product in the list
    // You can customize this based on how "View" is implemented
    showToast(`Viewing product: ${product.name || product._id}`,'info');
    if (productListRef.current) {
      productListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDelete = (productId) => {
    showToast(`Preparing to delete product ID: ${productId}`,'info');
  };

  return (
    <div
      className={`${
        isSidebarOpen ? "lg:p-4 lg:ml-56" : "lg:p-4 lg:ml-16"
      } transition-all duration-300`}
    >
      <div className="flex justify-center items-center mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          Add Service Provider Product
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-full">
        {/* Left Section: Search + Form */}
        <div className="w-full sm:w-1/2">
          {/* Search Input */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-4">
            {/* Left-side Note */}
            <div className="max-w-xs sm:max-w-sm text-gray-700 text-sm bg-yellow-50 border border-yellow-200 p-4 rounded-md shadow-sm">
              <p className="font-medium text-yellow-800 mb-1">Note:</p>
              <p>
                Do you want to add a service provider product?
                <br />
                First, select the service provider by entering their email.
              </p>
            </div>

            {/* Right-side Input + Button */}
            <div className="flex gap-2 items-center justify-center w-full max-w-full sm:max-w-md">
              <Input
                type="text"
                placeholder="Enter merchant email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="border px-4 py-2 rounded-md w-full text-sm"
              />
              <Button
                onClick={handleSearch}
                className="bg-[#0c1f4d] hover:bg-[#153171] text-white rounded-md text-sm px-4 py-2"
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 mb-4 text-center text-sm">{error}</p>
          )}

          {/* Merchant Card */}
          {showForm && selectedMerchant && (
            <div className="w-full max-w-md mb-6">
              <Card className="border rounded-lg shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium">
                      Selected Service Provider Info
                    </p>
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                      {selectedMerchant.travels_name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedMerchant.company_email || "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedMerchant.company_phone_number || "N/A"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Product Form */}
          {showForm && (
            <div ref={formRef}>
              <ServiceProviderProductForm editingProduct={editingProduct} />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-[1px] bg-[#d1d1d1]" />

        {/* Right Section: Product List */}
        {showForm && (
          <div className="w-full sm:w-1/2 overflow-x-auto" ref={productListRef}>
            <ServiceProviderProductList
              products={selectedProduct}
              pagination={pagination}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView} // Pass handleView to the product list
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderVehicle;
