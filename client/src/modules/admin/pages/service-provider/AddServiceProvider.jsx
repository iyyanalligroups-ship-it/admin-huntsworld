import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import showToast from '@/toast/showToast';


const AddServiceProvider = ({ isOpen, onClose, onProviderAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [formData, setFormData] = useState({
    travels_name: '',
    company_email: '',
    company_phone_number: '',
  });
  const [errors, setErrors] = useState({
    travels_name: '',
    company_email: '',
    company_phone_number: '',
  });
  const [touched, setTouched] = useState({
    travels_name: false,
    company_email: false,
    company_phone_number: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Phone number validation regex (exactly 10 digits)
  const phoneRegex = /^\d{10}$/;

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {
      travels_name: '',
      company_email: '',
      company_phone_number: '',
    };

    if (!formData.travels_name.trim()) {
      newErrors.travels_name = 'Travels name is required';
    }

    if (!formData.company_email) {
      newErrors.company_email = 'Company email is required';
    } else if (!emailRegex.test(formData.company_email)) {
      newErrors.company_email = 'Please enter a valid email address';
    }

    if (!formData.company_phone_number) {
      newErrors.company_phone_number = 'Phone number is required';
    } else if (!phoneRegex.test(formData.company_phone_number)) {
      newErrors.company_phone_number = 'Phone number must be exactly 10 digits';
    }

    setErrors(newErrors);

    // Form is valid if there are no errors
    return Object.values(newErrors).every((error) => !error);
  };

  // Validate form whenever formData changes
  useEffect(() => {
    if (showForm) {
      setIsFormValid(validateForm());
    }
  }, [formData, showForm]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSearchResult(null);
    setShowForm(false);
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/search-user-for-service-provider?query=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(data,'data service provider');
      
      if (!data.success) {
        showToast(data.message || 'No user found for the search', 'error');
        setLoading(false);
        return;
      }

      if (data.data.length > 0) {
        setSearchResult(data.data[0]);
        showToast('User found! Click Next to fill in the service provider details.', 'success');
      } else {
        showToast('No user found with role USER matching the search criteria', 'error');
      }
    } catch (err) {
      showToast('Error searching user. Please try again.', 'success');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For phone number, only allow digits
    if (name === 'company_phone_number') {
      if (/^\d*$/.test(value) && value.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!searchResult) {
      showToast('Please search and select a user first.','error');
      setLoading(false);
      return;
    }

    if (!validateForm()) {
      showToast('Please correct the errors in the form.','error');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Create Service Provider
      const createResponse = await fetch(`${import.meta.env.VITE_API_URL}/service-providers/create-service-providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: searchResult._id,
          travels_name: formData.travels_name,
          company_email: formData.company_email,
          company_phone_number: formData.company_phone_number,
        }),
      });

      const createData = await createResponse.json();

      if (!createData.success) {
        showToast(createData.message || 'Error creating service provider','error');
        setLoading(false);
        return;
      }

      // Step 2: Fetch Roles
      const roleResponse = await fetch(`${import.meta.env.VITE_API_URL}/role/fetch-all-role`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const roleData = await roleResponse.json();
      const serviceProviderRole = roleData.data?.find((role) => role.role === 'SERVICE_PROVIDER');

      if (!serviceProviderRole) {
        showToast('SERVICE_PROVIDER role not found','error');
        setLoading(false);
        return;
      }

      // Step 3: Update User Role
      const updateRoleResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/update-role-by-user-id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: searchResult._id,
          role_id: serviceProviderRole._id,
        }),
      });

      const updateRoleData = await updateRoleResponse.json();

      if (!updateRoleData.success) {
        showToast(updateRoleData.message || 'Error updating user role','error');
        setLoading(false);
        return;
      }

      // Step 4: SUCCESS — Only show success if ALL steps succeed
      showToast('Service provider created and user role updated successfully!','success');

      // Reset form
      setFormData({ travels_name: '', company_email: '', company_phone_number: '' });
      setSearchResult(null);
      setSearchQuery('');
      setShowForm(false);
      setTouched({ travels_name: false, company_email: false, company_phone_number: false });

      // Notify parent component
      onProviderAdded?.();
      onClose?.();
      // Optional: Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      showToast('An unexpected error occurred. Please try again.','error');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setShowForm(true);
  };

  const handleCancel = () => {
    setSearchQuery('');
    setSearchResult(null);
    setFormData({ travels_name: '', company_email: '', company_phone_number: '' });
    setErrors({ travels_name: '', company_email: '', company_phone_number: '' });
    setTouched({ travels_name: false, company_email: false, company_phone_number: false });
    setError('');
    setSuccess('');
    setShowForm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px] text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create New Service Provider</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {/* Search Section */}
          {!showForm && (
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex items-center space-x-4">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="flex-1"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  className="bg-[#0c1f4d] hover:bg-[#153171] text-white rounded-lg px-6 py-2 transition-colors duration-200 flex items-center gap-2"
                  disabled={loading || !searchQuery.trim()}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </form>
          )}

          {/* Search Result */}
          {searchResult && !showForm && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h3 className="text-lg font-semibold text-gray-700">User Found</h3>
              <p><strong>Name:</strong> {searchResult.name}</p>
              <p><strong>Email:</strong> {searchResult.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {searchResult.phone}</p>
              <Button
                onClick={handleNext}
                className="bg-[#0c1f4d] hover:bg-[#153171] text-white rounded-lg px-6 py-2 transition-colors duration-200"
              >
                Next
              </Button>
            </div>
          )}

          {/* Error and Success Messages */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {/* {success && <p className="text-green-500 text-sm">{success}</p>} */}

          {/* Service Provider Form */}
          {searchResult && showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="travels_name" className="text-gray-700 font-medium">
                  Travels Name
                </Label>
                <Input
                  type="text"
                  id="travels_name"
                  name="travels_name"
                  value={formData.travels_name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Enter travels name"
                  className="mt-1"
                  required
                  disabled={loading}
                />
                {touched.travels_name && errors.travels_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.travels_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="company_email" className="text-gray-700 font-medium">
                  Company Email
                </Label>
                <Input
                  type="email"
                  id="company_email"
                  name="company_email"
                  value={formData.company_email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Enter company email"
                  className="mt-1"
                  required
                  disabled={loading}
                />
                {touched.company_email && errors.company_email && (
                  <p className="text-red-500 text-sm mt-1">{errors.company_email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="company_phone_number" className="text-gray-700 font-medium">
                  Company Phone Number
                </Label>
                <Input
                  type="tel"
                  id="company_phone_number"
                  name="company_phone_number"
                  value={formData.company_phone_number}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Enter 10-digit phone number"
                  className="mt-1"
                  required
                  disabled={loading}
                />
                {touched.company_phone_number && errors.company_phone_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.company_phone_number}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-[#0c1f4d] hover:bg-[#153171] text-white rounded-lg py-2 transition-colors duration-200 flex items-center justify-center gap-2"
                disabled={loading || !isFormValid}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Creating...' : 'Create Service Provider'}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceProvider;