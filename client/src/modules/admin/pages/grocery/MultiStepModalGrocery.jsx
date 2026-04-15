import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function MultiStepModalGrocery({ open, onOpenChange, onRefresh }) {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [shopDetails, setShopDetails] = useState({
    shop_name: '',
    shop_email: '',
    shop_phone_number: '',
    member_type: '',
  });
  const [memberTypes, setMemberTypes] = useState([]);
  const [errors, setErrors] = useState({
    shop_name: '',
    shop_email: '',
    shop_phone_number: '',
  });
  const [touched, setTouched] = useState({
    shop_name: false,
    shop_email: false,
    shop_phone_number: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Fetch member types
  useEffect(() => {
    const fetchMemberTypes = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/base-member-types/fetch-all-base-member-types`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setMemberTypes(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch member types", err);
      }
    };
    fetchMemberTypes();
  }, []);

  // Validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {
      shop_name: '',
      shop_email: '',
      shop_phone_number: '',
      member_type: '',
    };

    if (!shopDetails.shop_name.trim()) {
      newErrors.shop_name = 'Shop name is required';
    }

    if (shopDetails.shop_email && !emailRegex.test(shopDetails.shop_email)) {
      newErrors.shop_email = 'Please enter a valid email address';
    }

    if (!shopDetails.shop_phone_number) {
      newErrors.shop_phone_number = 'Phone number is required';
    } else if (!phoneRegex.test(shopDetails.shop_phone_number)) {
      newErrors.shop_phone_number = 'Phone number must be exactly 10 digits';
    }

    if (!shopDetails.member_type) {
      newErrors.member_type = 'Member type is required';
    }

    setErrors(newErrors);

    // Form is valid if there are no errors
    return Object.values(newErrors).every((error) => !error);
  };

  // Validate form whenever shopDetails changes
  useEffect(() => {
    if (step === 2) {
      setIsFormValid(validateForm());
    }
  }, [shopDetails, step]);

  // Handle search
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/search-user-for-service-provider`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { query: searchTerm },
        }
      );
      if (response.data.success) {
        setSearchResults(response.data.data);
        if (response.data.data.length === 0) {
          if (emailRegex.test(searchTerm)) {
            setError('User not found for the email');
          } else {
            setError('No users found matching the search criteria');
          }
        }
      } else {
        setError(response.data.message || 'Failed to search users');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        if (emailRegex.test(searchTerm)) {
          setError('User not found for the email');
        } else {
          setError('No users found matching the search criteria');
        }
      } else {
        setError(err.message || 'An error occurred while searching');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting a user
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setStep(2);
  };

  // Handle input changes for shop details
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Restrict phone number to digits only and max 10 characters
    if (name === 'shop_phone_number') {
      if (/^\d*$/.test(value) && value.length <= 10) {
        setShopDetails((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setShopDetails((prev) => ({ ...prev, [name]: value }));
    }

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Handle blur for touch-based validation
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setError('Please correct the errors in the form.');
      setLoading(false);
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/grocery-sellers/create-grocery-seller-with-role`,
        {
          user_id: selectedUser._id,
          shop_name: shopDetails.shop_name,
          shop_email: shopDetails.shop_email,
          shop_phone_number: shopDetails.shop_phone_number,
          member_type: shopDetails.member_type,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        onRefresh(); // Refresh the seller list
        onOpenChange(false); // Close the modal
        setStep(1);
        setSearchTerm('');
        setSearchResults([]);
        setSelectedUser(null);
        setShopDetails({ shop_name: '', shop_email: '', shop_phone_number: '', member_type: '' });
        setErrors({ shop_name: '', shop_email: '', shop_phone_number: '', member_type: '' });
        setTouched({ shop_name: false, shop_email: false, shop_phone_number: false, member_type: false });
      } else {
        setError(response.data.message || 'Failed to create grocery seller');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the grocery seller');
    } finally {
      setLoading(false);
    }
  };

  // Reset modal state when closing
  const handleClose = () => {
    setStep(1);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUser(null);
    setShopDetails({ shop_name: '', shop_email: '', shop_phone_number: '', member_type: '' });
    setErrors({ shop_name: '', shop_email: '', shop_phone_number: '', member_type: '' });
    setTouched({ shop_name: false, shop_email: false, shop_phone_number: false, member_type: false });
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{step === 1 ? 'Search User' : 'Add Grocery Seller'}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. User Name"
                className="w-full border-2 border-slate-300"
                disabled={loading}
              />
              <Button
                className="bg-[#0c1f4d] border-b hover:bg-[#153171] cursor-pointer flex items-center gap-2"
                onClick={handleSearch}
                disabled={loading || !searchTerm}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                {searchResults.map((user) => (
                  <div key={user._id} className="border p-4 rounded-md shadow-sm">
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {user.name || 'N/A'}</p>
                      <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                      <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                      <Button
                        onClick={() => handleSelectUser(user)}
                        className="bg-[#0c1f4d] border-b cursor-pointer hover:bg-[#153171]"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchResults.length === 0 && !loading && !error && (
              <p className="text-gray-600 text-sm">No users found.</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700">Shop Name</Label>
              <Input
                type="text"
                name="shop_name"
                value={shopDetails.shop_name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="e.g. My Grocery Shop"
                className="w-full border-2 border-slate-300"
                disabled={loading}
              />
              {touched.shop_name && errors.shop_name && (
                <p className="text-red-500 text-sm mt-1">{errors.shop_name}</p>
              )}
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700">Shop Email</Label>
              <Input
                type="email"
                name="shop_email"
                value={shopDetails.shop_email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="e.g. shop@example.com"
                className="w-full border-2 border-slate-300"
                disabled={loading}
              />
              {touched.shop_email && errors.shop_email && (
                <p className="text-red-500 text-sm mt-1">{errors.shop_email}</p>
              )}
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700">Shop Phone Number</Label>
              <Input
                type="tel"
                name="shop_phone_number"
                value={shopDetails.shop_phone_number}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="e.g. 9876543210"
                className="w-full border-2 border-slate-300"
                disabled={loading}
              />
              {touched.shop_phone_number && errors.shop_phone_number && (
                <p className="text-red-500 text-sm mt-1">{errors.shop_phone_number}</p>
              )}
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Member Type</Label>
              <Select
                name="member_type"
                value={shopDetails.member_type}
                onValueChange={(value) => {
                  setShopDetails((prev) => ({ ...prev, member_type: value }));
                  setTouched((prev) => ({ ...prev, member_type: true }));
                }}
                disabled={loading}
              >
                <SelectTrigger className={`border-2 border-slate-300 ${touched.member_type && errors.member_type ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="e.g. Select Member Type" />
                </SelectTrigger>
                <SelectContent>
                  {memberTypes.map((type) => (
                    <SelectItem key={type._id} value={type._id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched.member_type && errors.member_type && (
                <p className="text-red-500 text-sm mt-1">{errors.member_type}</p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100 cursor-pointer"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !isFormValid}
                className="bg-[#0c1f4d] border-b hover:bg-[#153171] cursor-pointer flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MultiStepModalGrocery;