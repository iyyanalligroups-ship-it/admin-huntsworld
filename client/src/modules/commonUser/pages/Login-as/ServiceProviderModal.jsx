import React, { useState, useRef, useContext } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/modules/landing/context/AuthContext'; // Adjust path to your AuthContext file
import {
  useGetRolesQuery,
  useLazyLookupUserQuery,
  useUpdateUserRoleMutation,
  useCreateAddressMutation,
  useCreateServiceProviderMutation,
} from '@/redux/api/ServiceProviderOnboardingApi';
import { Button } from '@/components/ui/button'; // Shadcn UI Button
import { Input } from '@/components/ui/input'; // Shadcn UI Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Shadcn UI Select
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Shadcn UI Card

const IMAGE_SERVER_BASE = 'http://localhost:8080';
const IMAGE_API_BASE = `${IMAGE_SERVER_BASE}//service-provider-images`;

const ServiceProviderModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext); // Access logout function from AuthContext
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    user: null,
    address: null,
    additionalInfo: null,
    serviceDetails: null,
  });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useGetRolesQuery();
  const [triggerLookupUser, { data: lookupData, isLoading: lookupLoading }] = useLazyLookupUserQuery();
  const [updateUserRole, { isLoading: updateLoading }] = useUpdateUserRoleMutation();
  const [createAddress, { isLoading: createAddressLoading }] = useCreateAddressMutation();
  const [createServiceProvider, { isLoading: createServiceProviderLoading }] = useCreateServiceProviderMutation();

  console.log('Roles data:', rolesData);

  const roles = rolesData?.data || [];

  const handleSearchClick = async () => {
    setError('');
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      return;
    }
    try {
      const { data } = await triggerLookupUser(searchQuery);
      console.log('Lookup user response:', data);
      if (data?.success && data.users?.length > 0) {
        const matchedUser = data.users.find((u) => u.role.role === 'USER');
        if (matchedUser) {
          setFormData((prev) => ({ ...prev, user: matchedUser }));
        } else {
          setError('No user with role USER found');
          setFormData((prev) => ({ ...prev, user: null }));
        }
      } else {
        setError('No user found for this data');
        setFormData((prev) => ({ ...prev, user: null }));
      }
    } catch (err) {
      console.error('Lookup user error:', err);
      setError(err?.data?.message || 'Error searching user');
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.user) {
      setError('Please select a valid user before proceeding');
      return;
    }
    setError('');
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!rolesData?.data?.length) {
      setError('No roles data available. Please try again later.');
      return;
    }

    const serviceProviderRole = roles.find((r) => r.role === 'SERVICE_PROVIDER');
    if (!serviceProviderRole) {
      setError('Service Provider role not found in database');
      return;
    }

    if (!formData.user?.user_id) {
      setError('User data is missing');
      return;
    }
    if (!formData.address?._id) {
      setError('Address data is missing');
      return;
    }
    if (!formData.additionalInfo?.travelName || !formData.additionalInfo?.companyEmail || 
        !formData.additionalInfo?.companyPhoneNumber || !formData.additionalInfo?.licenseNumber ||
        !formData.additionalInfo?.numberOfVehicles || !formData.additionalInfo?.vehicleType ||
        !formData.additionalInfo?.description) {
      setError('Please complete all required fields in Additional Information');
      return;
    }

    try {
      // Prepare ServiceProvider data
      const serviceProviderData = {
        user_id: formData.user.user_id,
        address_id: formData.address._id,
        company_email: formData.additionalInfo.companyEmail,
        company_phone_number: formData.additionalInfo.companyPhoneNumber,
        travels_name: formData.additionalInfo.travelName,
        license_number: formData.additionalInfo.licenseNumber,
        number_of_vehicles: parseInt(formData.additionalInfo.numberOfVehicles, 10),
        vehicle_type: formData.additionalInfo.vehicleType,
        description: formData.additionalInfo.description,
        company_logo: formData.serviceDetails?.logoUrl || '',
        company_images: formData.serviceDetails?.imageUrls || [],
        verified_status: false,
        trust_shield: false,
      };

      console.log('Submitting ServiceProvider data:', serviceProviderData);

      // Create ServiceProvider
      const { data: serviceProviderResponse, error: serviceProviderError } = await createServiceProvider(serviceProviderData).unwrap();
      
      if (serviceProviderError) {
        console.error('Service provider creation error:', serviceProviderError);
        setError(serviceProviderError?.data?.message || 'Error creating service provider');
        return;
      }

      console.log('Service provider response:', serviceProviderResponse);

      // Check if service provider was created successfully
      if (!serviceProviderResponse?._id) {
        console.error('Service provider response missing _id:', serviceProviderResponse);
        setError('Error creating service provider: Invalid response');
        return;
      }

      console.log('Service provider created successfully:', serviceProviderResponse);

      // Update user role after successful service provider creation
      const userId = formData.user.user_id;
      const roleId = serviceProviderRole._id;
      console.log('Attempting to update user role:', { user_id: userId, role_id: roleId });
      const { data: roleUpdateResponse, error: roleUpdateError } = await updateUserRole({ 
        user_id: userId, 
        role_id: roleId 
      }).unwrap();
      
      if (roleUpdateError) {
        console.error('Role update error:', roleUpdateError);
        setError(roleUpdateError?.data?.message || 'Error updating user role');
        return;
      }

      console.log('Role update response:', roleUpdateResponse);

      // Update the user in formData with the new role
      setFormData((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          role: {
            ...prev.user.role,
            role: 'SERVICE_PROVIDER',
            _id: roleId
          }
        }
      }));

      console.log('User role updated successfully:', roleUpdateResponse);

      // Log out the user and navigate to login page
      logout();
      onClose();
      navigate('/login');
    } catch (err) {
      console.error('Submission error:', err);
      setError(err?.data?.message || err?.message || 'Error submitting form');
    }
  };

  const Step1 = () => {
    const handleInputChange = (e) => {
      setSearchQuery(e.target.value);
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Step 1: Search for Existing User</h3>
        <div className="flex gap-2">
          <Input
            type="text"
            id="search"
            ref={searchInputRef}
            value={searchQuery}
            onChange={handleInputChange}
            className="text-black"
            placeholder="Enter name, email, or phone number"
            autoFocus
          />
          <Button
            onClick={handleSearchClick}
            disabled={lookupLoading}
            className="bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {lookupLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        {formData.user && (
          <Card className="bg-gray-50 text-black">
            <CardHeader>
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Name: {formData.user.name}</p>
              <p>Email: {formData.user.email || 'N/A'}</p>
              <p>Phone: {formData.user.phone_number}</p>
              <p>Role: {formData.user.role.role}</p>
            </CardContent>
          </Card>
        )}
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!formData.user || lookupLoading}
            className="bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const Step2 = () => {
    const [addressData, setAddressData] = useState({
      address_type: 'personal',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setAddressData((prev) => ({ ...prev, [name]: value.trim() }));
    };

    const handleNextWithData = async () => {
      if (!addressData.address_line_1 || !addressData.city || !addressData.state || !addressData.country || !addressData.pincode) {
        setError('Please fill all required address fields');
        return;
      }
      setError('');
      const payload = {
        user_id: formData.user.user_id,
        entity_type: 'service_provider',
        ...addressData,
      };
      console.log('Address payload:', payload);
      try {
        const response = await createAddress(payload);
        console.log('Full createAddress response:', response);
        if (response.error) {
          console.log('API error response:', response.error);
          setError(response.error.data?.message || 'Failed to create address');
          return;
        }
        const data = response.data;
        if (data && data.address && data.address._id) {
          setFormData((prev) => ({ ...prev, address: data.address }));
          handleNext();
        } else {
          console.log('Unexpected response data:', data);
          setError(data?.message || 'Failed to create address: Invalid response');
        }
      } catch (err) {
        console.error('Create address error:', err);
        setError(err?.data?.message || err.message || 'Error creating address');
      }
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Step 2: Address Details</h3>
        <div>
          <label className="block mb-1 text-sm font-medium">Entity Type</label>
          <Input
            type="text"
            value="service_provider"
            disabled
            className="text-black bg-gray-100 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Address Type</label>
          <Select
            value={addressData.address_type}
            onValueChange={(value) => setAddressData((prev) => ({ ...prev, address_type: value }))}
          >
            <SelectTrigger className="text-black">
              <SelectValue placeholder="Select Address Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Address Line 1</label>
          <Input
            type="text"
            name="address_line_1"
            value={addressData.address_line_1}
            onChange={handleChange}
            placeholder="Enter address line 1"
            className="text-black"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Address Line 2</label>
          <Input
            type="text"
            name="address_line_2"
            value={addressData.address_line_2}
            onChange={handleChange}
            placeholder="Enter address line 2 (optional)"
            className="text-black"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">City</label>
          <Input
            type="text"
            name="city"
            value={addressData.city}
            onChange={handleChange}
            placeholder="Enter city"
            className="text-black"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">State</label>
          <Input
            type="text"
            name="state"
            value={addressData.state}
            onChange={handleChange}
            placeholder="Enter state"
            className="text-black"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Country</label>
          <Input
            type="text"
            name="country"
            value={addressData.country}
            onChange={handleChange}
            placeholder="Enter country"
            className="text-black"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Pincode</label>
          <Input
            type="text"
            name="pincode"
            value={addressData.pincode}
            onChange={handleChange}
            placeholder="Enter pincode"
            className="text-black"
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex justify-between">
          <Button
            onClick={handleBack}
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={handleNextWithData}
            disabled={createAddressLoading}
            className="bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const Step3 = () => {
    const [additionalData, setAdditionalData] = useState(formData.additionalInfo || {
      travelName: '',
      companyEmail: '',
      companyPhoneNumber: '',
      licenseNumber: '',
      numberOfVehicles: '',
      vehicleType: '',
      description: '',
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setAdditionalData((prev) => ({ ...prev, [name]: value }));
    };

    const handleNextWithData = () => {
      console.log('Additional Data from Step 1, 2, and 3:', {
        user: formData.user,
        address: formData.address,
        additionalInfo: additionalData,
      });
      setFormData((prev) => ({ ...prev, additionalInfo: additionalData }));
      handleNext();
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Step 3: Additional Information</h3>
        <div>
          <label className="block mb-1 text-sm font-medium">Travel Name</label>
          <Input
            type="text"
            name="travelName"
            value={additionalData.travelName}
            onChange={handleChange}
            placeholder="Enter travel name"
            className="text-black"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Company Email</label>
          <Input
            type="email"
            name="companyEmail"
            value={additionalData.companyEmail}
            onChange={handleChange}
            placeholder="Enter company email"
            className="text-black"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Company Phone Number</label>
          <Input
            type="tel"
            name="companyPhoneNumber"
            value={additionalData.companyPhoneNumber}
            onChange={handleChange}
            placeholder="Enter company phone number"
            className="text-black"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">License Number</label>
          <Input
            type="text"
            name="licenseNumber"
            value={additionalData.licenseNumber}
            onChange={handleChange}
            placeholder="Enter license number"
            className="text-black"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Number of Vehicles</label>
          <Input
            type="number"
            name="numberOfVehicles"
            value={additionalData.numberOfVehicles}
            onChange={handleChange}
            placeholder="Enter number of vehicles"
            className="text-black"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Vehicle Type</label>
          <Select
            value={additionalData.vehicleType}
            onValueChange={(value) => setAdditionalData((prev) => ({ ...prev, vehicleType: value }))}
          >
            <SelectTrigger className="text-black">
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2-wheeler">2-wheeler</SelectItem>
              <SelectItem value="3-wheeler">3-wheeler</SelectItem>
              <SelectItem value="4-wheeler">4-wheeler</SelectItem>
              <SelectItem value="8-wheeler">8-wheeler</SelectItem>
              <SelectItem value="12-wheeler">12-wheeler</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={additionalData.description}
            onChange={handleChange}
            className="w-full p-2 rounded-lg text-black border border-gray-300"
            placeholder="Enter description"
            rows="5"
          />
        </div>
        <div className="flex justify-between">
          <Button
            onClick={handleBack}
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={handleNextWithData}
            className="bg-black text-white hover:bg-gray-800"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const Step4 = () => {
    const [logoFile, setLogoFile] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleLogoChange = (e) => {
      const file = e.target.files[0];
      if (file && file.size > 5 * 1024 * 1024) {
        setError('Logo file size exceeds 5MB');
        return;
      }
      setLogoFile(file);
      setError('');
    };

    const handleImagesChange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 5) {
        setError('You can upload up to 5 images');
        return;
      }
      const tooBig = files.some((f) => f.size > 5 * 1024 * 1024);
      if (tooBig) {
        setError('One or more image files exceed 5MB');
        return;
      }
      setImageFiles(files);
      setError('');
    };

    const handleNextWithData = async () => {
      setError('');
      setIsUploading(true);
      const travelName = formData.additionalInfo?.travelName;
      if (!travelName) {
        setError('Travel name from previous step is required');
        setIsUploading(false);
        return;
      }

      let logoUrl = null;
      let imageUrls = [];

      try {
        if (logoFile) {
          const formDataLogo = new FormData();
          formDataLogo.append('logo', logoFile);
          formDataLogo.append('company_name', travelName);

          const resLogo = await fetch(`${IMAGE_API_BASE}/upload-logo`, {
            method: 'POST',
            body: formDataLogo,
          });
          const dataLogo = await resLogo.json();
          if (!dataLogo.logoUrl) {
            throw new Error('Failed to upload logo');
          }
          logoUrl = dataLogo.logoUrl;
        }

        if (imageFiles.length > 0) {
          const formDataImages = new FormData();
          imageFiles.forEach((file) => formDataImages.append('files', file));
          formDataImages.append('entity_type', 'service_provider');
          formDataImages.append('company_name', travelName);

          const resImages = await fetch(`${IMAGE_API_BASE}/upload-company-image`, {
            method: 'POST',
            body: formDataImages,
          });
          const dataImages = await resImages.json();
          if (!dataImages.success || !dataImages.files) {
            throw new Error('Failed to upload images');
          }
          imageUrls = dataImages.files.map((f) => f.fileUrl);
        }

        setFormData((prev) => ({ ...prev, serviceDetails: { logoUrl, imageUrls } }));
        handleNext();
      } catch (err) {
        console.error('Upload error:', err);
        setError(err.message || 'Error uploading files');
      } finally {
        setIsUploading(false);
      }
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Step 4: Service Details</h3>
        <div>
          <label className="block mb-1 text-sm font-medium">Insert Logo (up to 5MB)</label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="text-black"
          />
          {logoFile && <p className="mt-2 text-sm text-gray-600">Selected: {logoFile.name}</p>}
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Insert Vehicle or Company Images (up to 5 images, 5MB each)</label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesChange}
            className="text-black"
          />
          {imageFiles.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Selected Images:</p>
              <ul className="list-disc pl-5 text-sm text-gray-600">
                {imageFiles.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex justify-between">
          <Button
            onClick={handleBack}
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={handleNextWithData}
            disabled={isUploading}
            className="bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const Step5 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Step 5: Confirmation</h3>
      <p>Confirm upgrade to Service Provider.</p>
      {formData.user && (
        <Card className="bg-gray-50 text-black">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Name: {formData.user.name}</p>
            <p>Email: {formData.user.email || 'N/A'}</p>
            <p>Phone: {formData.user.phone_number}</p>
          </CardContent>
        </Card>
      )}
      {formData.additionalInfo && (
        <Card className="bg-gray-50 text-black">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Travel Name: {formData.additionalInfo.travelName || 'N/A'}</p>
            <p>Company Email: {formData.additionalInfo.companyEmail || 'N/A'}</p>
            <p>Company Phone Number: {formData.additionalInfo.companyPhoneNumber || 'N/A'}</p>
            <p>License Number: {formData.additionalInfo.licenseNumber || 'N/A'}</p>
            <p>Number of Vehicles: {formData.additionalInfo.numberOfVehicles || 'N/A'}</p>
            <p>Vehicle Type: {formData.additionalInfo.vehicleType || 'N/A'}</p>
            <p>Description: {formData.additionalInfo.description || 'N/A'}</p>
          </CardContent>
        </Card>
      )}
      {formData.address && (
        <Card className="bg-gray-50 text-black">
          <CardHeader>
            <CardTitle>Address Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Address Line 1: {formData.address.address_line_1}</p>
            <p>Address Line 2: {formData.address.address_line_2 || 'N/A'}</p>
            <p>City: {formData.address.city}</p>
            <p>State: {formData.address.state}</p>
            <p>Country: {formData.address.country}</p>
            <p>Pincode: {formData.address.pincode}</p>
          </CardContent>
        </Card>
      )}
      {formData.serviceDetails && (
        <Card className="bg-gray-50 text-black">
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="font-medium">Logo:</p>
              {formData.serviceDetails.logoUrl ? (
                <img
                  src={formData.serviceDetails.logoUrl}
                  alt="Logo"
                  className="w-20 h-20 object-cover mt-2"
                  onError={(e) => console.log('Image load error:', e)}
                />
              ) : (
                <p>N/A</p>
              )}
            </div>
            <div className="mt-4">
              <p className="font-medium">Images:</p>
              {formData.serviceDetails.imageUrls.length > 0 ? (
                <div className="flex gap-2 mt-2">
                  {formData.serviceDetails.imageUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="w-20 h-20 object-cover"
                      onError={(e) => console.log('Image load error:', e)}
                    />
                  ))}
                </div>
              ) : (
                <p>N/A</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex justify-between">
        <Button
          onClick={handleBack}
          variant="outline"
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={updateLoading || rolesLoading || createServiceProviderLoading}
          className="bg-black text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Submit <CheckCircle className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <Card className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto relative">
        <Button
          onClick={onClose}
          variant="ghost"
          className="absolute top-4 right-4 bg-gray-100 text-black hover:bg-gray-200 rounded-full p-2"
          aria-label="Close modal"
        >
          <X size={28} className="text-black" />
        </Button>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Service Provider Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index + 1 <= currentStep ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
                  } transition-colors duration-300`}
                >
                  {index + 1 <= currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                {index < 4 && (
                  <div
                    className={`h-1 w-8 ${
                      index + 1 < currentStep ? 'bg-gray-300' : 'bg-gray-200'
                    } mx-2 transition-colors duration-300`}
                  />
                )}
              </div>
            ))}
          </div>
          {rolesLoading ? (
            <p className="text-center text-gray-600">Loading roles...</p>
          ) : rolesError ? (
            <p className="text-red-500 text-center">Error loading roles: {rolesError.message}</p>
          ) : (
            <>
              {currentStep === 1 && <Step1 />}
              {currentStep === 2 && <Step2 />}
              {currentStep === 3 && <Step3 />}
              {currentStep === 4 && <Step4 />}
              {currentStep === 5 && <Step5 />}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceProviderModal;