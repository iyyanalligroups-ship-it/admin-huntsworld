// src/components/modals/SellerDetailsModal.jsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  X, Phone, Mail, Shield, Users, Calendar, MessageSquare, 
  Trash2, Edit2, PlusCircle, Check, RotateCcw, Save, XCircle,
  Building, MapPin
} from "lucide-react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Country, State, City } from "country-state-city";
import showToast from "@/toast/showToast";

// Assuming SellerDetails is your main content component
// If you don't have it yet — you can put all content directly here
const toTitleCase = (str = "") =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));

const SellerDetails = ({ seller, onRefresh }) => {
  const [showMoreImages, setShowMoreImages] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (addressForm.country) {
      setStates(State.getStatesOfCountry(addressForm.country));
    } else {
      setStates([]);
    }
  }, [addressForm.country]);

  useEffect(() => {
    if (addressForm.country && addressForm.state) {
      const baseCities = City.getCitiesOfState(addressForm.country, addressForm.state) || [];
      const currentCity = addressForm.city || "";
      const hasCity = baseCities.some((ci) => ci.name.toLowerCase() === currentCity.toLowerCase());
      const finalCities = hasCity ? baseCities : [...baseCities, { name: toTitleCase(currentCity) }];
      const seen = new Set();
      const dedupedCities = finalCities.filter((ci) => {
        const key = (ci?.name || "").toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCities(dedupedCities);
    } else {
      setCities([]);
    }
  }, [addressForm.country, addressForm.state]);

  const handleEditAddressClick = () => {
    if (seller.address_id) {
      const addr = seller.address_id;
      const allCountries = Country.getAllCountries();
      const countryObj = allCountries.find(
        (c) => c.name.toLowerCase() === (addr.country || "").toLowerCase()
      ) || null;
      
      const countryIsoCode = countryObj?.isoCode || "";
      const allStates = countryIsoCode ? State.getStatesOfCountry(countryIsoCode) : [];
      const stateObj = allStates.find(
        (s) => s.name.toLowerCase() === (addr.state || "").toLowerCase()
      ) || null;

      let canonicalCity = addr.city || "";
      if (countryIsoCode && stateObj?.isoCode) {
        const baseCities = City.getCitiesOfState(countryIsoCode, stateObj.isoCode) || [];
        const match = baseCities.find(
          (ci) => ci.name.toLowerCase() === (addr.city || "").toLowerCase()
        );
        canonicalCity = match ? match.name : toTitleCase(addr.city);
      }

      setAddressForm({
        address_line_1: addr.address_line_1 || "",
        address_line_2: addr.address_line_2 || "",
        city: canonicalCity,
        state: stateObj?.isoCode || "",
        country: countryIsoCode,
        pincode: addr.pincode || "",
      });
    } else {
      setAddressForm({
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        country: "IN",
        pincode: "",
      });
    }
    setIsEditingAddress(true);
  };

  const isFormValid = () => {
    return (
      addressForm.address_line_1.trim() !== "" &&
      addressForm.city.trim() !== "" &&
      addressForm.state.trim() !== "" &&
      addressForm.country.trim() !== "" &&
      addressForm.pincode.trim() !== ""
    );
  };

  const handleAddressSave = async () => {
    if (!isFormValid()) {
      showToast("Please fill all required fields", "warning");
      return;
    }
    try {
      const countryObj = countries.find(c => c.isoCode === addressForm.country);
      const stateObj = states.find(s => s.isoCode === addressForm.state);

      const payload = {
        ...addressForm,
        country: countryObj ? countryObj.name : addressForm.country,
        state: stateObj ? stateObj.name : addressForm.state,
        user_id: seller.user_id?._id || seller.user_id,
        entity_type: "grocery_seller",
        address_type: "company",
      };

      const token = sessionStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (seller.address_id?._id) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/address/update-address/${payload.user_id}/${seller.address_id._id}`,
          payload,
          config
        );
        showToast("Address updated successfully", "success");
      } else {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/address/create-address`, payload, config);
        const newAddressId = response.data.address?._id || response.data.data?._id;
        
        // Explicitly link address to grocery seller
        if (newAddressId) {
          await axios.put(
            `${import.meta.env.VITE_API_URL}/grocery-sellers/update-grocery-seller/${seller._id}`,
            { address_id: newAddressId },
            config
          );
        }
        showToast("Address created successfully", "success");
      }
      setIsEditingAddress(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error saving address:", error);
      showToast(error.response?.data?.message || "Failed to save address", "error");
    }
  };

  const handleAddressDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAddress = async () => {
    try {
      setIsDeleting(true);
      const userId = seller.user_id?._id || seller.user_id;
      const addressId = seller.address_id._id;
      const token = sessionStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/address/delete-address-addressId-userId/${userId}/${addressId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Address deleted successfully", "success");
      setIsDeleteModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error deleting address:", error);
      showToast("Failed to delete address", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!seller) return null;
  console.log(seller, 'grocery seller account');

  return (
    <div className="space-y-6 pb-8">
      {/* Shop Basic Info Card */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Shop Information</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Shop Name</p>
              <p className="font-medium text-gray-900 mt-1">
                {seller.shop_name || seller.company_name || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Type</p>
              <p className="font-medium text-gray-900 mt-1">
                {seller.member_type?.name || seller.member_type || "Grocery Shop"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900 mt-1">
                {seller.shop_email || seller.company_email || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="font-medium text-gray-900 mt-1">
                {seller.shop_phone_number || seller.company_phone_number || "—"}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">Verification Status</p>
            <div className="mt-2">
              {seller.verified_status ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  Not Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Company Address Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Company Address</h2>
          {!isEditingAddress && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditAddressClick}
              className="flex items-center gap-1 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              {seller.address_id ? <Edit2 size={14} /> : <PlusCircle size={14} />}
              {seller.address_id ? "Edit Address" : "Add Address"}
            </Button>
          )}
        </div>
        <div className="p-6">
          {isEditingAddress ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="address_line_1">Address Line 1</Label>
                  <Input
                    id="address_line_1"
                    value={addressForm.address_line_1}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line_1: e.target.value })}
                    placeholder="Street address, P.O. box"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address_line_2">Address Line 2</Label>
                  <Input
                    id="address_line_2"
                    value={addressForm.address_line_2}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line_2: e.target.value })}
                    placeholder="Apartment, suite, unit, etc."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Select
                    value={addressForm.city}
                    onValueChange={(value) => setAddressForm({ ...addressForm, city: value })}
                    disabled={!cities.length}
                  >
                    <SelectTrigger className="w-full bg-white border-gray-200">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {cities
                        .filter((ci) => ci.name && ci.name.trim() !== "")
                        .map((ci) => (
                          <SelectItem key={ci.name} value={ci.name}>
                            {ci.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={addressForm.state}
                    onValueChange={(value) => setAddressForm({ ...addressForm, state: value, city: "" })}
                    disabled={!states.length}
                  >
                    <SelectTrigger className="w-full bg-white border-gray-200">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-white">
                      {states
                        .filter((s) => s.isoCode && s.isoCode.trim() !== "")
                        .map((s) => (
                          <SelectItem key={s.isoCode} value={s.isoCode}>
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={addressForm.country}
                    onValueChange={(value) => setAddressForm({ ...addressForm, country: value, state: "", city: "" })}
                  >
                    <SelectTrigger className="w-full bg-white border-gray-200">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-white">
                      {countries
                        .filter((c) => c.isoCode && c.isoCode.trim() !== "")
                        .map((c) => (
                          <SelectItem key={c.isoCode} value={c.isoCode}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(false)} className="text-gray-500 hover:text-gray-700">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddressSave} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                  <Save size={14} /> Save Address
                </Button>
              </div>
            </div>
          ) : seller.address_id ? (
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-gray-900 font-medium">
                      {seller.address_id.address_line_1}
                      {seller.address_id.address_line_2 && `, ${seller.address_id.address_line_2}`}
                    </p>
                    <p className="text-gray-600">
                      {seller.address_id.city}, {seller.address_id.state}
                    </p>
                    <p className="text-gray-600">
                      {seller.address_id.country} - {seller.address_id.pincode}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddressDeleteClick}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} />
                <span className="ml-2">Delete Address</span>
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-500 mb-2 text-sm italic">No company address linked.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditAddressClick}
                className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <PlusCircle size={14} className="mr-1" /> Add Business Address
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Address Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Delete Company Address
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete the business address for{" "}
              <span className="font-bold text-gray-900">
                {seller.shop_name || "this shop"}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="bg-white border-gray-200"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAddress}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW: User Details Card */}
      <UserDetailsCard user={seller.user_id} />

      {/* Documents / Verification Numbers */}
      {(seller.gst_number || seller.pan || seller.msme_certificate_number || seller.aadhar) && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Verification Documents</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {seller.gst_number && (
              <div>
                <p className="text-sm text-gray-500">GST Number</p>
                <p className="font-mono font-medium mt-1">{seller.gst_number}</p>
              </div>
            )}
            {seller.pan && (
              <div>
                <p className="text-sm text-gray-500">PAN Number</p>
                <p className="font-mono font-medium mt-1">{seller.pan}</p>
              </div>
            )}
            {seller.msme_certificate_number && (
              <div>
                <p className="text-sm text-gray-500">MSME Certificate</p>
                <p className="font-mono font-medium mt-1">{seller.msme_certificate_number}</p>
              </div>
            )}
            {seller.aadhar && (
              <div>
                <p className="text-sm text-gray-500">Aadhaar Number</p>
                <p className="font-mono font-medium mt-1">{seller.aadhar}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logo & Images */}
      {(seller.company_logo || (seller.company_images?.length > 0)) && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Shop Images</h2>
            {seller.company_images?.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoreImages(!showMoreImages)}
              >
                {showMoreImages ? "Show Less" : `View All (${seller.company_images.length})`}
              </Button>
            )}
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {seller.company_logo && (
                <div >
                  <span className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">Shop Logo</span>
                  <Zoom>
                    <img
                      src={seller.company_logo}
                      alt="Shop Logo"
                      className="w-full h-32 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                    />
                  </Zoom>
                </div>
              )}
              {(showMoreImages
                ? seller.company_images
                : seller.company_images?.slice(0, 3) || []
              ).map((img, idx) => (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">
                    Shop Images
                  </h3>
                  <Zoom key={idx}>
                    <img
                      src={img}
                      alt={`Shop image ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                    />
                  </Zoom>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* You can add more sections here: Products, Orders, Reviews, etc. */}
    </div>
  );
};

// ──────────────────────────────────────────────
// User Details Card Component
// ──────────────────────────────────────────────
const UserDetailsCard = ({ user }) => {
  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Associated User</h3>
        <p className="text-gray-500">No user information linked to this seller.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Associated User Account</h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {user.profile_pic ? (
            <Zoom>
              <img
                src={user.profile_pic}
                alt={user.name || "User"}
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 shadow-md"
              />
            </Zoom>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-2xl shadow-md">
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}

          <div className="flex-1">
            <h4 className="text-2xl font-bold text-gray-900">
              {user.name || "Unknown User"}
            </h4>
            <p className="text-gray-600 mt-1">{user.email || "No email provided"}</p>
          </div>
        </div>

        {/* Key information grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-[#0c1f4d] mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{user.phone || "—"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#0c1f4d] mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Account Status</p>
              <p
                className={`font-semibold ${user.isActive ? "text-green-600" : "text-red-600"
                  }`}
              >
                {user.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[#0c1f4d] mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">User Code</p>
              <p className="font-medium">{user?.user_code || "—"}</p>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Main Modal Wrapper
// ──────────────────────────────────────────────
const SellerDetailsModal = ({ seller, open, onClose, onRefresh }) => {
  if (!seller) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="p-0 bg-white overflow-hidden [&>button]:hidden"
        style={{
          width: "80vw",
          maxWidth: "80vw",
          height: "85vh",
          maxHeight: "85vh",
        }}
      >
        {/* Custom Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 bg-gradient-to-r from-[#0c1f4d] to-[#1e3a8a] text-white border-b border-white/20">
          <DialogTitle className="text-2xl font-bold">
            Seller Details — {seller.shop_name || seller.company_name || "Unnamed Shop"}
          </DialogTitle>

          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-6">
            <SellerDetails seller={seller} onRefresh={onRefresh} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellerDetailsModal;
