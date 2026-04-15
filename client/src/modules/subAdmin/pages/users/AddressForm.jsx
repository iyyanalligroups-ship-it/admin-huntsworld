import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import showToast from "@/toast/showToast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddUserAddressMutation } from "@/redux/api/Authapi";
import { Country, State, City } from "country-state-city";

const AddressForm = ({ user, closeModal, refetch }) => {
  const [addressFormData, setAddressFormData] = useState({
    user_id: user?._id,
    address_line_1: "",
    address_line_2: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    entity_type: "",
    address_type: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [addUserAddress, { isLoading }] = useAddUserAddressMutation();

  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");

  const handleCountryChange = (value) => {
    const country = Country.getCountryByCode(value);
    setSelectedCountryCode(value);
    setSelectedStateCode("");
    setAddressFormData((prev) => ({ ...prev, country: country?.name || "", state: "", city: "" }));
    setTouched((prev) => ({ ...prev, country: true, state: false, city: false }));
  };

  const handleStateChange = (value) => {
    const state = State.getStateByCodeAndCountry(value, selectedCountryCode);
    setSelectedStateCode(value);
    setAddressFormData((prev) => ({ ...prev, state: state?.name || "", city: "" }));
    setTouched((prev) => ({ ...prev, state: true, city: false }));
  };

  const handleCityChange = (value) => {
    setAddressFormData((prev) => ({ ...prev, city: value }));
    setTouched((prev) => ({ ...prev, city: true }));
  };

  const validateForm = () => {
    let newErrors = {};

    if (!addressFormData.address_line_1.trim()) newErrors.address_line_1 = "Address Line 1 is required";
    if (!addressFormData.country.trim()) newErrors.country = "Country is required";
    if (!addressFormData.state.trim()) newErrors.state = "State is required";
    if (!addressFormData.city.trim()) newErrors.city = "City is required";
    if (!addressFormData.pincode.trim()) newErrors.pincode = "Pincode is required";
    if (!addressFormData.entity_type) newErrors.entity_type = "Entity Type is required";
    if (!addressFormData.address_type) newErrors.address_type = "Address Type is required";

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    validateForm();
  }, [addressFormData]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Handle dropdown changes
  const handleSelectChange = (field, value) => {
    setAddressFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      address_line_1: true,
      country: true,
      state: true,
      city: true,
      pincode: true,
      entity_type: true,
      address_type: true,
    });
    
    if (!validateForm()) return; // Prevent submission if form is invalid

    try {
      const response = await addUserAddress(addressFormData).unwrap();
      showToast(response.message || "Address added successfully", "success");
      if (refetch) refetch();
      closeModal();
    } catch (error) {
      console.error("Failed to add address:", error);
      showToast(error?.data?.message || "Failed to add address", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <Label htmlFor="address_line_1" className="text-sm font-semibold text-gray-700">Address Line 1 <span className="text-red-500">*</span></Label>
          <Input
            id="address_line_1"
            name="address_line_1"
            placeholder="e.g. 123 Main Street"
            value={addressFormData.address_line_1}
            onChange={handleInputChange}
            className={`h-11 ${touched.address_line_1 && errors.address_line_1 ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
          {touched.address_line_1 && errors.address_line_1 && (
            <p className="text-red-500 text-xs mt-1">{errors.address_line_1}</p>
          )}
        </div>

        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <Label htmlFor="address_line_2" className="text-sm font-semibold text-gray-700">Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span></Label>
          <Input
            id="address_line_2"
            name="address_line_2"
            placeholder="Apt, Suite, Building, etc."
            value={addressFormData.address_line_2}
            onChange={handleInputChange}
            className="h-11"
          />
        </div>

        <div className="flex flex-col space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Country <span className="text-red-500">*</span></Label>
          <Select
            onValueChange={handleCountryChange}
            value={selectedCountryCode}
          >
            <SelectTrigger className={`w-full h-11 ${touched.country && errors.country ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              {Country.getAllCountries().map((country) => (
                <SelectItem key={country.isoCode} value={country.isoCode}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched.country && errors.country && (
            <p className="text-red-500 text-xs mt-1">{errors.country}</p>
          )}
        </div>

        <div className="flex flex-col space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">State <span className="text-red-500">*</span></Label>
          <Select
            onValueChange={handleStateChange}
            value={selectedStateCode}
            disabled={!selectedCountryCode}
          >
            <SelectTrigger className={`w-full h-11 ${touched.state && errors.state ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {State.getStatesOfCountry(selectedCountryCode).map((state) => (
                <SelectItem key={state.isoCode} value={state.isoCode}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched.state && errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
        </div>

        <div className="flex flex-col space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">City <span className="text-red-500">*</span></Label>
          <Select
            onValueChange={handleCityChange}
            value={addressFormData.city}
            disabled={!selectedStateCode}
          >
            <SelectTrigger className={`w-full h-11 ${touched.city && errors.city ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              {City.getCitiesOfState(selectedCountryCode, selectedStateCode).map((city, index) => (
                <SelectItem key={`${city.name}-${index}`} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched.city && errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
        </div>

        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="pincode" className="text-sm font-semibold text-gray-700">Pincode / Zipcode <span className="text-red-500">*</span></Label>
          <Input
            id="pincode"
            name="pincode"
            placeholder="e.g. 600001"
            maxLength={6}
            value={addressFormData.pincode}
            onChange={handleInputChange}
            className={`h-11 ${touched.pincode && errors.pincode ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
          {touched.pincode && errors.pincode && (
            <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
          )}
        </div>

        <div className="flex flex-col space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Entity Type <span className="text-red-500">*</span></Label>
          <Select
            onValueChange={(value) => handleSelectChange("entity_type", value)}
            value={addressFormData.entity_type}
          >
            <SelectTrigger className={`w-full h-11 ${touched.entity_type && errors.entity_type ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
              <SelectValue placeholder="Select Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="merchant">Merchant</SelectItem>
              <SelectItem value="grocery_seller">Base Member</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="sub_admin">Sub Admin</SelectItem>
            </SelectContent>
          </Select>
          {touched.entity_type && errors.entity_type && (
            <p className="text-red-500 text-xs mt-1">{errors.entity_type}</p>
          )}
        </div>

        <div className="flex flex-col space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Address Type <span className="text-red-500">*</span></Label>
          <Select
            onValueChange={(value) => handleSelectChange("address_type", value)}
            value={addressFormData.address_type}
          >
            <SelectTrigger className={`w-full h-11 ${touched.address_type && errors.address_type ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
              <SelectValue placeholder="Select Address Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
          {touched.address_type && errors.address_type && (
            <p className="text-red-500 text-xs mt-1">{errors.address_type}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 mt-4">
        <Button variant="ghost" type="button" onClick={closeModal} className="font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer">
          Cancel
        </Button>
        <Button
          type="submit"
          className={
            isLoading || !isFormValid
              ? "opacity-60 cursor-not-allowed bg-[#0c1f4d] text-white px-8"
              : "bg-[#0c1f4d] hover:bg-[#153171] text-white font-semibold shadow-md px-8 cursor-pointer transition-all"
          }
          disabled={isLoading || !isFormValid}
        >
          {isLoading ? "Adding..." : "+ Add Address"}
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
