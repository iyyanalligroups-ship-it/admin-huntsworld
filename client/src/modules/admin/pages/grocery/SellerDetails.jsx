import React, { useState } from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { FileText, MessageSquare, Trash2, Pencil } from 'lucide-react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useSelectedUser } from '../../context/SelectedUserContext';
import { useNavigate } from 'react-router-dom';

const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const SellerDetails = ({ seller, onClose }) => {
  const [requirements, setRequirements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRequirements, setShowRequirements] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState(null);
  const [requirementToEdit, setRequirementToEdit] = useState(null);
  const [formData, setFormData] = useState({});
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();

  const fetchRequirements = async () => {
    if (!seller.user_id?._id) {
      setError('Invalid user ID');
      console.error('Invalid user ID:', seller.user_id);
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowRequirements(true);

    try {
      console.log('Fetching requirements for user ID:', seller.user_id._id);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/grocery-seller-requirement/fetch-all-grocery-seller-requirement-user-id/${seller.user_id._id}`
      );
      console.log('API Response:', response.data);
      if (response.data.success) {
        setRequirements(response.data.data || []);
      } else if (response.data.message === 'No requirements found for this user') {
        setRequirements([]);
      } else {
        setError(response.data.message || 'Failed to fetch requirements');
        console.error('API Error:', response.data.message);
      }
    } catch (err) {
      setError('Error fetching requirements: ' + err.message);
      console.error('Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const hideRequirements = () => {
    setShowRequirements(false);
    setRequirements([]);
    setError(null);
  };

  const confirmDelete = (reqId) => {
    setRequirementToDelete(reqId);
    setShowConfirmDialog(true);
  };
  const handleCardClick = (seller) => {
    console.log(seller, 'seller chat info');
    setSelectedUser(seller);
    navigate('/admin-dashboard/chat');
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setRequirementToDelete(null);
  };

  const handleDelete = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/grocery-seller-requirement/delete-grocery-seller-requirement/${requirementToDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequirements(requirements.filter(req => req._id !== requirementToDelete));
      setShowConfirmDialog(false);
      setRequirementToDelete(null);
    } catch (err) {
      console.error('Delete Requirement Error:', err);
      setError('Failed to delete requirement: ' + err.message);
    }
  };

  const startEdit = (req) => {
    setFormData({
      product_or_service: req.product_or_service,
      quantity: req.quantity,
      unit_of_measurement: req.unit_of_measurement,
      phone_number: req.phone_number,
      supplier_preference: req.supplier_preference,
      selected_states: req.selected_states || [],
    });
    setRequirementToEdit(req._id);
    setShowEditDialog(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === 'supplier_preference' && value !== 'Specific States') {
        newData.selected_states = [];
      }
      return newData;
    });
  };

  const handleStatesChange = (e) => {
    const values = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, selected_states: values }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/grocery-seller-requirement/update-grocery-seller-requirement/${requirementToEdit}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setRequirements((prev) =>
          prev.map((req) => (req._id === requirementToEdit ? response.data.data : req))
        );
        setShowEditDialog(false);
        setRequirementToEdit(null);
        setFormData({});
      } else {
        setError(response.data.message || 'Failed to update requirement');
      }
    } catch (err) {
      console.error('Update Requirement Error:', err);
      setError('Failed to update requirement: ' + err.message);
    }
  };

  return (
    <div className="mt-1 p-4 sm:p-6  rounded-xl max-w-full relative mx-auto">
      {/* <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Close"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button> */}
      {/* <h3 className="text-xl font-semibold mb-4 text-gray-800">Seller Details</h3> */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Left Side Card */}
        <div className="w-full lg:w-1/3 bg-gray-50 p-4 rounded-lg shadow-sm">
          {seller.company_logo && (
            <Zoom>
              <img
                src={seller.company_logo}
                alt="Company Logo"
                className="w-24 h-24 object-cover rounded-md mb-2 mx-auto cursor-pointer"
              />
            </Zoom>
          )}
          <h4 className="text-lg font-medium text-gray-800 text-center">
            {seller.shop_name || 'N/A'}
          </h4>
          <p className="text-gray-600 text-center text-sm">
            {seller.shop_email || 'N/A'}
          </p>
          <div className="mt-4 space-y-2 text-gray-600 text-sm">
            <p><strong>Phone:</strong> {seller.shop_phone_number || 'N/A'}</p>
            <p>
              <strong>{seller.pan ? 'PAN' : seller.msme_certificate_number ? 'MSME' : 'GST'}:</strong>{' '}
              {seller.pan || seller.msme_certificate_number || seller.gst_number || 'N/A'}
            </p>
            <p><strong>Aadhar:</strong> {seller.aadhar || 'N/A'}</p>
          </div>
          {seller.company_images?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">Images:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {seller.company_images.map((image, index) => (
                  <Zoom key={index}>
                    <img
                      src={image}
                      alt={`Company Image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-md cursor-pointer"
                    />
                  </Zoom>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              className="flex items-center justify-center bg-[#0c1f4d] hover:bg-[#153171] text-white py-2 px-4 rounded-md w-full sm:w-auto"
              onClick={() => handleCardClick(seller)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Seller
            </button>

          </div>
        </div>

        {/* Right Side (Requirements Table or Details) */}
        <div className="w-full lg:w-2/3 bg-gray-50 p-4 rounded-lg shadow-sm">
          {showRequirements ? (
            <div className="overflow-x-auto">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Seller Requirements</h4>
              {error && error !== 'No requirements found for this user' && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              {isLoading ? (
                <p className="text-gray-600">Loading requirements...</p>
              ) : requirements.length === 0 ? (
                <p className="text-gray-600">No requirements found for this user.</p>
              ) : (
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-[5%]">S.No</TableHead>
                        <TableHead className="text-center w-[15%]">Product/Service</TableHead>
                        <TableHead className="text-center w-[10%]">Quantity</TableHead>
                        <TableHead className="text-center w-[10%]">Phone Number</TableHead>
                        <TableHead className="text-center w-[15%]">Supplier Preference</TableHead>
                        <TableHead className="text-center w-[15%]">Selected States</TableHead>
                        <TableHead className="text-center w-[15%]">Created At</TableHead>
                        <TableHead className="text-center w-[15%]">Expires At</TableHead>
                        <TableHead className="text-center w-[10%]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requirements.map((req, index) => (
                        <TableRow key={req._id}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell className="text-center">{req.product_or_service || 'N/A'}</TableCell>
                          <TableCell className="text-center">{req.quantity} {req.unit_of_measurement || 'N/A'}</TableCell>
                          <TableCell className="text-center">{req.phone_number || 'N/A'}</TableCell>
                          <TableCell className="text-center">{req.supplier_preference || 'N/A'}</TableCell>
                          <TableCell className="text-center">{req.selected_states?.join(', ') || 'N/A'}</TableCell>
                          <TableCell className="text-center">{new Date(req.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-center">{new Date(req.expiresAt).toLocaleString()}</TableCell>
                          <TableCell className="text-center flex justify-center items-center gap-2">
                            <Pencil
                              className="h-5 w-5 text-blue-600 hover:text-blue-700 cursor-pointer"
                              onClick={() => startEdit(req)}
                            />
                            <Trash2
                              className="h-5 w-5 text-red-600 hover:text-red-700 cursor-pointer"
                              onClick={() => confirmDelete(req._id)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-gray-600">
              <p><strong>Verified:</strong> {seller.verified_status ? 'Yes' : 'No'}</p>
              {seller.user_id && (
                <p><strong>User ID:</strong> {seller.user_id._id || 'N/A'}</p>
              )}
              {seller.address_id && (
                <p><strong>Address ID:</strong> {seller.address_id._id || 'N/A'}</p>
              )}
              {!seller.pan && (
                <p><strong>PAN:</strong> {seller.pan || 'N/A'}</p>
              )}
              {!seller.msme_certificate_number && (
                <p><strong>MSME Certificate:</strong> {seller.msme_certificate_number || 'N/A'}</p>
              )}
              {!seller.gst_number && (
                <p><strong>GST Number:</strong> {seller.gst_number || 'N/A'}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Delete */}
      {showConfirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800/60">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Confirm Deletion</h3>
            <p className="mb-4 text-gray-600">Are you sure you want to delete this requirement?</p>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={cancelDelete}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800/60">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Edit Requirement</h3>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product/Service</label>
                  <input
                    type="text"
                    name="product_or_service"
                    value={formData.product_or_service || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-slate-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="e.g. Rice"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-slate-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="e.g. 100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit of Measurement</label>
                  <input
                    type="text"
                    name="unit_of_measurement"
                    value={formData.unit_of_measurement || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-slate-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="e.g. Kg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-slate-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier Preference</label>
                  <select
                    name="supplier_preference"
                    value={formData.supplier_preference || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border-2 border-slate-300 rounded-md shadow-sm px-3 py-2"
                    required
                  >
                    <option value="All India">All India</option>
                    <option value="Near Me">Near Me</option>
                    <option value="Specific States">Specific States</option>
                  </select>
                </div>
                {formData.supplier_preference === 'Specific States' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Selected States</label>
                    <select
                      multiple
                      name="selected_states"
                      value={formData.selected_states || []}
                      onChange={handleStatesChange}
                      className="mt-1 block w-full border-2 border-slate-300 rounded-md shadow-sm px-3 py-2"
                    >
                      {indianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  onClick={() => {
                    setShowEditDialog(false);
                    setRequirementToEdit(null);
                  }}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDetails;
