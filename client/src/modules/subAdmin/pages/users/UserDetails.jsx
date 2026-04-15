import { useState } from "react";
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

const InfoRow = ({ icon: Icon, label, value, badge, badgeClass }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="p-1.5 rounded-lg bg-[#0c1f4d]/8 shrink-0">
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
  const [addressForm, setAddressForm] = useState(user.address || {});
  const [selectedUser, setSelectedUser] = useState({});
  const [deletePopup, setDeletePopup] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  // country-state-city state
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");

  const [updateUserAddress, { isLoading: isUpdating }] = useUpdateUserAddressMutation();
  const [DeleteUserAddress] = useDeleteUserAddressMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "pincode") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setPincodeError(digits.length > 0 && digits.length < 6 ? "Pincode must be 6 digits" : "");
      setAddressForm((prev) => ({ ...prev, pincode: digits }));
    } else {
      setAddressForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCountryChange = (value) => {
    const country = Country.getCountryByCode(value);
    setSelectedCountryCode(value);
    setSelectedStateCode("");
    setAddressForm((prev) => ({ ...prev, country: country?.name || "", state: "", city: "" }));
  };

  const handleStateChange = (value) => {
    const state = State.getStateByCodeAndCountry(value, selectedCountryCode);
    setSelectedStateCode(value);
    setAddressForm((prev) => ({ ...prev, state: state?.name || "", city: "" }));
  };

  const handleCityChange = (value) => {
    setAddressForm((prev) => ({ ...prev, city: value }));
  };

  const handleUpdate = async () => {
    if (pincodeError || (addressForm.pincode && addressForm.pincode.length !== 6)) {
      setPincodeError("Pincode must be 6 digits");
      return;
    }
    try {
      const response = await updateUserAddress({
        user_id: user._id,
        selectedAddressId: user.address._id,
        updatedAddress: addressForm,
      }).unwrap();
      if (response.success) {
        showToast(response.message || "Address updated successfully!", "success");
        closeModal();
      }
    } catch (error) {
      showToast(error?.data?.message || "Failed to update address", "error");
    }
  };

  const handleDeletePopup = (user) => {
    setSelectedUser(user);
    setDeletePopup(true);
  };

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
          title={`Are you sure you want to delete address of ${selectedUser?.name}?`}
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs cursor-pointer"
                    onClick={() => { console.log("Edit clicked - user:", user); setSelectedUser(user); setIsEdit(true); }}
                  >
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 text-xs cursor-pointer"
                    onClick={() => handleDeletePopup(user)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </div>

            {hasAddress ? (
              isEdit ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Address Line 1 */}
                    <div className="md:col-span-2 flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Address Line 1</Label>
                      <Input name="address_line_1" placeholder="Address Line 1" value={addressForm.address_line_1 || ""} onChange={handleChange} className="h-9 text-sm" />
                    </div>
                    {/* Address Line 2 */}
                    <div className="md:col-span-2 flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span></Label>
                      <Input name="address_line_2" placeholder="Address Line 2" value={addressForm.address_line_2 || ""} onChange={handleChange} className="h-9 text-sm" />
                    </div>

                    {/* Country */}
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Country</Label>
                      <Select onValueChange={handleCountryChange} value={selectedCountryCode}>
                        <SelectTrigger className="h-9 text-sm w-full">
                          <SelectValue placeholder={addressForm.country || "Select Country"} />
                        </SelectTrigger>
                        <SelectContent>
                          {Country.getAllCountries().map((c) => (
                            <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* State */}
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">State</Label>
                      <Select onValueChange={handleStateChange} value={selectedStateCode} disabled={!selectedCountryCode}>
                        <SelectTrigger className="h-9 text-sm w-full">
                          <SelectValue placeholder={addressForm.state || "Select State"} />
                        </SelectTrigger>
                        <SelectContent>
                          {State.getStatesOfCountry(selectedCountryCode).map((s) => (
                            <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* City */}
                    <div className="flex flex-col space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">City</Label>
                      <Select onValueChange={handleCityChange} value={addressForm.city || ""} disabled={!selectedStateCode}>
                        <SelectTrigger className="h-9 text-sm w-full">
                          <SelectValue placeholder={addressForm.city || "Select City"} />
                        </SelectTrigger>
                        <SelectContent>
                          {City.getCitiesOfState(selectedCountryCode, selectedStateCode).map((city, i) => (
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
                        placeholder="6-digit Pincode"
                        maxLength={6}
                        value={addressForm.pincode || ""}
                        onChange={handleChange}
                        className={`h-9 text-sm ${pincodeError ? "border-red-500" : ""}`}
                      />
                      {pincodeError && <p className="text-red-500 text-xs">{pincodeError}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setIsEdit(false)}>
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
                  <AddressField label="City" value={user.address.city} />
                  <AddressField label="State" value={user.address.state} />
                  <AddressField label="Country" value={user.address.country} />
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
