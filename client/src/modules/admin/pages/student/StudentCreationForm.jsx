import React, { useState, useCallback } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, AlertCircle, CheckCircle2, UserPlus, GraduationCap, Building2, Calendar, Mail } from "lucide-react";



const StudentCreationForm = ({ onStudentCreated }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    college_name: "",
    college_email: "",
    university_name: "",
    college_start_month_year: "",
    college_end_month_year: "",
  });
  const [touched, setTouched] = useState({
    college_name: false,
    college_email: false,
    university_name: false,
    college_start_month_year: false,
    college_end_month_year: false,
  });
  const [errors, setErrors] = useState({
    college_name: "",
    college_email: "",
    university_name: "",
    college_start_month_year: "",
    college_end_month_year: "",
  });
  const [noUserFoundError, setNoUserFoundError] = useState("");
  const [loading, setLoading] = useState(false);

  // Email regex for validation
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

  // Validate form fields (memoized to prevent unnecessary re-renders)
  const validateForm = useCallback(() => {
    const newErrors = {
      college_name: formData.college_name.trim() ? "" : "College name is required",
      college_email: formData.college_email.trim()
        ? emailRegex.test(formData.college_email)
          ? ""
          : "Invalid email format"
        : "",
      university_name: formData.university_name.trim() ? "" : "University name is required",
      college_start_month_year: formData.college_start_month_year
        ? ""
        : "Start date is required",
      college_end_month_year: formData.college_end_month_year
        ? ""
        : "End date is required",
    };

    // Additional validation for end date not before start date
    if (
      formData.college_start_month_year &&
      formData.college_end_month_year &&
      new Date(formData.college_end_month_year) < new Date(formData.college_start_month_year)
    ) {
      newErrors.college_end_month_year = "End date cannot be before start date";
    }

    return newErrors;
  }, [formData]);

  // Check if form is valid for submit button
  const isFormValid = useCallback(() => {
    const newErrors = validateForm();
    return (
      selectedUser &&
      !newErrors.college_name &&
      !newErrors.college_email &&
      !newErrors.university_name &&
      !newErrors.college_start_month_year &&
      !newErrors.college_end_month_year
    );
  }, [selectedUser, validateForm]);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate on input change
    const newErrors = validateForm();
    setErrors((prevErrors) => {
      // Only update if errors have changed
      if (JSON.stringify(prevErrors) !== JSON.stringify(newErrors)) {
        return newErrors;
      }
      return prevErrors;
    });
  };

  // Handle input blur to mark as touched and validate
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate on blur
    const newErrors = validateForm();
    setErrors((prevErrors) => {
      // Only update if errors have changed
      if (JSON.stringify(prevErrors) !== JSON.stringify(newErrors)) {
        return newErrors;
      }
      return prevErrors;
    });
  };

  // Handle Search
  const handleSearch = async (e) => {
    e.preventDefault();
    setNoUserFoundError("");
    if (!searchQuery.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/search-user-for-service-provider?query=${encodeURIComponent(
          searchQuery
        )}`
      );
      if (response.data.success) {
        setSearchResults(response.data.data);
        if (response.data.data.length === 0) {
          setNoUserFoundError("No user found for the search");
        }
      } else {
        if (
          response.data.error &&
          response.data.message === "No user found for the search"
        ) {
          setNoUserFoundError("No user found for the search");
          setSearchResults([]);
        } else {
          setSearchResults([]);
        }
      }
    } catch (err) {
      if (
        err.response?.status === 404 &&
        err.response?.data?.message === "No user found for the search"
      ) {
        setNoUserFoundError("No user found for the search");
        setSearchResults([]);
      } else {

        setSearchResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Select User
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery("");
    setNoUserFoundError("");
    // Reset touched state when selecting a new user
    setTouched({
      college_name: false,
      college_email: false,
      university_name: false,
      college_start_month_year: false,
      college_end_month_year: false,
    });
    // Reset errors
    setErrors({
      college_name: "",
      college_email: "",
      university_name: "",
      college_start_month_year: "",
      college_end_month_year: "",
    });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      return;
    }

    const newErrors = validateForm();
    setErrors(newErrors);
    setTouched({
      college_name: true,
      college_email: true,
      university_name: true,
      college_start_month_year: true,
      college_end_month_year: true,
    });

    if (
      newErrors.college_name ||
      newErrors.college_email ||
      newErrors.university_name ||
      newErrors.college_start_month_year ||
      newErrors.college_end_month_year
    ) {
      console.log("Please fix the form errors", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/students/create-students-by-userid`,
        {
          user_id: selectedUser._id,
          college_email: formData.college_email.trim() || undefined,
          college_name: formData.college_name,
          university_name: formData.university_name,
          college_start_month_year: formData.college_start_month_year,
          college_end_month_year: formData.college_end_month_year,
        }
      );

      if (response.data.success) {
    
        setFormData({
          college_name: "",
          college_email: "",
          university_name: "",
          college_start_month_year: "",
          college_end_month_year: "",
        });
        setTouched({
          college_name: false,
          college_email: false,
          university_name: false,
          college_start_month_year: false,
          college_end_month_year: false,
        });
        setErrors({
          college_name: "",
          college_email: "",
          university_name: "",
          college_start_month_year: "",
          college_end_month_year: "",
        });
        setSelectedUser(null);
        if (onStudentCreated) {
          onStudentCreated();
        }
      } else {
        console.log(response.data.message || "Failed to create student profile", "error");
      }
    } catch (err) {
      console.log(
        err.response?.data?.message || "Error creating student: " + err.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Search Section */}
      {!selectedUser && (
        <div className="p-6">
          <div className="mb-4">
             <h2 className="text-xl font-bold text-[#0c1f4d] flex items-center gap-2">
                <Search className="w-5 h-5" />
                Find User for Student Profile
             </h2>
             <p className="text-sm text-gray-500 mt-1">Search by name, email, or phone number to assign a student role.</p>
          </div>
          <div>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter name, email, or phone..."
                  className="pl-10 h-11 text-sm border-gray-300 focus:border-[#0c1f4d] focus:ring-[#0c1f4d]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <Button type="submit" disabled={loading} className="h-11 px-6 bg-[#0c1f4d] hover:bg-[#153171] text-white transition-all shadow-sm">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 w-4 h-4" /> Searching
                  </>
                ) : (
                  <>
                    Search
                  </>
                )}
              </Button>
            </form>

            {noUserFoundError && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p>{noUserFoundError}</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Search Results</h3>
                <ScrollArea className="max-h-64 border rounded-lg shadow-sm">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors flex items-center justify-between group"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#0c1f4d]">{user.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email || "No email"}</span>
                          <span className="flex items-center gap-1">| {user.phone}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-[#0c1f4d] bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full px-4">
                        Select
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Form */}
      {selectedUser && (
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0c1f4d] flex items-center gap-2">
              <UserPlus className="w-6 h-6" />
              Create Student Profile
            </h2>
          </div>
          <div>
            <div className="mb-5 p-3.5 bg-blue-50 rounded-lg border border-blue-100 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
               <div>
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-0.5">Assigning to User</p>
                  <p className="font-semibold text-[#0c1f4d] text-base">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    {selectedUser.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedUser.email}</span>}
                    {selectedUser.email && <span className="text-gray-300">|</span>}
                    <span>{selectedUser.phone}</span>
                  </p>
               </div>
               <Button 
                 variant="outline" 
                 size="sm" 
                 onClick={() => setSelectedUser(null)}
                 className="text-xs border-blue-200 text-blue-700 hover:bg-blue-100 shrink-0 h-8"
               >
                 Change User
               </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* College Name */}
                <div className="space-y-1.5 relative">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-gray-400" /> College Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="college_name"
                    value={formData.college_name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="E.g., Engineering & Technology"
                    required
                    className={`h-11 text-sm transition-all focus:ring-1 ${touched.college_name && errors.college_name ? 'border-red-500 focus:border-red-500 focus:ring-red-200 pr-10' : 'border-gray-300 focus:border-[#0c1f4d] focus:ring-[#0c1f4d]'}`}
                  />
                  {touched.college_name && !errors.college_name && formData.college_name && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-3 top-[34px]" />
                  )}
                  {touched.college_name && errors.college_name && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs font-medium">
                       <AlertCircle className="w-3.5 h-3.5" />
                       <p>{errors.college_name}</p>
                    </div>
                  )}
                </div>

                {/* College Email */}
                <div className="space-y-1.5 relative">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Mail className="w-4 h-4 text-gray-400" /> College Email (Optional)
                  </Label>
                  <Input
                    type="email"
                    name="college_email"
                    value={formData.college_email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="student@college.edu"
                    className={`h-11 text-sm transition-all focus:ring-1 ${touched.college_email && errors.college_email ? 'border-red-500 focus:border-red-500 focus:ring-red-200 pr-10' : 'border-gray-300 focus:border-[#0c1f4d] focus:ring-[#0c1f4d]'}`}
                  />
                  {touched.college_email && !errors.college_email && formData.college_email && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-3 top-[34px]" />
                  )}
                  {touched.college_email && errors.college_email && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs font-medium">
                       <AlertCircle className="w-3.5 h-3.5" />
                       <p>{errors.college_email}</p>
                    </div>
                  )}
                </div>

                {/* University Name */}
                <div className="space-y-1.5 relative md:col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <GraduationCap className="w-4 h-4 text-gray-400" /> University Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="university_name"
                    value={formData.university_name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="E.g., Anna University"
                    required
                    className={`h-11 text-sm transition-all focus:ring-1 ${touched.university_name && errors.university_name ? 'border-red-500 focus:border-red-500 focus:ring-red-200 pr-10' : 'border-gray-300 focus:border-[#0c1f4d] focus:ring-[#0c1f4d]'}`}
                  />
                  {touched.university_name && !errors.university_name && formData.university_name && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-3 top-[34px]" />
                  )}
                  {touched.university_name && errors.university_name && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs font-medium">
                       <AlertCircle className="w-3.5 h-3.5" />
                       <p>{errors.university_name}</p>
                    </div>
                  )}
                </div>

                {/* Start Date */}
                <div className="space-y-1.5 relative">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" /> Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    name="college_start_month_year"
                    value={formData.college_start_month_year}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    className={`h-11 text-sm transition-all focus:ring-1 ${touched.college_start_month_year && errors.college_start_month_year ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#0c1f4d] focus:ring-[#0c1f4d]'}`}
                  />
                  {touched.college_start_month_year && errors.college_start_month_year && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs font-medium">
                       <AlertCircle className="w-3.5 h-3.5" />
                       <p>{errors.college_start_month_year}</p>
                    </div>
                  )}
                </div>

                {/* End Date */}
                <div className="space-y-1.5 relative">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" /> End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    name="college_end_month_year"
                    value={formData.college_end_month_year}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    disabled={!formData.college_start_month_year}
                    min={formData.college_start_month_year}
                    className={`h-11 text-sm transition-all focus:ring-1 ${touched.college_end_month_year && errors.college_end_month_year ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#0c1f4d] focus:ring-[#0c1f4d]'}`}
                  />
                  {touched.college_end_month_year && errors.college_end_month_year && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs font-medium">
                       <AlertCircle className="w-3.5 h-3.5" />
                       <p>{errors.college_end_month_year}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFormData({
                      college_name: "", college_email: "", university_name: "",
                      college_start_month_year: "", college_end_month_year: ""
                    });
                    setTouched({
                      college_name: false, college_email: false, university_name: false,
                      college_start_month_year: false, college_end_month_year: false
                    });
                  }}
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  Clear Form
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={loading || !isFormValid()}
                    className={`h-9 px-6 cursor-pointer text-sm transition-all shadow-sm ${!isFormValid() ? 'bg-gray-300' : 'bg-[#0c1f4d] hover:bg-[#153171] hover:-translate-y-0.5'} text-white rounded-md`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 w-4 h-4" /> Creating...
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Create Student
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCreationForm;