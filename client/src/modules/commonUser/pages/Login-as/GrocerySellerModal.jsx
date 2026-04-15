import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { AuthContext } from '@/modules/landing/context/AuthContext'; // Adjust path to your AuthContext file
import { Button } from '@/components/ui/button'; // Shadcn UI Button
import { Input } from '@/components/ui/input'; // Shadcn UI Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Shadcn UI Select
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Shadcn UI Card

const GrocerySellerModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ store_name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [roles, setRoles] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [shopImages, setShopImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const totalSteps = 5;

  useEffect(() => {
    setIsLoadingRoles(true);
    fetch(`${import.meta.env.VITE_API_URL}/role/fetch-all-role`)
      .then(res => res.json())
      .then(data => {
        console.log('Roles API response:', data); // Debug log
        const rolesData = data.data || data || [];
        setRoles(rolesData);
        setIsLoadingRoles(false);
      })
      .catch(err => {
        console.error('Error fetching roles:', err);
        setErrorMessage('Failed to fetch roles. Please try again.');
        setIsLoadingRoles(false);
      });
  }, []);

  const handleSearch = () => {
    setErrorMessage('');
    setSearchedUser(null);
    fetch(`${import.meta.env.VITE_API_URL}/users/lookup?name=${encodeURIComponent(searchTerm)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.users && data.users.length > 0) {
          const user = data.users[0];
          if (user.role.role === 'USER') {
            setSearchedUser(user);
            setFormData({
              ...formData,
              user_id: user.user_id,
              name: user.name,
              email: user.email,
              phone: user.phone_number,
            });
          } else {
            setErrorMessage('User found, but role is not USER. Cannot proceed with onboarding.');
          }
        } else {
          setErrorMessage('No matching user found with role USER.');
        }
      })
      .catch(err => {
        setErrorMessage('Error searching for user.');
        console.error(err);
      });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, type) => {
    const files = e.target.files;
    if (type === 'logo' && files[0]) {
      if (files[0].size > 5 * 1024 * 1024) {
        setErrorMessage('Logo file size exceeds 5MB limit.');
        return;
      }
      setLogoFile(files[0]);
    } else if (type === 'shopImages') {
      const newFiles = Array.from(files).slice(0, 5 - shopImages.length);
      if (newFiles.some(file => file.size > 5 * 1024 * 1024)) {
        setErrorMessage('One or more shop images exceed 5MB limit.');
        return;
      }
      if (shopImages.length + newFiles.length > 5) {
        setErrorMessage('Cannot upload more than 5 shop images.');
        return;
      }
      setShopImages([...shopImages, ...newFiles]);
    }
  };

  const handleAddressSubmit = async () => {
    try {
      const addressData = {
        user_id: formData.user_id,
        entity_type: 'grocery_seller',
        address_type: formData.address_type,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/address/create-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      });
      const data = await response.json();
      if (data.message === 'Address created successfully') {
        setFormData({ ...formData, address_id: data.address._id });
        nextStep();
      } else {
        setErrorMessage(data.message || 'Error saving address.');
      }
    } catch (err) {
      setErrorMessage('Error saving address: ' + err.message);
      console.error(err);
    }
  };

  const handleImageSubmit = async () => {
    if (!formData.store_name) {
      setErrorMessage('Please provide a shop name before uploading images.');
      return;
    }

    try {
      setErrorMessage('');
      const formDataToSend = new FormData();
      formDataToSend.append('entity_type', 'grocery-seller');
      formDataToSend.append('shop_name', formData.store_name);

      if (logoFile) {
        formDataToSend.append('logo', logoFile);
        const logoResponse = await fetch(`${import.meta.env.VITE_API_IMAGE_URL}/grocery-seller-images/upload-logo`, {
          method: 'POST',
          body: formDataToSend,
        });
        if (!logoResponse.ok) {
          throw new Error(`Logo upload failed with status ${logoResponse.status}`);
        }
        const logoData = await logoResponse.json();
        if (logoData.message === 'Shop logo uploaded successfully') {
          setFormData(prev => ({ ...prev, logo_url: logoData.logoUrl }));
        } else {
          setErrorMessage(logoData.message || 'Failed to upload logo.');
          return;
        }
      }

      if (shopImages.length > 0) {
        const imageFormData = new FormData();
        imageFormData.append('entity_type', 'grocery-seller');
        imageFormData.append('shop_name', formData.store_name);
        shopImages.forEach(file => imageFormData.append('files', file));

        const imagesResponse = await fetch(`${import.meta.env.VITE_API_IMAGE_URL}/grocery-seller-images/upload-company-image`, {
          method: 'POST',
          body: imageFormData,
        });
        if (!imagesResponse.ok) {
          throw new Error(`Images upload failed with status ${imagesResponse.status}`);
        }
        const imagesData = await imagesResponse.json();
        if (imagesData.message === 'Files uploaded successfully') {
          const imageUrls = imagesData.files.map(file => file.fileUrl);
          setFormData(prev => ({ ...prev, shop_image_urls: imageUrls }));
        } else {
          setErrorMessage(imagesData.message || 'Failed to upload shop images.');
          return;
        }
      }

      nextStep();
    } catch (err) {
      setErrorMessage('Error uploading images: ' + err.message);
      console.error(err);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (isLoadingRoles) {
        setErrorMessage('Roles are still loading. Please wait.');
        return;
      }

      const groceryRole = roles.find((r) => r.role === 'GROCERY-SELLER' || r.role === 'GROCERY_SELLER');
      if (!groceryRole) {
        setErrorMessage('GROCERY-SELLER role not found in fetched roles. Please try again.');
        console.log('Available roles:', roles); // Debug log
        return;
      }

      const submitData = {
        user_id: formData.user_id,
        address_id: formData.address_id,
        store_name: formData.store_name,
        shop_email: formData.shop_email,
        phone_number: formData.phone_number,
        verification_type: formData.verification_type,
        verification_number: formData.verification_number,
        aadhar: formData.aadhar_number,
        logo_url: formData.logo_url,
        company_images: formData.shop_image_urls,
        verified_status: false,
      };

      const sellerResponse = await fetch(`${import.meta.env.VITE_API_URL}/grocery-sellers/create-grocery-seller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const sellerData = await sellerResponse.json();
      if (!sellerData.success) {
        setErrorMessage(sellerData.message || 'Error creating grocery seller.');
        return;
      }

      const roleUpdateResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/update-role-by-user-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: formData.user_id, role_id: groceryRole._id }),
      });

      const roleUpdateData = await roleUpdateResponse.json();
      if (!roleUpdateData.success) {
        setErrorMessage(roleUpdateData.message || 'Error updating user role.');
        return;
      }

      logout();
      navigate('/login');
      showToast('Grocery seller onboarded successfully! Please log in again.','info');
    } catch (err) {
      setErrorMessage('Submission error: ' + err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Search for Existing User</h3>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter name, email, or phone"
              className="text-black"
            />
            <Button onClick={handleSearch} className="bg-black text-white hover:bg-gray-800">
              Search
            </Button>
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
            {searchedUser && (
              <Card className="bg-gray-50 text-black">
                <CardHeader>
                  <CardTitle>User Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Name: {searchedUser.name}</p>
                  <p>Email: {searchedUser.email}</p>
                  <p>Phone: {searchedUser.phone_number}</p>
                  <p>Role: {searchedUser.role.role}</p>
                  <Button
                    onClick={nextStep}
                    className="mt-4 bg-black text-white hover:bg-gray-800"
                  >
                    Proceed to Next Step
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Address Information</h3>
            <div>
              <label className="block mb-1 text-sm font-medium">Entity Type</label>
              <Input
                type="text"
                value="grocery_seller"
                disabled
                className="text-black bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Address Type</label>
              <Select
                name="address_type"
                value={formData.address_type || ''}
                onValueChange={(value) => handleChange({ target: { name: 'address_type', value } })}
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
                name="address_line_1"
                value={formData.address_line_1 || ''}
                onChange={handleChange}
                placeholder="Address Line 1"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Address Line 2</label>
              <Input
                name="address_line_2"
                value={formData.address_line_2 || ''}
                onChange={handleChange}
                placeholder="Address Line 2 (Optional)"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">City</label>
              <Input
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                placeholder="City"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">State</label>
              <Input
                name="state"
                value={formData.state || ''}
                onChange={handleChange}
                placeholder="State"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Country</label>
              <Input
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                placeholder="Country"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Pincode</label>
              <Input
                name="pincode"
                value={formData.pincode || ''}
                onChange={handleChange}
                placeholder="Pincode"
                className="text-black"
              />
            </div>
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button onClick={handleAddressSubmit} className="bg-black text-white hover:bg-gray-800">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3: Store Information</h3>
            <div>
              <label className="block mb-1 text-sm font-medium">Shop Name</label>
              <Input
                name="store_name"
                value={formData.store_name || ''}
                onChange={handleChange}
                placeholder="Shop Name"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Shop Email</label>
              <Input
                name="shop_email"
                value={formData.shop_email || ''}
                onChange={handleChange}
                placeholder="Shop Email"
                type="email"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Phone Number</label>
              <Input
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleChange}
                placeholder="Phone Number"
                type="tel"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Verification Type</label>
              <Select
                name="verification_type"
                value={formData.verification_type || ''}
                onValueChange={(value) => handleChange({ target: { name: 'verification_type', value } })}
              >
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="Select Verification Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="msme">MSME</SelectItem>
                  <SelectItem value="gst">GST</SelectItem>
                  <SelectItem value="pan">PAN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Verification Number</label>
              <Input
                name="verification_number"
                value={formData.verification_number || ''}
                onChange={handleChange}
                placeholder={`Enter ${formData.verification_type ? formData.verification_type.toUpperCase() : 'Verification'} Number`}
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Aadhar Number</label>
              <Input
                name="aadhar_number"
                value={formData.aadhar_number || ''}
                onChange={handleChange}
                placeholder="Aadhar Number"
                className="text-black"
              />
            </div>
            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button onClick={nextStep} className="bg-black text-white hover:bg-gray-800">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 4: Image Upload</h3>
            <div>
              <label className="block mb-1 text-sm font-medium">Shop Logo (Max 5MB)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'logo')}
                className="text-black"
              />
              {logoFile && <p className="mt-2 text-sm text-gray-600">Selected: {logoFile.name}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Shop Images (Max 5 images, 5MB each)</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, 'shopImages')}
                className="text-black"
              />
              {shopImages.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Selected Images:</p>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    {shopImages.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button onClick={handleImageSubmit} className="bg-black text-white hover:bg-gray-800">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 5: Review and Submit</h3>
            {isLoadingRoles && <p className="text-yellow-500">Loading roles, please wait...</p>}
            <Card className="bg-gray-50 text-black">
              <CardContent className="pt-6">
                <p className="mb-2">Shop Name: {formData.store_name}</p>
                <p className="mb-2">Shop Email: {formData.shop_email}</p>
                <p className="mb-2">Phone Number: {formData.phone_number}</p>
                <p className="mb-2">Verification Type: {formData.verification_type ? formData.verification_type.toUpperCase() : ''}</p>
                <p className="mb-2">Verification Number: {formData.verification_number}</p>
                <p className="mb-2">Aadhar Number: {formData.aadhar_number}</p>
                <p className="mb-2">Address: {formData.address_line_1}, {formData.address_line_2 ? `${formData.address_line_2}, ` : ''}{formData.city}, {formData.state}, {formData.country} {formData.pincode}</p>
                {formData.logo_url ? (
                  <div className="mb-4">
                    <p className="mb-1 text-sm font-medium">Shop Logo:</p>
                    <img
                      src={formData.logo_url}
                      alt="Shop Logo"
                      className="max-w-[200px] h-auto rounded-md object-cover"
                      onError={() => setErrorMessage('Failed to load shop logo.')}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 mb-2">No logo uploaded</p>
                )}
                {formData.shop_image_urls && formData.shop_image_urls.length > 0 ? (
                  <div className="mb-4">
                    <p className="mb-1 text-sm font-medium">Shop Images:</p>
                    <div className="grid grid-cols-2 gap-4">
                      {formData.shop_image_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Shop Image ${index + 1}`}
                          className="max-w-[150px] h-auto rounded-md object-cover"
                          onError={() => setErrorMessage(`Failed to load shop image ${index + 1}.`)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 mb-2">No shop images uploaded</p>
                )}
              </CardContent>
            </Card>
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoadingRoles}
                className={`bg-black text-white hover:bg-gray-800 ${isSubmitting || isLoadingRoles ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Submitting...' : isLoadingRoles ? 'Loading Roles...' : 'Submit'} <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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
          <CardTitle className="text-xl font-bold text-center">Grocery Seller Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index + 1 <= currentStep ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
                  } transition-colors duration-300`}
                >
                  {index + 1 <= currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`h-1 w-8 ${
                      index + 1 < currentStep ? 'bg-gray-300' : 'bg-gray-200'
                    } mx-2 transition-colors duration-300`}
                  />
                )}
              </div>
            ))}
          </div>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
};

export default GrocerySellerModal;
