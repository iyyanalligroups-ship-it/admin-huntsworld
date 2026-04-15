import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Edit, X, RefreshCw, MapPin, Calendar, Search, Crown, Loader2, Package, Building2, AlertCircle, Mail, Phone, Globe, ChevronDown, Trash2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUserBySearchQuery, useGetAllAtOnceActiveEbookPaymentsQuery, useCancelEbookMutation } from '@/redux/api/UserSubscriptionPlanApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useGetUniqueCitiesQuery } from '@/redux/api/AddressApi';
import { useCheckUserSubscriptionQuery } from '@/redux/api/BannerPaymentApi';
import { useGetEbookSubscriptionPlansQuery, useGetGSTPlanQuery } from '@/redux/api/CommonSubscriptionPlanApi';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import showToast from '@/toast/showToast';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import axios from 'axios';
import DeleteDialog from '@/model/DeleteModel';

const PaidEbooks = () => {
  const { isSidebarOpen } = useSidebar();
  const { user: adminUser, token: adminToken } = useContext(AuthContext); // admin user

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Merchant-like states
  const [selectedCities, setSelectedCities] = useState([]);           // paid extra — this order
  const [currentCity, setCurrentCity] = useState('');
  const [freeSelectedCities, setFreeSelectedCities] = useState([]);   // free quota
  const [currentFreeCity, setCurrentFreeCity] = useState('');
  const [dbStatus, setDbStatus] = useState(null);
  const [activeEbookRecord, setActiveEbookRecord] = useState(null);
  const [allCompetitors, setAllCompetitors] = useState([]);           // not really used in admin, but kept for structure

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 10;

  const isMobile = window.innerWidth < 640;

  // New state to hold free quota cities per user (for the table)
  const [freeQuotaMap, setFreeQuotaMap] = useState({});

  // ── Queries ────────────────────────────────────────────────────────
  const { data: citiesData } = useGetUniqueCitiesQuery();
  const allCities = citiesData?.data || [];

  const { data: searchResults, isLoading: isSearchLoading } = useGetUserBySearchQuery(debouncedSearch, {
    skip: !debouncedSearch || debouncedSearch.length < 3,
  });

  const { data: subscriptionData } = useCheckUserSubscriptionQuery(selectedSeller?._id, {
    skip: !selectedSeller?._id,
  });

  const { data: ebookPlanData } = useGetEbookSubscriptionPlansQuery();
  const { data: gstPlanData } = useGetGSTPlanQuery();

  const { data: activeEbookPayments, isLoading: isEbookPaymentsLoading, refetch: refetchActivePayments } = useGetAllAtOnceActiveEbookPaymentsQuery({ page, limit });
  const [cancelEbook, { isLoading: isCancelling }] = useCancelEbookMutation();

  // ── Derived / Memo ─────────────────────────────────────────────────
  const pricePerCity = ebookPlanData?.data?.[0]?.price || 1200;
  const gstRate = gstPlanData?.data?.price || 18;
  const totalAmount = (selectedCities.length * pricePerCity) * (1 + gstRate / 100);

  const userHomeCity = "Pondicherry"; // fallback — can be improved if needed

  // Safely get purchased (paid extra) cities
  const purchasedCities =
    activeEbookRecord?.extra_cities ||
    activeEbookRecord?.purchasedCities ||
    activeEbookRecord?.locations ||
    [];

  const hasPaidCities = purchasedCities.length > 0;

  const hasDuplicateSelection = selectedCities.some(city =>
    purchasedCities.some(pc => pc.toLowerCase() === city.toLowerCase())
  );

  // ── Effects ────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchInput.length < 3) {
      setDebouncedSearch('');
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (searchResults?.data?.length > 0) {
      setSelectedSeller(searchResults.data[0]);
    } else if (searchResults?.user) {
      setSelectedSeller(searchResults.user);
    } else {
      setSelectedSeller(null);
      setActiveEbookRecord(null);
      setFreeSelectedCities([]);
      setDbStatus(null);
    }
  }, [searchResults]);

  const loadData = async () => {
    if (!selectedSeller?._id) return;
    setLoadingStatus(true);
    try {
      // 1. Active paid ebook record (may return no active message)
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/e-book-payment/active-payment?user_id=${selectedSeller._id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data?.success) {
        if (res.data.activePayment) {
          setActiveEbookRecord(res.data.activePayment);
        } else if (res.data.purchasedCities?.length > 0) {
          setActiveEbookRecord({ extra_cities: res.data.purchasedCities });
        } else {
          setActiveEbookRecord({ extra_cities: [] });
        }
      } else {
        setActiveEbookRecord({ extra_cities: [] });
      }

      // 2. Free quota status
      const statusRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/e-book-payment/status`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          params: { user_id: selectedSeller._id }
        }
      );

      if (statusRes.data.success) {
        setDbStatus(statusRes.data);
        setFreeSelectedCities(statusRes.data.selectedCities || []);
      }
    } catch (err) {
      console.error("Failed to load ebook/quota data:", err);
      showToast("Could not load ebook / quota data for this seller", "error");
    } finally {
      setLoadingStatus(false);
    }
  };

  // Load active ebook record + free quota status when seller changes
  useEffect(() => {
    if (selectedSeller?._id) {
      loadData();
    } else {
      setActiveEbookRecord(null);
      setFreeSelectedCities([]);
      setDbStatus(null);
    }
  }, [selectedSeller?._id, adminToken]);

  // Fetch free quota cities for all users shown in the recent purchases table
  useEffect(() => {
    if (!activeEbookPayments?.data?.length || isEbookPaymentsLoading) return;

    const fetchFreeCities = async () => {
      const newMap = { ...freeQuotaMap };

      for (const payment of activeEbookPayments.data) {
        const userId = payment.user?._id;
        if (!userId || newMap[userId]) continue; // skip if already fetched

        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/e-book-payment/status?user_id=${userId}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );

          if (res.data.success && res.data.selectedCities) {
            newMap[userId] = res.data.selectedCities;
          }
        } catch (err) {
          console.warn(`Failed to fetch free quota for user ${userId}:`, err);
        }
      }

      setFreeQuotaMap(newMap);
    };

    fetchFreeCities();
  }, [activeEbookPayments?.data, isEbookPaymentsLoading, adminToken]);

  // ── Handlers ───────────────────────────────────────────────────────
  const handleAddFreeCity = async () => {
    if (!currentFreeCity) return;
    const maxAllowed = dbStatus?.maxCities || 0;

    if (freeSelectedCities.length >= maxAllowed) {
      showToast(`Maximum ${maxAllowed} free cities allowed`, 'warning');
      return;
    }

    const lowerCity = currentFreeCity.toLowerCase();

    if (
      freeSelectedCities.some(c => c.toLowerCase() === lowerCity) ||
      lowerCity === userHomeCity.toLowerCase() ||
      purchasedCities.some(pc => pc.toLowerCase() === lowerCity)
    ) {
      showToast("City already taken (free quota / paid / home city)", 'info');
      return;
    }

    const optimistic = [...freeSelectedCities, currentFreeCity];
    setFreeSelectedCities(optimistic);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/e-book-payment/select-free-cities`,
        { user_id: selectedSeller._id, cities: [currentFreeCity] },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        showToast("Free city added successfully", 'success');
        setDbStatus(prev => ({
          ...prev,
          remainingCities: res.data.remainingCities,
          selectedCities: res.data.selectedCities
        }));
      }
    } catch (err) {
      setFreeSelectedCities(prev => prev.filter(c => c !== currentFreeCity));
      showToast(err.response?.data?.message || "Failed to add free city", 'error');
    } finally {
      setCurrentFreeCity('');
    }
  };

  const handlePurchase = async () => {
    if (selectedCities.length === 0) {
      showToast("Select at least one city", 'warning');
      return;
    }

    setIsRazorpayLoading(true);

    try {
      await loadRazorpayScript();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/e-book-payment/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            user_id: selectedSeller._id,
            subscription_id: subscriptionData?.subscriptionId,
            locations: selectedCities,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data?.duplicateCities?.length > 0) {
          showToast(`Cities already unlocked: ${data.duplicateCities.join(", ")}`, 'warning');
        } else {
          showToast(data?.error || "Failed to create order", 'error');
        }
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        order_id: data.order.id,
        handler: async (response) => {
          const verify = await fetch(
            `${import.meta.env.VITE_API_URL}/e-book-payment/verify-payment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
              },
              body: JSON.stringify(response),
            }
          );

          if (verify.ok) {
            showToast("Payment successful — cities unlocked", 'success');
            setSelectedCities([]);
            setIsPurchaseModalOpen(false);
            loadData(); // REFRESH THE CURRENT SELLER DATA
            refetchActivePayments(); // REFRESH THE GLOBAL TABLE
          } else {
            showToast("Payment verification failed", 'error');
          }
        },
        prefill: {
          email: selectedSeller?.email,
          contact: selectedSeller?.phone,
        },
        theme: { color: '#0c1f4d' },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      showToast("Payment flow error", 'error');
    } finally {
      setIsRazorpayLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedSeller(null);
    setSelectedCities([]);
    setFreeSelectedCities([]);
    setCurrentFreeCity('');
    setCurrentCity('');
    setPage(1);
    setFreeQuotaMap({}); // also reset free quota cache
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const randomNameColor = () => {
    const colors = ["bg-red-600", "bg-blue-600", "bg-green-600", "bg-purple-600", "bg-orange-600", "bg-pink-600", "bg-teal-600"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleCancelEbookAccess = async (ebook_payment_id) => {
    setDeletingPaymentId(ebook_payment_id);
    setIsDeleteModalOpen(true);
  };

  const confirmCancelEbook = async () => {
    if (!deletingPaymentId) return;
    try {
      const res = await cancelEbook(deletingPaymentId).unwrap();
      if (res.success) {
        showToast("E-book access cancelled successfully", 'success');
        loadData(); // REFRESH THE CURRENT SELLER DATA
        refetchActivePayments(); // REFRESH THE GLOBAL TABLE
      }
    } catch (err) {
      console.error("Cancel Ebook Access Error:", err);
      showToast(err?.data?.error || "Failed to cancel e-book access", 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingPaymentId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (loadingStatus && selectedSeller) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#0c1f4d]" />
      </div>
    );
  }

  return (
    <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
            Manage E-Book Subscriptions
          </h2>
          <Button
            onClick={handleRefresh}
            className="bg-gray-600 hover:bg-gray-700 text-white"
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Search Seller */}
        <div className="mb-6">
          <Label className="text-gray-700">Search Seller by Email or Phone</Label>
          <div className="relative w-full mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.trim())}
              placeholder="e.g. seller@example.com or 9876543210"
              className="pl-9 border-2 border-slate-300"
              disabled={isRefreshing}
            />
          </div>

          {isSearchLoading && <p className="mt-2 text-gray-500">Searching...</p>}

          {searchResults?.data?.length > 0 && (
            <div className="mt-3 border rounded-md max-h-60 overflow-auto">
              {searchResults.data.map((seller) => (
                <div
                  key={seller._id}
                  className={`p-3 cursor-pointer hover:bg-gray-100 ${selectedSeller?._id === seller._id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedSeller(seller)}
                >
                  {seller.name || '—'} • {seller.email} • {seller.phone || 'N/A'}
                </div>
              ))}
            </div>
          )}

          {selectedSeller && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <p className="font-medium text-[#0c1f4d]">Selected Seller: {selectedSeller.name || '—'}</p>
              <p className="text-sm">Email: {selectedSeller.email}</p>
              <p className="text-sm">Phone: {selectedSeller.phone || 'N/A'}</p>
            </div>
          )}
        </div>


        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Seller-specific: Free quota + Buy extra cities */}
        {selectedSeller && (
          <>
            {/* Paid Cities Section */}
            {hasPaidCities ? (
              <Card className="mb-8 border-t-4 border-green-700 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Package className="h-5 w-5 text-green-600" />
                    Already Unlocked Cities (Paid Extra)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-green-50 rounded-lg border border-green-100">
                    {purchasedCities.map(city => (
                      <span
                        key={city}
                        className="px-4 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium shadow-sm"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">No paid extra cities detected for this seller</span>
                </div>
                <p>
                  The current view shows only the most recent active payment (if any).<br />
                  Free city quota selection is still available below.
                </p>
              </div>
            )}

            {/* Free Quota Section */}
            <Card className="mb-8 border-t-4 border-[#0c1f4d] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Crown className="h-5 w-5 text-indigo-600" />
                  Free City Quota (for this seller)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Max Free Cities</p>
                    <p className="text-3xl font-bold text-indigo-700">{dbStatus?.maxCities ?? 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="text-3xl font-bold text-green-600">{dbStatus?.remainingCities ?? 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Selected</p>
                    <p className="text-3xl font-bold">{freeSelectedCities.length}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Select
                    onValueChange={setCurrentFreeCity}
                    value={currentFreeCity}
                    disabled={freeSelectedCities.length >= (dbStatus?.maxCities || 0) || dbStatus?.remainingCities === 0}
                  >
                    <SelectTrigger className="w-full sm:w-96 border-2 border-slate-300">
                      <SelectValue placeholder="Choose a city (free quota)" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCities
                        .filter(c => {
                          const lower = c.city.toLowerCase();
                          return (
                            !freeSelectedCities.some(fc => fc.toLowerCase() === lower) &&
                            !purchasedCities.some(pc => pc.toLowerCase() === lower) &&
                            lower !== userHomeCity.toLowerCase()
                          );
                        })
                        .map(c => (
                          <SelectItem key={c.city} value={c.city}>
                            {c.city}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleAddFreeCity}
                    disabled={
                      !currentFreeCity ||
                      freeSelectedCities.length >= (dbStatus?.maxCities || 0) ||
                      dbStatus?.remainingCities === 0
                    }
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Free City
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-gray-50 rounded-lg border border-dashed">
                  {freeSelectedCities.length === 0 ? (
                    <p className="text-gray-400 m-auto text-sm">No free cities selected yet</p>
                  ) : (
                    freeSelectedCities.map(city => (
                      <span
                        key={city}
                        className="px-4 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium shadow-sm"
                      >
                        {city}
                      </span>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Buy Extra Cities Button */}
            <div className="mb-6">
              <Button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4d]/90"
                disabled={isRazorpayLoading}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy Extra Cities (Paid)
              </Button>
            </div>

            {/* Purchase Modal */}
            <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Unlock New Cities (Paid)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">

                  <div className="flex gap-2">
                    <Select onValueChange={setCurrentCity} value={currentCity}>
                      <SelectTrigger className="w-full border-2 border-slate-300">
                        <SelectValue placeholder="e.g. Search Cities" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCities
                          .filter(c => {
                            const lower = c.city.toLowerCase();
                            return (
                              !freeSelectedCities.some(fc => fc.toLowerCase() === lower) &&
                              !purchasedCities.some(pc => pc.toLowerCase() === lower) &&
                              lower !== userHomeCity.toLowerCase() &&
                              !selectedCities.some(sc => sc.toLowerCase() === lower)
                            );
                          })
                          .map(c => (
                            <SelectItem key={c.city} value={c.city}>
                              {c.city}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                    
                      onClick={() => {
                        if (!currentCity) return;

                        const cityLower = currentCity.trim().toLowerCase();

                        if (selectedCities.some(c => c.toLowerCase() === cityLower)) {
                          showToast("Already added in this order", "warning");
                          return;
                        }

                        if (purchasedCities.some(pc => pc.toLowerCase() === cityLower)) {
                          showToast("City already unlocked (paid extra)", "warning");
                          return;
                        }

                        if (freeSelectedCities.some(fc => fc.toLowerCase() === cityLower)) {
                          showToast("City already in free quota", "warning");
                          return;
                        }

                        if (cityLower === userHomeCity.toLowerCase()) {
                          showToast("Home city is always included", "info");
                          return;
                        }

                        setSelectedCities(prev => [...new Set([...prev, currentCity])]);
                        setCurrentCity('');
                      }}
                      className="bg-[#0c1f4d] cursor-pointer"
                    >
                      Add
                    </Button>
                  </div>

                  <div className="min-h-[100px] border-2 border-dashed rounded-xl p-3 bg-gray-50 flex flex-wrap gap-2 content-start">
                    {selectedCities.length === 0 ? (
                      <p className="text-gray-400 text-xs m-auto">No cities selected yet</p>
                    ) : (
                      selectedCities.map(c => (
                        <span
                          key={c}
                          className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center border shadow-sm bg-white"
                        >
                          {c}
                          <X
                            className="ml-2 h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => setSelectedCities(selectedCities.filter(sc => sc !== c))}
                          />
                        </span>
                      ))
                    )}
                  </div>

                  {hasDuplicateSelection && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center text-xs gap-2 border border-red-100">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      One or more cities are already unlocked.
                    </div>
                  )}

                  <div className="bg-[#0c1f4d] text-white p-5 rounded-2xl shadow-lg">
                    <div className="flex justify-between text-xs opacity-80 mb-1">
                      <span>Selected Cities:</span>
                      <span>{selectedCities.length}</span>
                    </div>
                    <div className="flex justify-between text-xs opacity-80">
                      <span>Price per City (+GST):</span>
                      <span>₹{pricePerCity}</span>
                    </div>
                    <div className="flex justify-between font-bold text-2xl border-t border-white/20 mt-3 pt-3">
                      <span>Total</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handlePurchase}
                    disabled={selectedCities.length === 0 || isRazorpayLoading || hasDuplicateSelection}
                    className="w-full cursor-pointer h-12 text-lg font-bold bg-green-600 hover:bg-green-700"
                  >
                    {isRazorpayLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Securing Payment...
                      </>
                    ) : (
                      "Purchase Access Now"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* Always visible: Recent Active E-Book Purchases – now showing both paid + free */}
      <div className="mb-10">
        <h2 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
          Recent Active E-Book Purchases
        </h2>

        {isEbookPaymentsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="space-y-4">
              <Skeleton className="h-64 w-full sm:h-16" />
              <Skeleton className="h-64 w-full sm:h-16" />
            </div>
          </div>
        ) : activeEbookPayments?.data?.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader className="bg-[#0c1f4d]">
                  <TableRow>
                    <TableHead className="text-white">Seller</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                    <TableHead className="text-white">Phone</TableHead>
                    <TableHead className="text-white">Unlocked Cities</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEbookPayments.data.map((payment) => {
                    const userId = payment.user?._id;
                    const freeCities = freeQuotaMap[userId] || [];

                    return (
                      <TableRow key={payment._id || payment.user?._id}>
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className={randomNameColor()}>
                              {getInitial(payment.user?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{payment.user?.name || "—"}</div>
                            <div className="text-xs text-muted-foreground">Seller</div>
                          </div>
                        </TableCell>
                        <TableCell>{payment.user?.email || "—"}</TableCell>
                        <TableCell>{payment.user?.phone || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {/* Paid extra cities */}
                            {payment.locations?.length > 0 ? (
                              payment.locations.map((loc) => (
                                <Badge
                                  key={`paid-${loc}`}
                                  variant="outline"
                                  className="bg-green-50 text-green-800 border-green-200"
                                >
                                  {loc} <span className="ml-1 text-xs opacity-70">(paid)</span>
                                </Badge>
                              ))
                            ) : null}

                            {/* Free quota cities */}
                            {freeCities.length > 0 ? (
                              freeCities.map((loc) => (
                                <Badge
                                  key={`free-${loc}`}
                                  variant="outline"
                                  className="bg-blue-50 text-blue-800 border-blue-200"
                                >
                                  {loc} <span className="ml-1 text-xs opacity-70">(free)</span>
                                </Badge>
                              ))
                            ) : null}

                            {payment.locations?.length === 0 && freeCities.length === 0 && "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="bg-red-50 cursor-pointer text-red-600 hover:bg-red-100 border border-red-200 h-8 px-2"
                            onClick={() => handleCancelEbookAccess(payment._id)}
                            disabled={isCancelling}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Cancel Paid
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-4">
              {activeEbookPayments.data.map((payment) => {
                const userId = payment.user?._id;
                const freeCities = freeQuotaMap[userId] || [];

                return (
                  <Card key={payment._id || payment.user?._id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarFallback className={randomNameColor()}>
                            {getInitial(payment.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{payment.user?.name || "—"}</p>
                          <p className="text-sm text-muted-foreground">Seller</p>
                        </div>
                      </div>
                      <p>Email: {payment.user?.email || "—"}</p>
                      <p>Phone: {payment.user?.phone || "—"}</p>

                      <div className="mt-4">
                        <p className="text-sm font-medium mb-1">Unlocked Cities:</p>
                        <div className="flex flex-wrap gap-1">
                          {payment.locations?.length > 0 ? (
                            payment.locations.map((loc) => (
                              <span
                                key={`paid-${loc}`}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                {loc} (paid)
                              </span>
                            ))
                          ) : null}

                          {freeCities.length > 0 ? (
                            freeCities.map((loc) => (
                              <span
                                key={`free-${loc}`}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {loc} (free)
                              </span>
                            ))
                          ) : null}

                          {payment.locations?.length === 0 && freeCities.length === 0 && (
                            <span className="text-gray-500 text-sm">None</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t flex justify-end">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="bg-red-50 cursor-pointer text-red-600 hover:bg-red-100 border border-red-200"
                          onClick={() => handleCancelEbookAccess(payment._id)}
                          disabled={isCancelling}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel Paid Access
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {activeEbookPayments?.pagination?.totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 1 && setPage(page - 1)}
                      className={page === 1 ? "opacity-50 pointer-events-none" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: activeEbookPayments.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={page === p} onClick={() => setPage(p)}>
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => page < activeEbookPayments.pagination.totalPages && setPage(page + 1)}
                      className={page >= activeEbookPayments.pagination.totalPages ? "opacity-50 pointer-events-none" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No active e-book purchases found in the system
          </div>
        )}
      </div>
      <DeleteDialog
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingPaymentId(null);
        }}
        onConfirm={confirmCancelEbook}
        title="Cancel E-book Access"
        description="Are you sure you want to CANCEL this paid e-book access? This will revoke the extra cities for this seller."
      />
    </div>
  );
};

export default PaidEbooks;
