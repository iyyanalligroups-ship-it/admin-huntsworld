import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSidebar } from "../../hooks/useSidebar";
import { useLazyGetMerchantByEmailOrPhoneQuery } from "@/redux/api/ProductApi";
import { useMerchant } from "@/modules/admin/context/MerchantContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MerchantProductListing from "./pages/MerchantProductList";
import AddProductModal from "./forms/AddProductModal";
import showToast from "@/toast/showToast";
import {
  Search,
  PackagePlus,
  FileEdit,
  Trash2,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  ScanBarcode,
  Loader2
} from "lucide-react";

const MerchantProducts = () => {
  const { isSidebarOpen } = useSidebar();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEmailFromUrl = searchParams.get("email") || "";
  const initialPhoneFromUrl = searchParams.get("phone") || "";

  const [email, setEmail] = useState(initialEmailFromUrl);
  const [phone, setPhone] = useState(initialPhoneFromUrl);
  const [showContent, setShowContent] = useState(false);
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(!!(initialEmailFromUrl || initialPhoneFromUrl));

  const [fetchMerchant, { isLoading: isFetching }] = useLazyGetMerchantByEmailOrPhoneQuery();
  const [merchantProducts, setMerchantProducts] = useState([]);
  const [selectedUser, setSelectedUser] = useState({});
  const [tablePagination, setTablePagination] = useState({});
  const { selectedMerchant, setSelectedMerchant } = useMerchant();

  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Debug logs – keep until fixed
  useEffect(() => {
    console.log("[MerchantProducts] URL email:", searchParams.get("email"));
    console.log("[MerchantProducts] Current email state:", email);
    console.log("[MerchantProducts] showContent:", showContent);
  }, [searchParams, email, showContent]);

  const loadMerchant = useCallback(
    async (searchEmail, searchPhone) => {
      if (!searchEmail?.trim() && !searchPhone?.trim()) {
        console.log("[loadMerchant] skipped - no valid email or phone");
        return;
      }

      console.log("[loadMerchant] starting for:", { searchEmail, searchPhone });

      setError(null);
      setSelectedMerchant(null);
      setMerchantProducts([]);
      setIsLoadingFromUrl(true);

      try {
        console.log("[loadMerchant] → RTK Query called");
        const res = await fetchMerchant({ 
          email: searchEmail?.trim() || undefined, 
          phone: searchPhone?.trim() || undefined 
        }).unwrap();
        console.log("[loadMerchant] response:", res);

        if (res.success && res.merchant) {
          setSelectedMerchant(res.merchant);
          setMerchantProducts(res.products || []);
          setTablePagination(res.pagination || {});
          setSelectedUser(res.user || {});
          setShowContent(true);
          showToast("Merchant loaded successfully", "success");
          setEmail("");
        } else {
          setShowContent(false);
          setError(res.message || "Merchant not found");
          showToast(res.message || "Merchant not found", "error");
        }
      } catch (err) {
        console.error("[loadMerchant] error:", err);
        setShowContent(false);
        setError(err?.data?.message || "Error fetching merchant");
        showToast(err?.data?.message || "Error fetching merchant", "error");
      } finally {
        console.log("[loadMerchant] finished → clearing loading");
        setIsLoadingFromUrl(false);
      }
    },
    [fetchMerchant, setSelectedMerchant]
  );
  // ─────────────────────────────────────────────────────────────
  // Sync email from URL params (only when they change)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const urlEmail = searchParams.get("email")?.trim() || "";
    const urlPhone = searchParams.get("phone")?.trim() || "";
    
    if (urlEmail && urlEmail !== email) {
      setEmail(urlEmail);
    }
    if (urlPhone && urlPhone !== phone) {
      setPhone(urlPhone);
    }
  }, [searchParams]);

  // ─────────────────────────────────────────────────────────────
  // Load merchant when email is available
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (email?.trim() || phone?.trim()) {
      loadMerchant(email, phone);
    }
  }, [email, phone, loadMerchant]);

  const handleSearch = () => {
    if (!email.trim() && !phone.trim()) {
      setError("Please enter an email address or phone number");
      return;
    }

    const params = {};
    if (email.trim()) params.email = email.trim();
    if (phone.trim()) params.phone = phone.trim();

    setSearchParams(params, { replace: true });
    loadMerchant(email, phone);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  const isLoading = isFetching || isLoadingFromUrl;

  return (
    <div
      className={`p-4 md:p-6 min-h-screen bg-slate-50/50 transition-all duration-300 ${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"
        }`}
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start max-w-7xl mx-auto">
        {/* LEFT PANEL: CATALOG OPS SOP */}
        <div className="xl:col-span-1 ">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
              Catalog Ops
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Standard procedures for managing third-party merchant inventories.
            </p>
          </div>
          <div className="space-y-4">
            {/* SOP 1: Authentication */}
            <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <Search size={16} className="text-blue-600" />
                  1. Session Initiation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Always <span className="font-bold">validate the merchant</span> via their registered email before accessing the catalog.
                  <br />
                  <span className="text-slate-400 italic">This ensures product data is mapped to the correct legal entity.</span>
                </p>
              </CardContent>
            </Card>

            {/* SOP 2: Ingestion */}
            <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <PackagePlus size={16} className="text-emerald-600" />
                  2. Inventory Ingestion
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  When adding products:
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Ensure high-resolution images.</li>
                    <li>Verify pricing includes applicable taxes.</li>
                    <li>Map to the correct <span className="font-semibold">Category ID</span>.</li>
                  </ul>
                </p>
              </CardContent>
            </Card>

            {/* SOP 3: Maintenance */}
            <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <ScanBarcode size={16} className="text-amber-600" />
                  3. Lifecycle Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <FileEdit size={12} className="mt-0.5 text-slate-400" />
                    <p className="text-xs text-slate-600"><strong>Edit:</strong> For price updates or stock corrections.</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Trash2 size={12} className="mt-0.5 text-red-400" />
                    <p className="text-xs text-slate-600"><strong>Delete:</strong> Only for discontinued items. <span className="text-red-600 font-bold">This is irreversible.</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT PANEL: FUNCTIONAL WORKSPACE */}
        <div className="xl:col-span-3 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0c1f4d] flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" /> Manage Merchant Products
            </h2>
            {showContent && selectedMerchant && (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Session Active
              </span>
            )}
          </div>

          {/* Search Section */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-6 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-bold">Admin Override Mode</p>
                  <p>You are accessing the product database. Any changes made here will instantly reflect on the customer-facing app.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Merchant phone..."
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (e.target.value) setEmail(""); // Clear email if typing phone
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-9 h-11 text-base border-slate-300 focus-visible:ring-[#0c1f4d]"
                    disabled={isLoading}
                  />
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Merchant email..."
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (e.target.value) setPhone(""); // Clear phone if typing email
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-9 h-11 text-base border-slate-300 focus-visible:ring-[#0c1f4d]"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="bg-[#0c1f4d] cursor-pointer hover:bg-[#153171] text-white px-8 h-11 min-w-[140px]"
                >
                  {isLoading ? "Loading..." : "Access Catalog"}
                </Button>
              </div>
              {error && <p className="text-red-600 text-sm mt-3 font-medium flex items-center gap-2"><AlertCircle size={14} /> {error}</p>}
            </CardContent>
          </Card>

          {/* Loading indicator */}
          {isLoading && !showContent && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#0c1f4d]" />
              <span className="ml-3 text-slate-600">Loading merchant data...</span>
            </div>
          )}

          {/* Show content when loaded */}
          {showContent && selectedMerchant && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Merchant Info */}
              <Card className="border-l-4 border-l-[#0c1f4d] shadow-md bg-white overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Session</h3>
                  <Button
                    onClick={openAddModal}
                    size="sm"
                    className="bg-[#0c1f4d] cursor-pointer hover:bg-[#153171] text-white shadow-sm gap-2"
                  >
                    <PackagePlus size={16} /> Add New Product
                  </Button>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase mb-1">Company Name</span>
                      <span className="font-bold text-slate-800 text-lg">{selectedMerchant.company_name}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase mb-1">Registered Email</span>
                      <span className="font-medium text-slate-700">{selectedMerchant.company_email}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase mb-1">Contact</span>
                      <span className="font-medium text-slate-700">{selectedMerchant.company_phone_number}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Listing */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-700">Product Repository</h3>
                </div>
                <div className="p-0">
                  <MerchantProductListing
                    products={merchantProducts}
                    selectedMerchant={selectedMerchant}
                    pagination={tablePagination}
                    onEdit={handleEdit}
                    onRefresh={() => loadMerchant(selectedMerchant?.company_email, selectedMerchant?.company_phone_number)}
                    userId={selectedUser._id}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddProductModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        editingProduct={editingProduct}
      />
    </div>
  );
};

export default MerchantProducts;
