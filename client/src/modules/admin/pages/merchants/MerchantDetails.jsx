import React, { useState, useEffect } from "react";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { X, Phone, Mail, Building, Users, Briefcase, FileText, Shield, File, Trash2, Edit2, PlusCircle, Check, RotateCcw, Save, XCircle, Video } from "lucide-react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Country, State, City } from "country-state-city";
import showToast from "@/toast/showToast";
import ViewProducts from "./ViewProducts";
import TrustSealCertificate from "./TrustSealCertificate";
import { useNavigate } from "react-router-dom";
import { useSelectedUser } from "../../context/SelectedUserContext";
import {
  Dialog,
  DialogContent,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const toTitleCase = (str = "") =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));

const ModifiedBadge = () => (
  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200 text-[10px] h-4 px-1 animate-pulse">
    Edited
  </Badge>
);

// ──────────────────────────────────────────────
// Small Card (Left Side)
// ──────────────────────────────────────────────
const SmallCard = ({ merchant, onViewProducts }) => {
  const [showPhone, setShowPhone] = useState(false);
  const [imageErrors, setImageErrors] = useState([]);
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();

  const PLACEHOLDER_IMAGE =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGUrgk9WAAAAABJRU5ErkJggg==";

  const logoUrl = merchant.company_logo && typeof merchant.company_logo === "string"
    ? merchant.company_logo
    : PLACEHOLDER_IMAGE;

  const imageUrls = Array.isArray(merchant.company_images)
    ? merchant.company_images.filter((url) => url && typeof url === "string")
    : [];

  const handleImageError = (e, index, url) => {
    if (url === PLACEHOLDER_IMAGE) return;
    console.error(`Failed to load image: ${url}`);
    setImageErrors((prev) => [...new Set([...prev, url])]);
    e.target.src = PLACEHOLDER_IMAGE;
  };

  const handleCardClick = (seller) => {
    console.log(seller, 'seller chat info');
    setSelectedUser(seller);
    navigate('/admin-dashboard/chat');
  };

  return (
    <Card className="w-full bg-white rounded-lg shadow-md border border-gray-200">
      <CardHeader className="flex items-center p-4 sm:p-6">
        {merchant.company_logo && (
          <Zoom>
            <img
              src={logoUrl}
              alt={`${merchant.company_name || "Merchant"} Logo`}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mr-3 sm:mr-4 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onError={(e) => handleImageError(e, -1, logoUrl)}
              loading="lazy"
            />
          </Zoom>
        )}
        <div>
          {merchant.company_name && (
            <h3 className="text-base sm:text-xl font-bold text-gray-900 flex items-center">
              {merchant.company_name}
              {merchant.modifiedFields?.includes('company_name') && <ModifiedBadge />}
            </h3>
          )}
          {merchant.company_email && (
            <a
              href={`mailto:${merchant.company_email}`}
              className="text-blue-600 hover:underline text-xs sm:text-sm flex items-center gap-1"
            >
              <Mail className="w-4 h-4 text-[#0c1f4d]" />
              {merchant.company_email}
              {merchant.modifiedFields?.includes('company_email') && <ModifiedBadge />}
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        {merchant.company_phone_number && (
          <div>
            <button
              onClick={() => setShowPhone(!showPhone)}
              className="text-blue-600 hover:underline cursor-pointer text-xs sm:text-sm flex items-center gap-1"
            >
              <Phone className="w-4 h-4 text-[#0c1f4d]" />
              {showPhone ? "Hide Phone Number" : "View Phone Number"}
            </button>
            {showPhone && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center">
                {merchant.company_phone_number}
                {merchant.modifiedFields?.includes('company_phone_number') && <ModifiedBadge />}
              </p>
            )}
          </div>
        )}

        {merchant.year_of_establishment && (
          <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
            <Building className="w-4 h-4 text-[#0c1f4d]" />
            <strong>Year of Establishment:</strong> {merchant.year_of_establishment}
          </p>
        )}

        {merchant.number_of_employees && (
          <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
            <Users className="w-4 h-4 text-[#0c1f4d]" />
            <strong>No. of Employees:</strong> {merchant.number_of_employees}
          </p>
        )}

        {merchant.company_type && (
          <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
            <Briefcase className="w-4 h-4 text-[#0c1f4d]" />
            <strong>Nature of Business:</strong>{" "}
            {merchant.company_type?.name || merchant.company_type || "—"}
            {merchant.modifiedFields?.includes('company_type') && <ModifiedBadge />}
          </p>
        )}

        {merchant.company_video && (
          <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
            <Video className="w-4 h-4 text-[#0c1f4d]" />
            <strong>Company Video:</strong>{" "}
            <a href={merchant.company_video} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              View Link
            </a>
            {merchant.modifiedFields?.includes('company_video') && <ModifiedBadge />}
          </p>
        )}

        {imageUrls.length > 0 && (
          <div>
            {imageErrors.length > 0 && (
              <p className="text-red-500 text-xs sm:text-sm mb-2">
                Failed to load {imageErrors.length} image(s). Using placeholder.
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {imageUrls.map((image, index) => (
                <Zoom key={index}>
                  <img
                    src={image}
                    alt={`Company Image ${index + 1}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md hover:opacity-80 cursor-pointer transition-opacity"
                    onError={(e) => handleImageError(e, index, image)}
                    loading="lazy"
                  />
                </Zoom>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 sm:p-6 flex flex-col sm:flex-row gap-2 sm:gap-4">
        {merchant.company_email && (
          <Button
            onClick={() => handleCardClick(merchant)}
            className="bg-[#0c1f4d] hover:bg-[#153171] text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 min-w-[100px]"
          >
            Contact Supplier
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// ──────────────────────────────────────────────
// User Details Card
// ──────────────────────────────────────────────
const UserDetailsCard = ({ user }) => {
  if (!user) {
    return (
      <Card className="w-full bg-white rounded-lg shadow-md border border-gray-200">
        <CardHeader className="p-4 sm:p-6">
          <h3 className="text-base sm:text-xl font-semibold text-gray-900">
            User Details
          </h3>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <p className="text-gray-500">No associated user information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white rounded-lg shadow-md border border-gray-200">
      <CardHeader className="p-4 sm:p-6">
        <h3 className="text-base sm:text-xl font-semibold text-gray-900">
          User Details
        </h3>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[#0c1f4d]" />
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Full Name</p>
              <p className="font-medium">{user.name || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#0c1f4d]" />
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email || "Not provided"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-[#0c1f4d]" />
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Phone Number</p>
              <p className="font-medium">{user.phone || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#0c1f4d]" />
            <div>
              <p className="text-xs sm:text-sm text-gray-500">User Code</p>
              <p className="font-medium font-mono tracking-wide">
                {user.user_code || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#0c1f4d]" />
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Account Status</p>
              <p className={`font-medium ${user.isActive ? "text-green-600" : "text-red-600"}`}>
                {user.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          {user.created_at && (
            <div className="flex items-center gap-3">
              <File className="w-5 h-5 text-[#0c1f4d]" />
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Joined</p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ──────────────────────────────────────────────
// Large Card (Company Details / Address Management)
// ──────────────────────────────────────────────
const LargeCard = ({ merchant, showProducts, setShowProducts, onRefresh }) => {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showTrustSeal, setShowTrustSeal] = useState(false);
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

  const handleEditClick = () => {
    if (merchant.company_address) {
      const addr = merchant.company_address;
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
        user_id: merchant.user_id?._id || merchant.user_id,
        entity_type: "merchant",
        address_type: "company",
      };

      if (merchant.company_address?._id) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/address/update-address/${payload.user_id}/${merchant.company_address._id}`,
          payload
        );
        showToast("Address updated successfully", "success");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/address/create-address`, payload);
        showToast("Address created successfully", "success");
      }
      setIsEditingAddress(false);
      onRefresh();
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
      const userId = merchant.user_id?._id || merchant.user_id;
      const addressId = merchant.company_address._id;
      await axios.delete(`${import.meta.env.VITE_API_URL}/address/delete-address-addressId-userId/${userId}/${addressId}`);
      showToast("Address deleted successfully", "success");
      setIsDeleteModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error deleting address:", error);
      showToast("Failed to delete address", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full bg-white rounded-lg shadow-md border border-gray-200">
      <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
        <h3 className="text-base sm:text-xl font-semibold text-gray-900">
          Company Details
        </h3>
        {!showProducts && !isEditingAddress && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            className="flex items-center gap-1 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            {merchant.company_address ? <Edit2 size={14} /> : <PlusCircle size={14} />}
            {merchant.company_address ? "Edit Address" : "Add Address"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {showProducts ? (
          <ViewProducts
            merchant={merchant}
            onBack={() => setShowProducts(false)}
          />
        ) : isEditingAddress ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="address_line_1">Address Line 1</Label>
                <Input
                  id="address_line_1"
                  value={addressForm.address_line_1}
                  onChange={(e) => setAddressForm({ ...addressForm, address_line_1: e.target.value })}
                  placeholder="e.g. 123 Main St"
                  className="border-2 border-slate-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address_line_2">Address Line 2</Label>
                <Input
                  id="address_line_2"
                  value={addressForm.address_line_2}
                  onChange={(e) => setAddressForm({ ...addressForm, address_line_2: e.target.value })}
                  placeholder="e.g. Suite 100"
                  className="border-2 border-slate-300"
                />
              </div>
              <div className="space-y-1.5 font-sans">
                <Label htmlFor="city">City</Label>
                <Select
                  value={addressForm.city}
                  onValueChange={(value) => setAddressForm({ ...addressForm, city: value })}
                  disabled={!cities.length}
                >
                  <SelectTrigger className="w-full bg-white border-2 border-slate-300">
                    <SelectValue placeholder="e.g. Mumbai" />
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
              <div className="space-y-1.5 font-sans">
                <Label htmlFor="state">State</Label>
                <Select
                  value={addressForm.state}
                  onValueChange={(value) => setAddressForm({ ...addressForm, state: value, city: "" })}
                  disabled={!states.length}
                >
                  <SelectTrigger className="w-full bg-white border-2 border-slate-300">
                    <SelectValue placeholder="e.g. Maharashtra" />
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
              <div className="space-y-1.5 font-sans">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  maxLength={6}
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  placeholder="e.g. 400001"
                  className="border-2 border-slate-300"
                />
              </div>
              <div className="space-y-1.5 font-sans">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={addressForm.country}
                  onValueChange={(value) => setAddressForm({ ...addressForm, country: value, state: "", city: "" })}
                >
                  <SelectTrigger className="w-full bg-white border-2 border-slate-300">
                    <SelectValue placeholder="e.g. India" />
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
              <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddressSave} className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white gap-1">
                <Save size={14} /> Save Address
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {merchant.gst_number && (
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <FileText className="w-4 h-4 text-[#0c1f4d]" />
                <strong>GST:</strong> {merchant.gst_number}
                {merchant.modifiedFields?.includes('gst_number') && <ModifiedBadge />}
              </p>
            )}
            {merchant.msme_certificate_number && (
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <File className="w-4 h-4" />
                <strong>MSME Certificate:</strong> {merchant.msme_certificate_number}
                {merchant.modifiedFields?.includes('msme_certificate_number') && <ModifiedBadge />}
              </p>
            )}
            {merchant.pan && (
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <File className="w-4 h-4 text-[#0c1f4d]" />
                <strong>PAN:</strong> {merchant.pan}
                {merchant.modifiedFields?.includes('pan') && <ModifiedBadge />}
              </p>
            )}
            {merchant.aadhar && (
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <File className="w-4 h-4 text-[#0c1f4d]" />
                <strong>Aadhar:</strong> {merchant.aadhar}
                {merchant.modifiedFields?.includes('aadhar') && <ModifiedBadge />}
              </p>
            )}
            {merchant.verified_status !== undefined && (
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <Shield className="w-4 h-4 text-[#0c1f4d]" />
                <strong>Verified:</strong> {merchant.verified_status ? "Yes" : "No"}
              </p>
            )}
            {merchant.trust_seal ? (
              <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 col-span-1 sm:col-span-2">
                <Shield className="w-4 h-4 text-[#0c1f4d]" />
                <strong>Trust Seal:</strong> Yes
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 px-2 text-xs ml-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  onClick={() => setShowTrustSeal(true)}
                >
                  View Trust Seal
                </Button>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 col-span-1 sm:col-span-2">
                <Shield className="w-4 h-4 text-[#0c1f4d]" />
                <strong>Trust Seal:</strong> No
              </p>
            )}
            {merchant.company_video && (
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 col-span-1 sm:col-span-2">
                <Video className="w-4 h-4 text-[#0c1f4d]" />
                <strong>Company Video:</strong>{" "}
                <a href={merchant.company_video} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  {merchant.company_video}
                </a>
                {merchant.modifiedFields?.includes('company_video') && <ModifiedBadge />}
              </p>
            )}
            {merchant.description && (
              <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 col-span-1 sm:col-span-2 flex items-start gap-1">
                <div className="flex-1">
                  <strong>Description:</strong> {merchant.description}
                  {merchant.modifiedFields?.includes('description') && <ModifiedBadge />}
                </div>
              </p>
            )}
            <div className="text-xs sm:text-sm text-gray-600 mt-1 col-span-1 sm:col-span-2 flex items-start justify-between group bg-slate-50 p-3 rounded-md border border-dashed border-slate-200">
              <div className="flex items-start gap-2">
                <Building className="w-4 h-4 text-[#0c1f4d] mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <strong>Company Address:</strong>
                    {merchant.modifiedFields?.includes('address') && <ModifiedBadge />}
                  </div>
                  <p className="mt-0.5 text-slate-600 uppercase">
                    {merchant.company_address 
                      ? `${merchant.company_address.address_line_1}, ${merchant.company_address.address_line_2 ? merchant.company_address.address_line_2 + ', ' : ''}${merchant.company_address.city}, ${merchant.company_address.state}, ${merchant.company_address.country} - ${merchant.company_address.pincode}`
                      : merchant.address_id 
                        ? `${merchant.address_id.address_line_1}, ${merchant.address_id.city}, ${merchant.address_id.state}, ${merchant.address_id.country} - ${merchant.address_id.pincode}`
                        : "No address added yet"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleEditClick}
                  className="p-1.5 hover:bg-white rounded-full text-blue-600 hover:shadow-sm"
                  title="Edit Address"
                >
                  <Edit2 size={14} />
                </button>
                {merchant.company_address && (
                  <button
                    onClick={handleAddressDeleteClick}
                    disabled={isDeleting}
                    className="p-1.5 hover:bg-white rounded-full text-red-500 hover:shadow-sm disabled:opacity-50"
                    title="Delete Address"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-xl border shadow-lg overflow-hidden">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="text-red-600 w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 font-sans">Delete Address?</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-sans">
                Are you sure you want to permanently delete this company address? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 w-full pt-2">
              <Button
                variant="outline"
                className="flex-1 font-sans font-semibold border-slate-200 text-slate-600 hover:bg-slate-50 h-11"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 font-sans font-semibold bg-red-600 hover:bg-red-700 text-white h-11 shadow-md shadow-red-200"
                onClick={confirmDeleteAddress}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showTrustSeal} onOpenChange={setShowTrustSeal}>
        <DialogContent 
          className="max-h-[90vh] overflow-auto bg-white p-0 rounded-xl border shadow-lg [&>button]:hidden"
          style={{ width: "900px", maxWidth: "95vw" }}
        >
          <div className="w-full flex justify-center">
            <TrustSealCertificate
              companyName={merchant.company_name}
              address={merchant.company_address ? `${merchant.company_address.address_line_1}, ${merchant.company_address.city}, ${merchant.company_address.state}, ${merchant.company_address.country} - ${merchant.company_address.pincode}` : "Address not provided"}
              director={merchant.user_id?.name || "Not Specified"}
              gstin={merchant.gst_number || "N/A"}
              mobile={merchant.company_phone_number || "N/A"}
              email={merchant.company_email || "N/A"}
              issueDate={merchant.trust_seal?.issueDate}
              expiryDate={merchant.trust_seal?.expiryDate}
              onClose={() => setShowTrustSeal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// ──────────────────────────────────────────────
// Main MerchantDetails Modal
// ──────────────────────────────────────────────
const MerchantDetails = ({ merchant, open, onClose, onRefresh }) => {
  const [showProducts, setShowProducts] = useState(false);

  if (!open || !merchant) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="p-0 flex flex-col bg-gray-50 overflow-hidden sm:rounded-xl border-none shadow-2xl [&>button]:hidden"
        style={{ width: '96vw', maxWidth: '1300px', height: '92vh', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="bg-[#0c1f4d] p-4 sm:p-6 flex flex-row items-center justify-between sticky top-0 z-10 shadow-lg shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
            <div className="bg-white/10 p-2 sm:p-2.5 rounded-lg backdrop-blur-sm border border-white/20 shrink-0">
              <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-tight truncate">
                {merchant.company_name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 sm:mt-1">
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 font-medium whitespace-nowrap">
                  {merchant.verified_status ? "Verified Merchant" : "Verification Pending"}
                </Badge>
                {merchant.mark_as_read !== true && (
                  <Badge className="bg-rose-500 text-white border-none text-[10px] h-4 px-1 whitespace-nowrap">
                    New
                  </Badge>
                )}
                {merchant.modifiedFields?.length > 0 && (
                  <Badge className="bg-amber-500 text-white border-none text-[10px] h-4 px-1 whitespace-nowrap">
                    Modified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 sm:h-10 sm:w-10 transition-all cursor-pointer shrink-0"
          >
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar pb-12">
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
            {/* Top Cards Row */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
              <div className="w-full lg:w-[350px] shrink-0">
                <SmallCard merchant={merchant} onViewProducts={() => setShowProducts(true)} />
              </div>
              <div className="flex-1 min-w-0">
                <UserDetailsCard user={merchant.user_id} />
              </div>
            </div>

            {/* Bottom Card Row */}
            <div className="w-full">
              <LargeCard 
                merchant={merchant} 
                showProducts={showProducts} 
                setShowProducts={setShowProducts} 
                onRefresh={onRefresh} 
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MerchantDetails;
