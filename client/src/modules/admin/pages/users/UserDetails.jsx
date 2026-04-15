import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useUpdateUserAddressMutation,
  useDeleteUserAddressMutation,
} from "@/redux/api/Authapi";
import { Pencil, Trash2, User, Mail, Phone, ShieldCheck, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import showToast from "@/toast/showToast";
import DeleteDialog from "@/model/DeleteModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Country, State, City } from "country-state-city";

const toTitleCase = (str = "") =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));

const InfoRow = ({ icon: Icon, label, value, badge, badgeClass }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="p-1.5 rounded-lg shrink-0">
        <Icon size={15} className="text-[#0c1f4d]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        {badge ? (
          <Badge className={`${badgeClass} text-white text-xs px-2 py-0.5 rounded-full`}>{value}</Badge>
        ) : (
          <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
        )}
      </div>
    </div>
  );
};

const AddressField = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-800 capitalize">{value}</p>
    </div>
  );
};

const UserDetails = ({ user, closeModal }) => {
  const [isEdit, setIsEdit] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address_line_1: user.address?.address_line_1 || "",
    address_line_2: user.address?.address_line_2 || "",
    country: "",
    state: "",
    city: toTitleCase(user.address?.city) || "",
    pincode: user.address?.pincode || "",
    address_type: user.address?.address_type || "",
    entity_type: user.address?.entity_type || "",
  });
  const [deletePopup, setDeletePopup] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [updateUserAddress, { isLoading: isUpdating }] = useUpdateUserAddressMutation();
  const [DeleteUserAddress, { isLoading: isDeleting }] = useDeleteUserAddressMutation();

  // Initialize country isoCode from stored name
  useEffect(() => {
    const countriesList = Country.getAllCountries();
    setCountries(countriesList);
    if (user.address?.country) {
      const countryObj = countriesList.find(
        (c) => c.name.toLowerCase() === user.address.country.toLowerCase()
      );
      if (countryObj) {
        setAddressForm((prev) => ({ ...prev, country: countryObj.isoCode }));
      }
    }
  }, [user.address]);

  // Update states when country changes
  useEffect(() => {
    if (addressForm.country) {
      const sts = State.getStatesOfCountry(addressForm.country) || [];
      setStates(sts);
      setCities([]);
      setAddressForm((prev) => ({ ...prev, state: "", city: "" }));
      setTouched((prev) => ({ ...prev, state: false, city: false }));
    } else {
      setStates([]);
      setCities([]);
    }
  }, [addressForm.country]);

  // Update cities + pre-select state when states list is ready
  useEffect(() => {
    if (!addressForm.country || !addressForm.state) {
      setCities([]);
      if (user.address?.state && addressForm.country && states.length > 0) {
        const stateObj = states.find(
          (s) => s.name.toLowerCase() === user.address.state.toLowerCase()
        );
        if (stateObj) {
          setAddressForm((prev) => ({ ...prev, state: stateObj.isoCode }));
        }
      }
      return;
    }
    const base = City.getCitiesOfState(addressForm.country, addressForm.state) || [];
    setCities(base);
    if (user.address?.city && !addressForm.city) {
      const cityMatch = base.find(
        (ci) => ci.name.toLowerCase() === user.address.city.toLowerCase()
      );
      setAddressForm((prev) => ({
        ...prev,
        city: cityMatch ? cityMatch.name : toTitleCase(user.address.city),
      }));
    }
  }, [addressForm.country, addressForm.state, states, user.address]);

  // Validate form
  useEffect(() => {
    const newErrors = {};
    if (!addressForm.address_line_1) newErrors.address_line_1 = "Address Line 1 is required";
    if (!addressForm.country) newErrors.country = "Country is required";
    if (!addressForm.state) newErrors.state = "State is required";
    if (!addressForm.city) newErrors.city = "City is required";
    if (!addressForm.pincode) newErrors.pincode = "Pincode is required";
    if (!addressForm.entity_type) newErrors.entity_type = "Entity Type is required";
    if (!addressForm.address_type) newErrors.address_type = "Address Type is required";
    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  }, [addressForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "pincode") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setPincodeError(digits.length > 0 && digits.length < 6 ? "Pincode must be 6 digits" : "");
      setAddressForm((prev) => ({ ...prev, pincode: digits }));
    } else {
      setAddressForm((prev) => ({ ...prev, [name]: value }));
    }
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSelectChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleUpdate = async () => {
    if (pincodeError || (addressForm.pincode && addressForm.pincode.length !== 6)) {
      setPincodeError("Pincode must be 6 digits");
      return;
    }
    if (!isFormValid) {
      setTouched({ address_line_1: true, country: true, state: true, city: true, pincode: true, entity_type: true, address_type: true });
      showToast("Please fill in all required fields", "error");
      return;
    }
    try {
      const countryObj = countries.find((c) => c.isoCode === addressForm.country);
      const stateObj = states.find((s) => s.isoCode === addressForm.state);
      const submitData = {
        ...addressForm,
        country: countryObj ? countryObj.name : addressForm.country,
        state: stateObj ? stateObj.name : addressForm.state,
        city: addressForm.city || "",
      };
      const response = await updateUserAddress({
        user_id: user._id,
        selectedAddressId: user.address._id,
        updatedAddress: submitData,
      }).unwrap();
      if (response.success) {
        showToast(response.message || "Address updated successfully!", "success");
        setIsEdit(false);
        closeModal();
      }
    } catch (error) {
      showToast(error?.data?.message || "Failed to update address", "error");
    }
  };

  const handleDeletePopup = () => setDeletePopup(true);

  const handleDelete = async () => {
    try {
      const response = await DeleteUserAddress({
        user_id: user._id,
        addressId: user.address._id,
      }).unwrap();
      if (response.success) {
        showToast(response.message || "Address deleted successfully!", "success");
        closeModal();
      }
    } catch (error) {
      showToast(error?.data?.message || "Failed to delete address", "error");
    }
  };

  const hasAddress = user.address && Object.keys(user.address).length > 0;

  return (
    <Dialog open={true} onOpenChange={closeModal}>
      {deletePopup && (
        <DeleteDialog
          open={deletePopup}
          onClose={() => setDeletePopup(false)}
          onConfirm={handleDelete}
          title={`Are you sure you want to delete address of ${user?.name}?`}
        />
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#0c1f4d]">User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* User Info Card */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#0c1f4d] flex items-center justify-center">
                <User size={15} className="text-white" />
              </div>
              <h3 className="text-sm font-bold text-[#0c1f4d] uppercase tracking-wide">Account Info</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <InfoRow icon={User} label="Name" value={user?.name} />
              <InfoRow icon={Mail} label="Email" value={user?.email} />
              <InfoRow icon={Phone} label="Phone" value={user?.phone} />
              <InfoRow icon={ShieldCheck} label="Role" value={user?.role?.role} />
              <InfoRow
                icon={ShieldCheck}
                label="Account Status"
                value={user?.isActive ? "Active" : "Inactive"}
                badge
                badgeClass={user?.isActive ? "bg-emerald-500" : "bg-rose-500"}
              />
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0c1f4d] flex items-center justify-center">
                  <MapPin size={15} className="text-white" />
                </div>
                <h3 className="text-sm font-bold text-[#0c1f4d] uppercase tracking-wide">Address</h3>
              </div>
              {hasAddress && !isEdit && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs cursor-pointer" onClick={() => setIsEdit(true)}>
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" className="h-8 text-xs cursor-pointer" onClick={handleDeletePopup} disabled={isDeleting}>
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </div>

            {hasAddress ? (
              isEdit ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2 flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Address Line 1</Label>
                      <Input name="address_line_1" placeholder="e.g. House no., Street" value={addressForm.address_line_1} onChange={handleChange} className="h-9 text-sm border-2 border-slate-300" />
                    </div>
                    <div className="md:col-span-2 flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span></Label>
                      <Input name="address_line_2" placeholder="e.g. Area, Locality (optional)" value={addressForm.address_line_2} onChange={handleChange} className="h-9 text-sm border-2 border-slate-300" />
                    </div>

                    {/* Country */}
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Country</Label>
                      <Select onValueChange={(v) => handleSelectChange("country", v)} value={addressForm.country}>
                        <SelectTrigger className="h-9 text-sm w-full border-2 border-slate-300">
                          <SelectValue placeholder="e.g. Select Country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* State */}
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">State</Label>
                      <Select onValueChange={(v) => handleSelectChange("state", v)} value={addressForm.state} disabled={!states.length}>
                        <SelectTrigger className="h-9 text-sm w-full border-2 border-slate-300">
                          <SelectValue placeholder="e.g. Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((s) => (
                            <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* City */}
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">City</Label>
                      <Select onValueChange={(v) => handleSelectChange("city", v)} value={addressForm.city} disabled={!cities.length}>
                        <SelectTrigger className="h-9 text-sm w-full border-2 border-slate-300">
                          <SelectValue placeholder="e.g. Select City" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city, i) => (
                            <SelectItem key={`${city.name}-${i}`} value={city.name}>{city.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Pincode */}
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Pincode</Label>
                      <Input
                        name="pincode"
                        placeholder="e.g. 123456"
                        maxLength={6}
                        value={addressForm.pincode}
                        onChange={handleChange}
                        className={`h-9 text-sm border-2 border-slate-300 ${pincodeError ? "border-red-500" : ""}`}
                      />
                      {pincodeError && <p className="text-red-500 text-xs">{pincodeError}</p>}
                    </div>

                    {/* Entity Type */}
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Entity Type</Label>
                      <Select onValueChange={(v) => handleSelectChange("entity_type", v)} value={addressForm.entity_type}>
                        <SelectTrigger className="h-9 text-sm w-full border-2 border-slate-300">
                          <SelectValue placeholder="e.g. Select Entity Type" />
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
                    </div>

                    {/* Address Type */}
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Address Type</Label>
                      <Select onValueChange={(v) => handleSelectChange("address_type", v)} value={addressForm.address_type}>
                        <SelectTrigger className="h-9 text-sm w-full border-2 border-slate-300">
                          <SelectValue placeholder="e.g. Select Address Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 cursor-pointer"
                      onClick={() => { setIsEdit(false); setTouched({}); setErrors({}); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-[#0c1f4d] hover:bg-[#153171] text-white cursor-pointer"
                      onClick={handleUpdate}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                        </span>
                      ) : "Save Changes"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <AddressField label="Line 1" value={user.address.address_line_1} />
                  <AddressField label="Line 2" value={user.address.address_line_2} />
                  <AddressField label="City" value={toTitleCase(user.address.city)} />
                  <AddressField label="State" value={toTitleCase(user.address.state)} />
                  <AddressField label="Country" value={toTitleCase(user.address.country)} />
                  <AddressField label="Pincode" value={user.address.pincode} />
                  <AddressField label="Entity Type" value={user.address.entity_type?.replace(/_/g, " ")} />
                  <AddressField label="Address Type" value={user.address.address_type} />
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                <MapPin size={28} className="mb-2 opacity-40" />
                <p className="text-sm font-medium">No address on file</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <Button
            className="w-full bg-[#0c1f4d] hover:bg-[#153171] text-white cursor-pointer"
            onClick={closeModal}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetails;