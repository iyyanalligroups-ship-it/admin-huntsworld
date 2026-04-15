import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  Shield,
  Hash,
  Truck,
  MapPin,
  PlusCircle,
  Trash2,
  Save,
  Edit2,
  X,
  Image as ImageIcon,
  FileText as DescriptionIcon,
} from "lucide-react";
import { useGetServiceProviderByIdQuery, useUpdateServiceProviderMutation } from "@/redux/api/ServiceProviderApi";
import { Badge } from "@/components/ui/badge";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import VehicleView from "./VehicleView";
import showToast from "@/toast/showToast";
import { Button } from "@/components/ui/button";
import { useSelectedUser } from "../../context/SelectedUserContext";
import { useNavigate } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ServiceProviderDetails = ({ providerId, onClose, onRefresh }) => {
  const [showVehicles, setShowVehicles] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [zoomMessage, setZoomMessage] = useState("");
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();
  const { data: providerData, isLoading, error } = useGetServiceProviderByIdQuery(providerId, {
    skip: !providerId,
  });
  const [updateServiceProvider] = useUpdateServiceProviderMutation();

  const provider = providerData?.data || providerData;

  // Address Management State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);
  const [isDeleteAddressModalOpen, setIsDeleteAddressModalOpen] = useState(false);
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

  const toTitleCase = (str = "") =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));

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
    if (provider?.address_id) {
      const addr = provider.address_id;
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
        address_line_1: addr.address_line_1 || addr.address_line1 || "",
        address_line_2: addr.address_line_2 || addr.address_line2 || "",
        city: canonicalCity,
        state: stateObj?.isoCode || "",
        country: countryIsoCode,
        pincode: addr.pincode || addr.postal_code || "",
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

  const isAddressFormValid = () => {
    return (
      addressForm.address_line_1.trim() !== "" &&
      addressForm.city.trim() !== "" &&
      addressForm.state.trim() !== "" &&
      addressForm.country.trim() !== "" &&
      addressForm.pincode.trim() !== ""
    );
  };

  const handleAddressSave = async () => {
    if (!isAddressFormValid()) {
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
        user_id: provider.user_id?._id || provider.user_id,
        entity_type: "service_provider",
        address_type: "company",
      };

      const token = sessionStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (provider.address_id?._id) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/address/update-address/${payload.user_id}/${provider.address_id._id}`,
          payload,
          config
        );
        showToast("Address updated successfully", "success");
      } else {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/address/create-address`, payload, config);
        const newAddressId = response.data.address?._id || response.data.data?._id;
        
        if (newAddressId) {
          await updateServiceProvider({
            userId: provider._id,
            updatedProvider: { address_id: newAddressId }
          }).unwrap();
        }
        showToast("Address created successfully", "success");
      }
      setIsEditingAddress(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error saving address:", err);
      showToast("Failed to save address", "error");
    }
  };

  const handleAddressDeleteClick = () => {
    setIsDeleteAddressModalOpen(true);
  };

  const confirmDeleteAddress = async () => {
    try {
      setIsDeletingAddress(true);
      const userId = provider.user_id?._id || provider.user_id;
      const addressId = provider.address_id._id;
      const token = sessionStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/address/delete-address-addressId-userId/${userId}/${addressId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Address deleted successfully", "success");
      setIsDeleteAddressModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error deleting address:", err);
      showToast("Failed to delete address", "error");
    } finally {
      setIsDeletingAddress(false);
    }
  };

  const handleViewVehicles = () => {
    setShowVehicles(true);
    showToast("Viewing vehicles",'info');
  };

  const handleBack = () => {
    setShowVehicles(false);
    showToast("Returning to company details",'info');
  };

  const handleTogglePhone = () => {
    setShowPhone(!showPhone);
    showToast(showPhone ? "Phone number hidden" : "Phone number revealed",'info');
  };

  const handleZoom = () => {
    setZoomMessage("Image zoomed in!");
    setTimeout(() => setZoomMessage(""), 2000);
  };

  const handleUnzoom = () => {
    setZoomMessage("Image zoomed out!");
    setTimeout(() => setZoomMessage(""), 2000);
  };

    const handleCardClick = (seller) => {
    console.log(seller,'seller chat info');

    setSelectedUser(seller);
    navigate('/admin-dashboard/chat');
  };


  return (
    <div className="bg-white lg:p-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-6">
        {/* Left Section (Company Info and Images) */}
        <div className="w-full sm:w-1/3 sm:sticky sm:top-6">
          <div className="bg-white lg:p-4 rounded-lg shadow-lg">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-sm"
            >
              ✕
            </button>
            {zoomMessage && (
              <div className="mb-4 p-2 bg-gray-100 text-black rounded-md text-sm">
                {zoomMessage}
              </div>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-[#0c1f4d]" />
                <span className="ml-2 text-black text-sm">Loading...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-10 text-red-500">
                <AlertCircle className="w-6 h-6 mr-2 text-[#0c1f4d]" />
                <span className="text-black text-sm">
                  {error.status === 404
                    ? "Service Provider not found"
                    : `Error: ${error.data?.message || error.message}`}
                </span>
              </div>
            ) : provider ? (
              <>
                {/* Company Logo, Name, and Email */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 gap-3 sm:gap-4">
                  {provider.company_logo && (
                    <Zoom onZoom={handleZoom} onUnzoom={handleUnzoom}>
                      <img
                        src={provider.company_logo}
                        alt="Company Logo"
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full cursor-pointer"
                      />
                    </Zoom>
                  )}
                  <div className="flex flex-col">
                    <h3 className="text-base sm:text-lg font-bold text-black">
                      {provider.travels_name || "N/A"}
                    </h3>
                    <p className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2 text-[#0c1f4d]" />
                      {provider.company_email || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Phone Number */}
                <p
                  onClick={handleTogglePhone}
                  className="flex items-center text-sm text-[#0c1f4d] cursor-pointer mb-4 hover:text-gray-900"
                >
                  <Phone className="w-4 h-4 mr-2 text-[#0c1f4d]" />
                  {showPhone ? provider.company_phone_number || "N/A" : "View Number"}
                </p>

                {/* Company Address Section */}
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-6">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b flex justify-between items-center">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0c1f4d]" />
                      Company Address
                    </h3>
                    {!isEditingAddress && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditAddressClick}
                        className="h-7 text-indigo-600 hover:bg-indigo-50 px-2 text-xs"
                      >
                        {provider.address_id ? <Edit2 size={12} className="mr-1" /> : <PlusCircle size={12} className="mr-1" />}
                        {provider.address_id ? "Edit" : "Add"}
                      </Button>
                    )}
                  </div>
                  <div className="p-4">
                    {isEditingAddress ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="address_line_1" className="text-xs">Address Line 1</Label>
                            <Input
                              id="address_line_1"
                              value={addressForm.address_line_1}
                              onChange={(e) => setAddressForm({ ...addressForm, address_line_1: e.target.value })}
                              placeholder="Street address"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="address_line_2" className="text-xs">Address Line 2</Label>
                            <Input
                              id="address_line_2"
                              value={addressForm.address_line_2}
                              onChange={(e) => setAddressForm({ ...addressForm, address_line_2: e.target.value })}
                              placeholder="Suite, unit, etc."
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Country</Label>
                              <Select
                                value={addressForm.country}
                                onValueChange={(value) => setAddressForm({ ...addressForm, country: value, state: "", city: "" })}
                              >
                                <SelectTrigger className="h-8 text-xs bg-white border-gray-200">
                                  <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent className="bg-white z-[100]">
                                  {countries.map((c) => (
                                    <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">State</Label>
                              <Select
                                value={addressForm.state}
                                onValueChange={(value) => setAddressForm({ ...addressForm, state: value, city: "" })}
                                disabled={!states.length}
                              >
                                <SelectTrigger className="h-8 text-xs bg-white border-gray-200">
                                  <SelectValue placeholder="State" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 bg-white z-[100]">
                                  {states.map((s) => (
                                    <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">City</Label>
                              <Select
                                value={addressForm.city}
                                onValueChange={(value) => setAddressForm({ ...addressForm, city: value })}
                                disabled={!cities.length}
                              >
                                <SelectTrigger className="h-8 text-xs bg-white border-gray-200">
                                  <SelectValue placeholder="City" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 bg-white z-[100]">
                                  {cities.map((ci) => (
                                    <SelectItem key={ci.name} value={ci.name}>{ci.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="pincode" className="text-xs">Pincode</Label>
                              <Input
                                id="pincode"
                                maxLength={6}
                                value={addressForm.pincode}
                                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(false)} className="h-8 text-xs">
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleAddressSave} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1">
                            <Save size={12} /> Save
                          </Button>
                        </div>
                      </div>
                    ) : provider.address_id ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">
                          {provider.address_id.address_line_1 || provider.address_id.address_line1}
                          {(provider.address_id.address_line_2 || provider.address_id.address_line2) && `, ${provider.address_id.address_line_2 || provider.address_id.address_line2}`}
                        </p>
                        <p className="text-xs text-gray-600">
                          {provider.address_id.city}, {provider.address_id.state}
                        </p>
                        <p className="text-xs text-gray-600">
                          {provider.address_id.country} - {provider.address_id.pincode || provider.address_id.postal_code}
                        </p>
                        <div className="pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddressDeleteClick}
                            className="h-7 p-0 text-red-500 hover:text-red-700 hover:bg-transparent text-xs"
                          >
                            <Trash2 size={12} className="mr-1" /> Remove Address
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded border-2 border-dashed border-gray-200">
                        <p className="text-xs text-gray-500 italic mb-2">No address linked.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditAddressClick}
                          className="h-7 text-xs border-indigo-200 text-indigo-700"
                        >
                          <PlusCircle size={12} className="mr-1" /> Add Address
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete Address Modal */}
                <Dialog open={isDeleteAddressModalOpen} onOpenChange={setIsDeleteAddressModalOpen}>
                  <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600 text-lg">
                        <Trash2 className="h-5 w-5" /> Delete Address
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the business address for{" "}
                        <span className="font-bold text-gray-900">{provider.travels_name}</span>?
                      </p>
                    </div>
                    <DialogFooter className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsDeleteAddressModalOpen(false)} disabled={isDeletingAddress}>Cancel</Button>
                      <Button variant="destructive" onClick={confirmDeleteAddress} disabled={isDeletingAddress} className="bg-red-600 hover:bg-red-700">
                        {isDeletingAddress ? "Deleting..." : "Delete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Company Images */}
                {provider.company_images && provider.company_images.length > 0 && (
                  <div className="mb-4">
                    <h3 className="flex items-center text-base sm:text-lg font-semibold text-black mb-2">
                      <ImageIcon className="w-5 h-5 mr-2 text-[#0c1f4d]" />
                      Company Images
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {provider.company_images.map((image, index) => (
                        <Zoom key={index} onZoom={handleZoom} onUnzoom={handleUnzoom}>
                          <img
                            src={image}
                            alt={`Company Image ${index + 1}`}
                            className="w-full h-16 sm:h-20 object-cover rounded-md shadow-sm cursor-pointer"
                          />
                        </Zoom>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button onClick={()=>handleCardClick(provider)} className=" px-4 cursor-pointer py-2 rounded-md bg-[#0c1f4d] hover:bg-[#153171] text-white text-sm">


                    Contact Traveller
                  </Button>
                  {/* <button
                    onClick={handleViewVehicles}
                    className="bg-[#0c1f4d] text-white px-4 py-2 rounded-md hover:bg-[#e03733] text-sm"
                  >
                    View Vehicles
                  </button> */}
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-gray-600 text-sm">
                No provider data available
              </div>
            )}
          </div>
        </div>

        {/* Right Section (Company Details or Vehicles) */}
        <div className="w-full sm:w-2/3">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
            {showVehicles ? (
              <VehicleView provider={provider} handleBack={handleBack} />
            ) : (
              <>
                <h2 className="text-lg sm:text-xl font-bold text-black mb-4">
                  Company Details
                </h2>
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0c1f4d]" />
                    <span className="ml-2 text-gray-600 text-sm">Loading...</span>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-10 text-red-500">
                    <AlertCircle className="w-6 h-6 mr-2 text-[#0c1f4d]" />
                    <span className="text-gray-600 text-sm">
                      {error.status === 404
                        ? "Service Provider not found"
                        : `Error: ${error.data?.message || error.message}`}
                    </span>
                  </div>
                ) : provider ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-[#0c1f4d]" />
                      <span className="font-semibold text-black mr-2 text-sm sm:text-base">
                        License Number:
                      </span>
                      <span className="text-gray-600 text-sm">
                        {provider.license_number || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-[#0c1f4d]" />
                      <span className="font-semibold text-black mr-2 text-sm sm:text-base">
                        Verified Status:
                      </span>
                      <Badge
                        variant={provider.verified_status ? "default" : "destructive"}
                        className={
                          provider.verified_status
                            ? "bg-green-100 text-green-800 text-sm"
                            : "bg-red-100 text-red-800 text-sm"
                        }
                      >
                        {provider.verified_status ? "Verified" : "Not Verified"}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-[#0c1f4d]" />
                      <span className="font-semibold text-black mr-2 text-sm sm:text-base">
                        Trust Shield:
                      </span>
                      <span className="text-gray-600 text-sm">
                        {provider.trust_shield ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Hash className="w-5 h-5 mr-2 text-[#0c1f4d]" />
                      <span className="font-semibold text-black mr-2 text-sm sm:text-base">
                        Number of Vehicles:
                      </span>
                      <span className="text-gray-600 text-sm">
                        {provider.number_of_vehicles || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Truck className="w-5 h-5 mr-2 text-[#0c1f4d]" />
                      <span className="font-semibold text-black mr-2 text-sm sm:text-base">
                        Vehicle Type:
                      </span>
                      <span className="text-gray-600 text-sm capitalize">
                        {provider.vehicle_type || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <DescriptionIcon className="w-5 h-5 mr-2 text-[#0c1f4d] mt-1" />
                      <span className="font-semibold text-black mr-2 text-sm sm:text-base">
                        Description:
                      </span>
                      <span
                        className="text-gray-600 text-sm p-2 rounded"
                        style={{ minHeight: "1.5em" }}
                      >
                        {provider.description?.trim() || "N/A"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-600 text-sm">
                    No provider data available
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderDetails;
