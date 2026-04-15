import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Shadcn UI Button
import { Input } from '@/components/ui/input'; // Shadcn UI Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Shadcn UI Select
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Shadcn UI Card
import { Checkbox } from '@/components/ui/checkbox'; // Shadcn UI Checkbox

const MerchantModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    searchedUser: null,
    address_type: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    company_name: '',
    aadhar: '',
    company_email: '',
    company_type: '',
    company_phone_number: '',
    number_of_employees: '',
    verification_certificate_type: '',
    verification_number: '',
    description: '',
    year_of_establishment: '',
    company_logo: '',
    company_images: [],
    address_id: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [companyImages, setCompanyImages] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const validateAadhar = async (aadhar) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/merchants/check-aadhar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhar }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return !data.exists;
    } catch (err) {
      console.error('Aadhar validation error:', err);
      return false;
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Please enter a name, email, or phone number.');
      return;
    }
    setError('');
    try {
      console.log('Initiating user search with value:', searchValue);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/lookup?name=${encodeURIComponent(searchValue)}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Search response:', data);
      if (data.success && data.users?.length > 0) {
        const user = data.users[0];
        if (!user.user_id) {
          setError('User ID is missing in the response.');
          console.error('Missing user_id in response:', user);
          return;
        }
        setFormData({ ...formData, searchedUser: { ...user, _id: user.user_id } });
        setError('');
        console.log('User set in formData:', { ...user, _id: user.user_id });
      } else {
        setError('No user found matching the criteria.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Error searching for user: ' + err.message);
    }
  };

  const handleAddressSubmit = async () => {
    if (!formData.searchedUser?._id) {
      setError('User ID is missing. Please complete step 1.');
      return;
    }

    const addressData = {
      user_id: formData.searchedUser._id,
      entity_type: "merchant",
      address_type: formData.address_type,
      address_line_1: formData.address_line_1,
      address_line_2: formData.address_line_2,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      pincode: formData.pincode,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/address/create-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.message === "Address created successfully") {
        setFormData({ ...formData, address: data.address, address_id: data.address._id });
        setError('');
        setCurrentStep(prev => prev + 1);
      } else {
        setError(data.message || 'Failed to create address.');
      }
    } catch (err) {
      console.error('Address submission error:', err);
      setError(`Error creating address: ${err.message}`);
    }
  };

  const handleImageUpload = async () => {
    if (!formData.company_name) {
      setError('Company name is required for image upload.');
      return false;
    }

    const imageApiUrl = import.meta.env.VITE_IMAGE_API_URL || 'http://localhost:8080/api/v1';
    const formDataToSend = new FormData();
    formDataToSend.append('entity_type', 'merchant');
    formDataToSend.append('company_name', formData.company_name);

    let company_logo = formData.company_logo;
    if (logoFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(logoFile.type)) {
        setError('Company logo must be JPEG, PNG, or WebP.');
        return false;
      }
      if (logoFile.size > MAX_FILE_SIZE) {
        setError('Company logo must not exceed 5MB.');
        return false;
      }
      formDataToSend.append('logo', logoFile);
      try {
        const response = await fetch(`${imageApiUrl}/merchant-images/upload-logo`, {
          method: 'POST',
          body: formDataToSend,
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        company_logo = data.company_logo || data.logoUrl;
      } catch (err) {
        setError(`Error uploading logo: ${err.message}`);
        return false;
      }
    }

    let company_images = formData.company_images;
    if (companyImages.length > 0) {
      if (companyImages.length > 5) {
        setError('You can upload up to 5 company images.');
        return false;
      }
      const imageFormData = new FormData();
      imageFormData.append('entity_type', 'merchant');
      imageFormData.append('company_name', formData.company_name);
      companyImages.forEach((file) => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          setError('Company images must be JPEG, PNG, or WebP.');
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError('Each company image must not exceed 5MB.');
          return false;
        }
        imageFormData.append('files', file);
      });
      try {
        const response = await fetch(`${imageApiUrl}/merchant-images/upload-company-image`, {
          method: 'POST',
          body: imageFormData,
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        company_images = data.files.map(file => file.company_image || file.fileUrl);
      } catch (err) {
        setError(`Error uploading company images: ${err.message}`);
        return false;
      }
    }

    setFormData({ ...formData, company_logo, company_images });
    return true;
  };

  const handleMerchantSubmit = async () => {
    setError('');
    setSuccessMessage('');
    
    if (!termsAccepted) {
      setError('You must accept the Terms and Conditions to proceed.');
      return;
    }

    if (!formData.searchedUser?._id || !formData.address_id) {
      setError('User ID or Address ID is missing. Please complete previous steps.');
      return;
    }

    const isAadharUnique = await validateAadhar(formData.aadhar);
    if (!isAadharUnique) {
      setError('A merchant with this Aadhar number already exists.');
      return;
    }

    if (!formData.verification_certificate_type || !formData.verification_number) {
      setError('Please select a verification certificate type and provide a valid number.');
      return;
    }

    const merchantData = {
      user_id: formData.searchedUser._id,
      address_id: formData.address_id,
      company_name: formData.company_name,
      aadhar: formData.aadhar,
      company_email: formData.company_email,
      company_type: formData.company_type,
      company_phone_number: formData.company_phone_number,
      number_of_employees: parseInt(formData.number_of_employees) || 0,
      description: formData.description,
      year_of_establishment: parseInt(formData.year_of_establishment) || 0,
      company_logo: formData.company_logo,
      company_images: formData.company_images,
    };

    if (formData.verification_certificate_type === 'GST') {
      merchantData.gst_number = formData.verification_number;
    } else if (formData.verification_certificate_type === 'MSME') {
      merchantData.msme_certificate_number = formData.verification_number;
    } else if (formData.verification_certificate_type === 'PAN') {
      merchantData.pan = formData.verification_number;
    }

    try {
      const merchantResponse = await fetch(`${import.meta.env.VITE_API_URL}/merchants/create-merchant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merchantData),
      });

      if (!merchantResponse.ok) {
        const data = await merchantResponse.json();
        if (data.error && data.error.includes('duplicate key error')) {
          if (data.error.includes('pan')) {
            setError('A merchant with this PAN number already exists.');
          } else if (data.error.includes('gst_number')) {
            setError('A merchant with this GST number already exists.');
          } else if (data.error.includes('msme_certificate_number')) {
            setError('A merchant with this MSME certificate number already exists.');
          } else {
            setError(data.error || 'Failed to create merchant.');
          }
        } else {
          setError(data.error || `HTTP error! Status: ${merchantResponse.status}`);
        }
        return;
      }

      const updateRoleResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/update-role-by-user-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: formData.searchedUser._id,
          role_id: 'MERCHANT',
        }),
      });

      if (!updateRoleResponse.ok) {
        const data = await updateRoleResponse.json();
        throw new Error(data.error || `HTTP error updating role! Status: ${updateRoleResponse.status}`);
      }

      setSuccessMessage('Merchant ID created successfully!');
      setTimeout(() => {
        handleCancel();
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Merchant submission or role update error:', err);
      setError(`Error creating merchant or updating role: ${err.message}`);
    }
  };

  const handleNext = async () => {
    console.log('HandleNext called, currentStep:', currentStep);
    if (currentStep === 1) {
      if (!formData.searchedUser?._id) {
        setError('Please complete the search with a valid user before proceeding.');
        console.log('No valid user found:', formData.searchedUser);
        return;
      }
      console.log('Valid user found, proceeding to step 2:', formData.searchedUser);
      setError('');
      setCurrentStep(prev => prev + 1);
      return;
    }
    if (currentStep === 2) {
      if (
        !formData.address_type ||
        !formData.address_line_1 ||
        !formData.city ||
        !formData.state ||
        !formData.country ||
        !formData.pincode
      ) {
        setError('Please fill all required address fields.');
        return;
      }
      await handleAddressSubmit();
      return;
    }
    if (currentStep === 3) {
      if (
        !formData.company_name ||
        !formData.aadhar ||
        !formData.company_email ||
        !formData.company_type ||
        !formData.company_phone_number ||
        !formData.number_of_employees ||
        !formData.description ||
        !formData.year_of_establishment
      ) {
        setError('Please fill all required merchant fields.');
        return;
      }
      if (!formData.verification_certificate_type || !formData.verification_number) {
        setError('Please select a verification certificate type and provide a valid number.');
        return;
      }
      const wordCount = formData.description.trim().split(/\s+/).length;
      if (wordCount < 10 || wordCount > 3000) {
        setError('Description must be between 30 and 3000 words.');
        return;
      }
      setError('');
      setCurrentStep(prev => prev + 1);
      return;
    }
    if (currentStep === 4) {
      const imagesUploaded = await handleImageUpload();
      if (!imagesUploaded) return;
      setError('');
      setCurrentStep(prev => prev + 1);
      return;
    }
    if (currentStep === 5) {
      await handleMerchantSubmit();
      return;
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setError('');
      setSuccessMessage('');
    }
  };

  const handleCancel = () => {
    onClose();
    setCurrentStep(1);
    setFormData({
      searchedUser: null,
      address_type: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      company_name: '',
      aadhar: '',
      company_email: '',
      company_type: '',
      company_phone_number: '',
      number_of_employees: '',
      verification_certificate_type: '',
      verification_number: '',
      description: '',
      year_of_establishment: '',
      company_logo: '',
      company_images: [],
      address_id: '',
    });
    setSearchValue('');
    setError('');
    setSuccessMessage('');
    setLogoFile(null);
    setCompanyImages([]);
    setTermsAccepted(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogoFile(file);
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setCompanyImages(files);
  };

  const renderStepper = () => (
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
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Search for Existing User</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Enter name, email, or phone number"
                className="text-black"
              />
              <Button onClick={handleSearch} className="bg-black text-white hover:bg-gray-800">
                Search
              </Button>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            {formData.searchedUser && (
              <Card className="bg-gray-50 text-black">
                <CardHeader>
                  <CardTitle>User Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Name: {formData.searchedUser.name || 'N/A'}</p>
                  <p>Email: {formData.searchedUser.email || 'N/A'}</p>
                  <p>Phone: {formData.searchedUser.phone_number || 'N/A'}</p>
                  <p>Role: {formData.searchedUser.role?.role || 'N/A'}</p>
                </CardContent>
              </Card>
            )}
            <div className="flex justify-end">
              <Button onClick={handleNext} className="bg-black text-white hover:bg-gray-800">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Address Details</h3>
            <div>
              <label className="block mb-1 text-sm font-medium">Entity Type</label>
              <Input
                type="text"
                value="merchant"
                disabled
                className="text-black bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Address Type</label>
              <Select
                value={formData.address_type}
                onValueChange={(value) => setFormData({ ...formData, address_type: value })}
              >
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="Select Address Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Address Line 1</label>
              <Input
                type="text"
                value={formData.address_line_1}
                onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                placeholder="Enter address line 1"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Address Line 2</label>
              <Input
                type="text"
                value={formData.address_line_2}
                onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                placeholder="Enter address line 2 (optional)"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">City</label>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter city"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">State</label>
              <Input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Enter state"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Country</label>
              <Input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Enter country"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Pincode</label>
              <Input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="Enter pincode"
                className="text-black"
              />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex justify-between">
              <Button onClick={handlePrevious} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button onClick={handleNext} className="bg-black text-white hover:bg-gray-800">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3: Merchant Details</h3>
            <div>
              <label className="block mb-1 text-sm font-medium">Company Name</label>
              <Input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Enter company name"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Aadhar Number</label>
              <Input
                type="text"
                value={formData.aadhar}
                onChange={(e) => setFormData({ ...formData, aadhar: e.target.value })}
                placeholder="Enter Aadhar number"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Company Email</label>
              <Input
                type="email"
                value={formData.company_email}
                onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                placeholder="Enter company email"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Company Type</label>
              <Select
                value={formData.company_type}
                onValueChange={(value) => setFormData({ ...formData, company_type: value })}
              >
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="Select Company Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retailer">Retailer</SelectItem>
                  <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="Sub_dealer">Sub-dealer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Company Phone Number</label>
              <Input
                type="text"
                value={formData.company_phone_number}
                onChange={(e) => setFormData({ ...formData, company_phone_number: e.target.value })}
                placeholder="Enter company phone number"
                className="text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Number of Employees</label>
              <Input
                type="number"
                value={formData.number_of_employees}
                onChange={(e) => setFormData({ ...formData, number_of_employees: e.target.value })}
                placeholder="Enter number of employees"
                className="text-black"
                min="1"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Year of Establishment</label>
              <Input
                type="number"
                value={formData.year_of_establishment}
                onChange={(e) => setFormData({ ...formData, year_of_establishment: e.target.value })}
                placeholder="Enter year of establishment"
                className="text-black"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Verification Certificate Type</label>
              <Select
                value={formData.verification_certificate_type}
                onValueChange={(value) => setFormData({ ...formData, verification_certificate_type: value, verification_number: '' })}
              >
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="Select Verification Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GST">GST</SelectItem>
                  <SelectItem value="MSME">MSME</SelectItem>
                  <SelectItem value="PAN">PAN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.verification_certificate_type && (
              <div>
                <label className="block mb-1 text-sm font-medium">
                  {formData.verification_certificate_type} Number
                </label>
                <Input
                  type="text"
                  value={formData.verification_number}
                  onChange={(e) => setFormData({ ...formData, verification_number: e.target.value })}
                  placeholder={`Enter ${formData.verification_certificate_type} number`}
                  className="text-black"
                />
              </div>
            )}
            <div>
              <label className="block mb-1 text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 rounded-lg text-black border border-gray-300"
                placeholder="Enter company description (30-3000 words)"
                rows="5"
              />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex justify-between">
              <Button onClick={handlePrevious} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button onClick={handleNext} className="bg-black text-white hover:bg-gray-800">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 4: Upload Images</h3>
            <div>
              <label className="block mb-1 text-sm font-medium">Company Logo (Max 5MB, JPEG/PNG/WebP)</label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoChange}
                className="text-black"
              />
              {logoFile && <p className="mt-2 text-sm text-gray-600">Selected: {logoFile.name}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Company Images (Up to 5, Max 5MB each, JPEG/PNG/WebP)</label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImagesChange}
                className="text-black"
              />
              {companyImages.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Selected Images:</p>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    {companyImages.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex justify-between">
              <Button onClick={handlePrevious} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button onClick={handleNext} className="bg-black text-white hover:bg-gray-800">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 5: Terms and Conditions</h3>
            <div className="flex items-center">
              <Checkbox
                id="termsCheckbox"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked)}
              />
              <label htmlFor="termsCheckbox" className="ml-2 text-sm">
                I agree to the{' '}
                <a
                  href="/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-700"
                >
                  Terms and Conditions
                </a>
              </label>
            </div>
            {successMessage && <p className="text-green-500">{successMessage}</p>}
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex justify-between">
              <Button onClick={handlePrevious} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={!termsAccepted}
                className={`bg-black text-white hover:bg-gray-800 ${!termsAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Submit <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <Card className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto relative">
        <Button
          onClick={handleCancel}
          variant="ghost"
          className="absolute top-4 right-4 bg-gray-100 text-black hover:bg-gray-200 rounded-full p-2"
          aria-label="Close modal"
        >
          <X size={28} className="text-black" />
        </Button>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Merchant Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepper()}
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantModal;