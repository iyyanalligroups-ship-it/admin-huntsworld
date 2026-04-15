import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  RefreshCw,
  MoreVertical,
  Trash2,
  Upload,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  FileText,
  UserCheck,
  School,
  Mail,
  Phone,
  Shield,
  Calendar,
  Eye,
  Building2,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Save,
  Edit2,
  MapPin,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Country, State, City } from "country-state-city";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DeleteDialog from "@/model/DeleteModel";
import { Label } from "@/components/ui/label";
import showToast from "@/toast/showToast";
import StudentCreationForm from "./StudentCreationForm";

function AllStudents() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedCollegeName, setSelectedCollegeName] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [formData, setFormData] = useState({
    college_email: "",
    college_name: "",
    university_name: "",
    college_start_month_year: "",
    college_end_month_year: "",
    id_card: "",
  });
  const [idCardImage, setIdCardImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageJustUploaded, setIsImageJustUploaded] = useState(false);
  const itemsPerPage = 10;
  const [loadingStudents, setLoadingStudents] = useState({});
  const fileInputRef = useRef(null);
  const detailsCardRef = useRef(null);
  const editCardRef = useRef(null);

  // Address Management State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);
  const [isDeleteAddressModalOpen, setIsDeleteAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const toTitleCase = (str = "") =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (addressForm.country) {
      setStates(State.getStatesOfCountry(addressForm.country));
    } else {
      setStates([]);
    }
  }, [addressForm.country]);

  useEffect(() => {
    if (addressForm.country && addressForm.state) {
      const baseCities = City.getCitiesOfState(addressForm.country, addressForm.state) || [];
      const currentCity = addressForm.city || "";
      const hasCity = baseCities.some((ci) => ci.name.toLowerCase() === currentCity.toLowerCase());
      const finalCities = hasCity ? baseCities : [...baseCities, { name: toTitleCase(currentCity) }];
      const seen = new Set();
      const dedupedCities = finalCities.filter((ci) => {
        const key = (ci?.name || "").toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCities(dedupedCities);
    } else {
      setCities([]);
    }
  }, [addressForm.country, addressForm.state]);

  const handleEditAddressClick = () => {
    if (selectedStudent.address) {
      const addr = selectedStudent.address;
      const allCountries = Country.getAllCountries();
      const countryObj = allCountries.find(
        (c) => c.name.toLowerCase() === (addr.country || "").toLowerCase()
      ) || null;
      
      const countryIsoCode = countryObj?.isoCode || "";
      const allStates = countryIsoCode ? State.getStatesOfCountry(countryIsoCode) : [];
      const stateObj = allStates.find(
        (s) => s.name.toLowerCase() === (addr.state || "").toLowerCase()
      ) || null;

      let canonicalCity = addr.city || "";
      if (countryIsoCode && stateObj?.isoCode) {
        const baseCities = City.getCitiesOfState(countryIsoCode, stateObj.isoCode) || [];
        const match = baseCities.find(
          (ci) => ci.name.toLowerCase() === (addr.city || "").toLowerCase()
        );
        canonicalCity = match ? match.name : toTitleCase(addr.city);
      }

      setAddressForm({
        address_line_1: addr.address_line_1 || "",
        address_line_2: addr.address_line_2 || "",
        city: canonicalCity,
        state: stateObj?.isoCode || "",
        country: countryIsoCode,
        pincode: addr.pincode || "",
      });
    } else {
      setAddressForm({
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        country: "IN",
        pincode: "",
      });
    }
    setIsEditingAddress(true);
  };

  const isAddressFormValid = () => {
    return (
      addressForm.address_line_1.trim() !== "" &&
      addressForm.city.trim() !== "" &&
      addressForm.state.trim() !== "" &&
      addressForm.country.trim() !== "" &&
      addressForm.pincode.trim() !== ""
    );
  };

  const handleAddressSave = async () => {
    if (!isAddressFormValid()) {
      showToast("Please fill all required fields", "warning");
      return;
    }
    try {
      const countryObj = countries.find(c => c.isoCode === addressForm.country);
      const stateObj = states.find(s => s.isoCode === addressForm.state);

      const payload = {
        ...addressForm,
        country: countryObj ? countryObj.name : addressForm.country,
        state: stateObj ? stateObj.name : addressForm.state,
        user_id: selectedStudent.user_id?._id || selectedStudent.user_id,
        entity_type: "student",
        address_type: "company",
      };

      const token = sessionStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (selectedStudent.address?._id) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/address/update-address/${payload.user_id}/${selectedStudent.address._id}`,
          payload,
          config
        );
        showToast("Address updated successfully", "success");
      } else {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/address/create-address`, payload, config);
        const newAddressId = response.data.address?._id || response.data.data?._id;
        
        // Explicitly link address to student profile
        if (newAddressId) {
          await axios.put(
            `${import.meta.env.VITE_API_URL}/students/update-student/${selectedStudent._id}`,
            { address_id: newAddressId },
            config
          );
        }
        showToast("Address created successfully", "success");
      }
      setIsEditingAddress(false);
      fetchStudents();
    } catch (error) {
      console.error("Error saving address:", error);
      showToast(error.response?.data?.message || "Failed to save address", "error");
    }
  };

  const handleAddressDeleteClick = () => {
    setIsDeleteAddressModalOpen(true);
  };

  const confirmDeleteAddress = async () => {
    try {
      setIsDeletingAddress(true);
      const userId = selectedStudent.user_id?._id || selectedStudent.user_id;
      const addressId = selectedStudent.address._id;
      const token = sessionStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/address/delete-address-addressId-userId/${userId}/${addressId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Address deleted successfully", "success");
      setIsDeleteAddressModalOpen(false);
      fetchStudents();
    } catch (error) {
      console.error("Error deleting address:", error);
      showToast("Failed to delete address", "error");
    } finally {
      setIsDeletingAddress(false);
    }
  };

  useEffect(() => {
    fetchStudents();

    // Real-time notifications for students
    const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/admin-notifications`, {
      reconnection: true,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Student List] Socket connected');
    });

    socket.on('new-student', () => {
      console.log('[Student List] New student event received, refreshing...');
      fetchStudents();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleMarkAsRead = async (studentId) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/students/mark-read/${studentId}`);
      fetchStudents();
    } catch (err) {
      console.error("Error marking student as read:", err);
    }
  };

  useEffect(() => {
    if (selectedStudent && detailsCardRef.current) {
      detailsCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (editingStudent && editCardRef.current) {
      editCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [editingStudent]);

  useEffect(() => {
    const filtered = students.filter(
      (student) =>
        (student.college_email?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (student.user_id?.toString() || "").includes(searchTerm) ||
        (student.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/students/fetch-students`
      );
      const studentData = Array.isArray(response.data) ? response.data : [];

      const studentsWithDetails = await Promise.all(
        studentData.map(async (student) => {
          try {
            const userResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/users/fetch-user-name-by-id/${student.user_id}`
            );
            return {
              ...student,
              name: userResponse.data.name || "N/A",
              isActive: userResponse.data.isActive ?? true,
            };
          } catch (error) {
            console.error(`Error fetching user for student ${student._id}:`, error);
            return {
              ...student,
              name: "N/A",
              isActive: true,
            };
          }
        })
      );

      setStudents(studentsWithDetails);
      setFilteredStudents(studentsWithDetails);

      // Sync selectedStudent if details modal is open
      if (selectedStudent) {
        const updated = studentsWithDetails.find(s => s._id === selectedStudent._id);
        if (updated) {
          setSelectedStudent(updated);
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to fetch students", "error");
    }
  };

  const handleViewDetails = async (studentId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/students/fetch-students-by-id/${studentId}`
      );
      const student = response.data;

      const userResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/fetch-user-name-by-id/${student.user_id}`
      );

      setSelectedStudent({
        ...student,
        name: userResponse.data.name || "N/A",
        user_id: {
          ...student.user_id,
          user_code: userResponse.data.user_code || null,   // or user_code if renamed
        },
      });
      setIdCardImage(student.id_card || null);

      // Automatically mark as read when viewing details
      if (student.markAsRead !== true) {
        handleMarkAsRead(student._id);
      }
    } catch (error) {
      setIdCardImage(null);
      setSelectedStudent(null);
      showToast(
        error.response?.data?.message || "Failed to fetch student details",
        "error"
      );
    }
  };

  const handleEdit = async (studentId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/students/fetch-students-by-id/${studentId}`
      );
      const student = response.data;

      const userResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/fetch-user-name-by-id/${student.user_id}`
      );

      setEditingStudent({ ...student, name: userResponse.data.name || "N/A" });
      setSelectedStudent(null);

      // Automatically mark as read when editing
      if (student.markAsRead !== true) {
        handleMarkAsRead(student._id);
      }

      setFormData({
        college_email: student.college_email || "",
        college_name: student.college_name || "",
        university_name: student.university_name || "",
        college_start_month_year: student.college_start_month_year
          ? new Date(student.college_start_month_year).toISOString().split("T")[0]
          : "",
        college_end_month_year: student.college_end_month_year
          ? new Date(student.college_end_month_year).toISOString().split("T")[0]
          : "",
        id_card: student.id_card || "",
      });
      setSelectedFile(null);
      setIdCardImage(student.id_card || null);
      setIsImageJustUploaded(false);
      showToast(`Editing student ID: ${studentId}`, "info");
    } catch (error) {
      setIdCardImage(null);
      showToast(
        error.response?.data?.message || "Failed to fetch student for edit",
        "error"
      );
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      showToast(
        `File selected: ${file.name}. Click "Upload ID Card" to save.`,
        "info"
      );
    } else {
      showToast("Please select a valid image file", "error");
      e.target.value = "";
    }
  };

  const preloadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error("Failed to load image"));
    });
  };

  const handleIdCardUpload = async () => {
    if (!selectedFile) {
      showToast("Please select an image file first", "error");
      return;
    }

    const trimmedCollegeName = formData.college_name.trim();
    if (!trimmedCollegeName) {
      showToast(
        "College name is required and cannot be empty or just whitespace",
        "error"
      );
      return;
    }

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("id_card_image", selectedFile);
    formDataUpload.append("college_name", trimmedCollegeName);

    try {
      let logoUrl = null;
      const existingIdCard = editingStudent?.id_card;
      
      console.log("Starting ID card upload for:", trimmedCollegeName);

      if (existingIdCard && !isImageJustUploaded) {
        // Use PUT if it's an existing ID card that wasn't JUST uploaded in this session
        const response = await axios.put(
          `${import.meta.env.VITE_API_IMAGE_URL}/student-images/id-card/update/${trimmedCollegeName}`,
          formDataUpload,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        logoUrl = response.data?.logoUrl;
        console.log("ID card updated, logoUrl:", logoUrl);
        showToast("ID card updated successfully", "success");
      } else {
        // Use POST for first-time upload or if it was just deleted
        const response = await axios.post(
          `${import.meta.env.VITE_API_IMAGE_URL}/student-images/id-card/upload`,
          formDataUpload,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        logoUrl = response.data?.logoUrl;
        console.log("ID card uploaded, logoUrl:", logoUrl);
        showToast("ID card uploaded successfully", "success");
      }

      if (!logoUrl) {
        throw new Error("The server did not return a valid image URL (logoUrl is missing)");
      }

      if (!logoUrl.startsWith("http")) {
        throw new Error(`The server returned an invalid URL format: ${logoUrl}`);
      }

      await preloadImage(logoUrl);
      
      setFormData((prev) => ({ ...prev, id_card: logoUrl }));
      setIdCardImage(logoUrl);
      setIsImageJustUploaded(true);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error) {
      console.error("Full upload error object:", error);
      const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred during upload";
      showToast(errorMessage, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleIdCardDelete = async () => {
    const trimmedCollegeName = formData.college_name.trim();
    if (!trimmedCollegeName) {
      showToast("Please enter a college name before deleting", "error");
      return;
    }

    setIsUploading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_IMAGE_URL}/student-images/id-card/delete`,
        { college_name: trimmedCollegeName }
      );
      showToast("ID card deleted successfully", "success");
      setFormData((prev) => ({ ...prev, id_card: "" }));
      setIdCardImage(null);
    } catch (error) {
      if (error.response?.status === 404) {
        // Image already missing on server, clear it locally anyway
        setFormData((prev) => ({ ...prev, id_card: "" }));
        setIdCardImage(null);
        showToast("ID card removed", "success");
      } else {
        showToast(
          error.response?.data?.message || "Failed to delete ID card",
          "error"
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    const trimmedCollegeName = formData.college_name.trim();
    if (!trimmedCollegeName) {
      showToast(
        "College name is required and cannot be empty or just whitespace",
        "error"
      );
      return;
    }
    if (formData.college_start_month_year && formData.college_end_month_year) {
      const startDate = new Date(formData.college_start_month_year);
      const endDate = new Date(formData.college_end_month_year);
      if (endDate < startDate) {
        showToast("End date cannot precede the start date", "error");
        return;
      }
    }
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/students/update-student/${editingStudent.user_id}`,
        { ...formData, college_name: trimmedCollegeName }
      );
      showToast("Student updated successfully", "success");
      fetchStudents();
      setEditingStudent(null);
      setIdCardImage(null);
      setSelectedFile(null);
      setIsImageJustUploaded(false);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update student",
        "error"
      );
    }
  };

  const confirmDelete = (
    studentId,
    user_id,
    addressId,
    collegeName,
    student
  ) => {
    setSelectedStudentId(studentId);
    setSelectedAddressId(addressId);
    setSelectedCollegeName(student.college_name);
    setSelectedUserId(user_id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/students/delete-students-by-id/${selectedStudentId}`
      );
      showToast("Student deleted successfully", "success");

      if (selectedAddressId) {
        try {
          await axios.delete(
            `${import.meta.env.VITE_API_URL}/address/delete-address-addressId-userId/${selectedUserId}/${selectedAddressId}`
          );
        } catch (err) {
          console.warn("Address delete failed:", err.message);
        }
      }

      if (selectedCollegeName) {
        try {
          await axios.post(
            `${import.meta.env.VITE_API_IMAGE_URL}/student-images/id-card/delete`,
            { college_name: selectedCollegeName }
          );
        } catch (err) {
          console.warn("Image delete failed:", err.message);
        }
      }

      fetchStudents();

      setIsDeleteDialogOpen(false);
      setSelectedStudentId(null);
      setSelectedAddressId(null);
      setSelectedCollegeName(null);
      setSelectedUserId(null);
      setIdCardImage(null);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to delete student record",
        "error"
      );
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
  };

  const handleStudentCreated = () => {
    fetchStudents();
    setIsAddModalOpen(false);
    showToast("Student created successfully", "success");
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    showToast(`Navigated to page ${pageNumber}`, "info");
  };

  const handleToggleStatus = async (student) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/students/toggle/${student._id}`
      );

      if (response.data.success) {
        const statusMessage = response.data.verified
          ? `${student.name || "Student"} marked as Verified ✅`
          : `${student.name || "Student"} marked as Unverified ❌`;

        showToast(
          statusMessage,
          response.data.verified ? "success" : "warning"
        );

        setFilteredStudents((prevStudents) =>
          prevStudents.map((s) =>
            s._id === student._id
              ? { ...s, verified: response.data.verified }
              : s
          )
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update verification status", "error");
    }
  };

  const handleToggle = async (userId) => {
    setLoadingStudents((prev) => ({ ...prev, [userId]: true }));

    try {
      const token = sessionStorage.getItem("token");

      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/toggle-status/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newActiveState = res.data.isActive;

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.user_id === userId
            ? { ...student, isActive: newActiveState }
            : student
        )
      );
      showToast(res.data.message, "success");
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Failed to update status", "error");
    } finally {
      setLoadingStudents((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  return (
    <div className="min-h-screen lg:p-4 max-w-7xl mx-auto">
      <div className="min-h-screen sm:p-6 lg:p-8 max-w-[95vw] sm:max-w-7xl mx-auto">

        <div className="xl:col-span-1">

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
              Student Protocol
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Administrative guidelines for managing student identities and access.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-2 space-y-4 mb-4 md:space-y-0">

            <Card className="border-l-4 border-l-indigo-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <School size={16} className="text-indigo-600" />
                  1. Institutional KYC
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  The <span className="font-bold">Verified Switch</span> confirms the student is currently enrolled.
                  <br /><br />
                  Validate via <span className="font-semibold">College Email</span> domain or ID card before enabling.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <UserCheck size={16} className="text-emerald-600" />
                  2. Access Governance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                    <span><strong>Active:</strong> Student can access platform features.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                    <span><strong>Inactive:</strong> Use for graduated students or disciplinary suspensions.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <FileText size={16} className="text-amber-600" />
                  3. Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ensure <span className="font-semibold">College Email</span> is unique.
                  <br />
                  <strong>Delete</strong> is permanent and removes the student's order history and saved preferences.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>

        <h1 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 w-36 rounded-r-2xl font-bold">
          Student List
        </h1>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-4 mb-6">
          <Input
            type="text"
            placeholder="Search by name, email, or ID..."
            className="w-full sm:w-1/2 md:w-1/3 rounded-md border-gray-300 focus:ring-2 focus:ring-gray-900 text-sm py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center bg-[#0c1f4d] cursor-pointer hover:bg-[#0c204ddc] text-white rounded-md text-sm px-4 py-2"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Student
            </Button>
            <Button
              onClick={fetchStudents}
              className="flex items-center bg-[#0c1f4d] cursor-pointer hover:bg-[#0c204ddc] text-white rounded-md text-sm px-4 py-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {currentItems.length > 0 ? (
            currentItems.map((student, index) => (
              <Card key={student._id} className="border rounded-lg shadow-sm hover:bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                      {student.name || "N/A"}
                      {student.markAsRead !== true && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(student._id)}>
                          View Details
                        </DropdownMenuItem>
                        {student.markAsRead !== true && (
                          <DropdownMenuItem onClick={() => handleMarkAsRead(student._id)} className="text-blue-600">
                            Mark as Read
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => handleToggle(student.user_id)}
                          disabled={loadingStudents[student.user_id]}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {loadingStudents[student.user_id] ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : student.isActive ? (
                            <>
                              <ToggleLeft className="h-4 w-4 text-red-600" />
                              Deactivate Account
                            </>
                          ) : (
                            <>
                              <ToggleRight className="h-4 w-4 text-green-600" />
                              Activate Account
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(student._id)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => confirmDelete(student._id, student.user_id, student.address_id, student.college_name, student)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">S.No:</span> {indexOfFirstItem + index + 1}</p>
                    <p className="truncate"><span className="font-medium">Email:</span> {student.college_email || "N/A"}</p>
                    <p><span className="font-medium">Verified Status:</span> {student.verified ? "Yes" : "No"}</p>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={student.isActive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {student.isActive ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-600 py-8">No students found</p>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#0c1f4d] border-b hover:bg-[#153171] border-gray-300 text-white">
                <TableHead className="text-sm font-medium text-white py-3">
                  S.No
                </TableHead>
                <TableHead className="text-sm font-medium text-white py-3">
                  Name
                </TableHead>
                <TableHead className="text-sm font-medium text-white py-3">
                  College Email
                </TableHead>
                <TableHead className="text-sm font-medium text-white py-3">
                  Account Status
                </TableHead>
                <TableHead className="text-sm font-medium text-white py-3">
                  Verified Status
                </TableHead>
                <TableHead className="text-sm font-medium text-white py-3">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((student, index) => (
                  <TableRow key={student._id} className="hover:bg-gray-50">
                    <TableCell className="text-sm text-gray-600 py-3">
                      {indexOfFirstItem + index + 1}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 py-3 truncate max-w-[150px]">
                      <div className="flex items-center gap-2">
                        {student.name || "N/A"}
                        {student.markAsRead !== true && (
                          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                            New
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 py-3 truncate max-w-[200px]">
                      {student.college_email || "N/A"}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${student.isActive ? "bg-green-500" : "bg-red-500"}`} />
                        <span className={`text-xs font-medium ${student.isActive ? "text-green-700" : "text-red-700"}`}>
                          {student.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Switch
                        checked={student.verified}
                        onCheckedChange={() => handleToggleStatus(student)}
                        className="data-[state=checked]:bg-green-600 cursor-pointer data-[state=unchecked]:bg-red-600"
                        thumbIcon={
                          student.verified ? (
                            <ToggleRight className="h-4 w-4 text-white" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-white" />
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <MoreVertical className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-md shadow-lg bg-white z-50">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(student._id)}
                            className="text-sm text-gray-700 hover:bg-gray-100 px-4 py-2"
                          >
                            View Details
                          </DropdownMenuItem>
                          {student.markAsRead !== true && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsRead(student._id)}
                              className="text-sm text-blue-600 hover:bg-blue-50 px-4 py-2"
                            >
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="cursor-pointer p-1"
                          >
                            <button
                              onClick={() => handleToggle(student.user_id)}
                              disabled={loadingStudents[student.user_id]}
                              className={`w-full flex items-center gap-2 px-3 py-2 font-medium
                                ${student.isActive
                                  ? 'text-red-500'
                                  : 'text-green-500'
                                }
                                ${loadingStudents[student.user_id] ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md hover:scale-[1.02]'}
                              `}
                            >
                              {loadingStudents[student.user_id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : student.isActive ? (
                                <><ToggleLeft className="h-4 w-4" /> Deactivate Account</>
                              ) : (
                                <><ToggleRight className="h-4 w-4" /> Activate Account</>
                              )}
                            </button>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(student._id)}
                            className="text-sm text-gray-700 hover:bg-gray-100 px-4 py-2"
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              confirmDelete(
                                student._id,
                                student.user_id,
                                student.address_id,
                                student.college_name,
                                student
                              )
                            }
                            className="text-sm text-red-600 hover:bg-red-50 px-4 py-2"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-4 text-sm text-gray-600"
                  >
                    No students found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-4">
              <Button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-sm px-4 py-2 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-sm px-4 py-2 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Student Details Dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent
            className="p-0 flex flex-col overflow-hidden bg-white rounded-xl shadow-2xl [&>button]:hidden"
            style={{
              width: "80vw",
              maxWidth: "80vw",
              height: "80vh",
              maxHeight: "80vh",
            }}
          >
            {/* Header - fixed, does not scroll */}
            <DialogHeader className="shrink-0 px-6 py-5 bg-gradient-to-r from-[#0c1f4d] to-[#153171] text-white">
              <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                Student Details
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-white hover:bg-white/20 cursor-pointer rounded-full p-1 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </DialogTitle>
            </DialogHeader>

            {/* Scrollable content area - this is the only part that scrolls */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              {selectedStudent && (
                <div className="space-y-8">
                  {/* Student Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-5 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Name:</span>
                        <p className="mt-1 text-gray-900 font-medium">{selectedStudent.name || "N/A"}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">College Email:</span>
                        <p className="mt-1 text-gray-900 break-all">{selectedStudent.college_email || "N/A"}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">College Name:</span>
                        <p className="mt-1 text-gray-900">{selectedStudent.college_name || "N/A"}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">University:</span>
                        <p className="mt-1 text-gray-900">{selectedStudent.university_name || "N/A"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-semibold text-gray-700">College Start Date:</span>
                          <p className="mt-1 text-gray-900">
                            {selectedStudent.college_start_month_year
                              ? new Date(selectedStudent.college_start_month_year).toLocaleDateString("en-IN", { month: 'short', year: 'numeric' })
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">College End Date:</span>
                          <p className="mt-1 text-gray-900">
                            {selectedStudent.college_end_month_year
                              ? new Date(selectedStudent.college_end_month_year).toLocaleDateString("en-IN", { month: 'short', year: 'numeric' })
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Expiry Date:</span>
                        <p className="mt-1 text-gray-900">
                          {selectedStudent.expiry_date
                            ? new Date(selectedStudent.expiry_date).toLocaleDateString("en-IN")
                            : selectedStudent.college_end_month_year
                            ? new Date(selectedStudent.college_end_month_year).toLocaleDateString("en-IN")
                            : "N/A"}
                        </p>
                      </div>

                      {/* Verified Status Toggle */}
                      <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                        <span className="font-semibold text-gray-700">Verified Status:</span>
                        {/* <Switch
                          checked={selectedStudent.verified}
                          onCheckedChange={() => handleToggleStatus(selectedStudent)}
                          className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600"
                        /> */}
                        <span className="text-sm font-medium">
                          {selectedStudent.verified ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <ToggleRight className="h-4 w-4" /> Verified
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <ToggleLeft className="h-4 w-4" /> Not Verified
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* ID Card Image */}
                    <div className="flex flex-col items-center">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">ID Card</h3>
                      {idCardImage ? (
                        <Zoom>
                          <img
                            src={idCardImage}
                            alt="Student ID Card"
                            className="w-full max-w-sm h-auto rounded-lg shadow-lg border border-gray-300 cursor-zoom-in transition-transform hover:scale-105"
                            onError={() => {
                              setIdCardImage(null);
                              showToast("Failed to load ID card image", "error");
                            }}
                          />
                        </Zoom>
                      ) : (
                        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl w-80 h-52 flex items-center justify-center">
                          <p className="text-gray-500 text-center">No ID card uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Company Address Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="bg-[#0c1f4d]/10 p-2 rounded-lg">
                          <MapPin className="w-5 h-5 text-[#0c1f4d]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#0c1f4d]">Business Location</h3>
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Company Address Details</p>
                        </div>
                      </div>
                      {!isEditingAddress && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditAddressClick}
                          className="flex items-center gap-2 text-xs font-semibold border-indigo-100 text-[#0c1f4d] hover:bg-indigo-50 hover:text-indigo-700 transition-all rounded-full px-4"
                        >
                          {selectedStudent.address ? <Edit2 size={13} /> : <PlusCircle size={13} />}
                          {selectedStudent.address ? "Edit Address" : "Add Address"}
                        </Button>
                      )}
                    </div>
                    <div className="p-6">
                      {isEditingAddress ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="address_line_1" className="text-xs font-bold text-gray-700 uppercase tracking-tight">Address Line 1</Label>
                              <Input
                                id="address_line_1"
                                value={addressForm.address_line_1}
                                onChange={(e) => setAddressForm({ ...addressForm, address_line_1: e.target.value })}
                                placeholder="Street address, P.O. box"
                                className=" border-gray-200 focus:ring-[#0c1f4d] focus:border-[#0c1f4d]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address_line_2" className="text-xs font-bold text-gray-700 uppercase tracking-tight">Address Line 2 (Optional)</Label>
                              <Input
                                id="address_line_2"
                                value={addressForm.address_line_2}
                                onChange={(e) => setAddressForm({ ...addressForm, address_line_2: e.target.value })}
                                placeholder="Apartment, suite, unit, etc."
                                className=" border-gray-200 focus:ring-[#0c1f4d] focus:border-[#0c1f4d]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="country_select" className="text-xs font-bold text-gray-700 uppercase tracking-tight">Country</Label>
                              <Select
                                value={addressForm.country}
                                onValueChange={(value) => setAddressForm({ ...addressForm, country: value, state: "", city: "" })}
                              >
                                <SelectTrigger className="w-full h-12 bg-white border-gray-200 focus:ring-[#0c1f4d]">
                                  <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 bg-white z-[100] shadow-2xl border-gray-200">
                                  {countries
                                    .filter((c) => c.isoCode && c.isoCode.trim() !== "")
                                    .map((c) => (
                                      <SelectItem key={c.isoCode} value={c.isoCode} className="focus:bg-indigo-50">
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="state_select" className="text-xs font-bold text-gray-700 uppercase tracking-tight">State</Label>
                              <Select
                                value={addressForm.state}
                                onValueChange={(value) => setAddressForm({ ...addressForm, state: value, city: "" })}
                                disabled={!states.length}
                              >
                                <SelectTrigger className="w-full h-12 bg-white border-gray-200 focus:ring-[#0c1f4d]">
                                  <SelectValue placeholder="Select State" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 bg-white z-[100] shadow-2xl border-gray-200">
                                  {states
                                    .filter((s) => s.isoCode && s.isoCode.trim() !== "")
                                    .map((s) => (
                                      <SelectItem key={s.isoCode} value={s.isoCode} className="focus:bg-indigo-50">
                                        {s.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="city_select" className="text-xs font-bold text-gray-700 uppercase tracking-tight">City</Label>
                              <Select
                                value={addressForm.city}
                                onValueChange={(value) => setAddressForm({ ...addressForm, city: value })}
                                disabled={!cities.length}
                              >
                                <SelectTrigger className="w-full h-12 bg-white border-gray-200 focus:ring-[#0c1f4d]">
                                  <SelectValue placeholder="Select City" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 bg-white z-[100] shadow-2xl border-gray-200">
                                  {cities
                                    .filter((ci) => ci.name && ci.name.trim() !== "")
                                    .map((ci) => (
                                      <SelectItem key={ci.name} value={ci.name} className="focus:bg-indigo-50">
                                        {ci.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="pincode" className="text-xs font-bold text-gray-700 uppercase tracking-tight">Pincode</Label>
                              <Input
                                id="pincode"
                                maxLength={6}
                                value={addressForm.pincode}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  setAddressForm({ ...addressForm, pincode: val });
                                }}
                                placeholder="XXXXXX"
                                className=" border-gray-200 focus:ring-[#0c1f4d] focus:border-[#0c1f4d]"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(false)} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleAddressSave} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6 shadow-sm shadow-emerald-200">
                              <Save size={14} /> Update Location
                            </Button>
                          </div>
                        </div>
                      ) : selectedStudent.address ? (
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in duration-500">
                          <div className="flex items-start gap-5 flex-1">
                            <div className="space-y-1">
                              <p className="text-gray-900 font-bold text-lg leading-tight">
                                {selectedStudent.address.address_line_1}
                                {selectedStudent.address.address_line_2 && <span className="text-gray-400 font-normal ml-1">({selectedStudent.address.address_line_2})</span>}
                              </p>
                              <div className="flex items-center gap-2 text-gray-600 font-medium">
                                <span>{selectedStudent.address.city}</span>
                                <span className="text-gray-300">•</span>
                                <span>{selectedStudent.address.state}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-bold tracking-wider uppercase text-[10px]">{selectedStudent.address.country}</span>
                                <span className="text-gray-300">|</span>
                                <span>Zip: {selectedStudent.address.pincode}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddressDeleteClick}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 font-semibold gap-2 border border-transparent hover:border-red-100 rounded-lg px-4"
                          >
                            <Trash2 size={16} />
                            <span>Remove Address</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 animate-pulse">
                          <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                             <MapPin className="text-slate-300 w-6 h-6" />
                          </div>
                          <p className="text-slate-500 mb-4 text-sm font-medium">No company address linked to this profile.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditAddressClick}
                            className="text-xs font-bold border-indigo-200 text-[#0c1f4d] hover:bg-white hover:shadow-md transition-all rounded-full px-6"
                          >
                            <PlusCircle size={14} className="mr-2" /> Add Business Address
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete Address Confirmation Dialog */}
                  <Dialog open={isDeleteAddressModalOpen} onOpenChange={setIsDeleteAddressModalOpen}>
                    <DialogContent className="sm:max-w-md bg-white">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                          <Trash2 className="h-5 w-5" /> Delete Company Address
                        </DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete the business address for{" "}
                          <span className="font-bold text-gray-900">
                            {selectedStudent.name || "this student"}
                          </span>
                          ? This action cannot be undone.
                        </p>
                      </div>
                      <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteAddressModalOpen(false)}
                          disabled={isDeletingAddress}
                          className="bg-white border-gray-200"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={confirmDeleteAddress}
                          disabled={isDeletingAddress}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeletingAddress ? "Deleting..." : "Delete Address"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* ──────────────────────────────────────────────
              ADDED: USER DETAILS CARD
          ────────────────────────────────────────────── */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                      <h3 className="text-xl font-semibold text-gray-900">User Account Details</h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-2xl shadow-md flex-shrink-0">
                          {selectedStudent.name?.[0]?.toUpperCase() || "?"}
                        </div>

                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-900">
                            {selectedStudent.name || "Unknown User"}
                          </h4>

                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-[#0c1f4d] mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium break-all">
                              {selectedStudent.user_email || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-[#0c1f4d] mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Phone (if available)</p>
                            <p className="font-medium">
                              {selectedStudent.user_phone || "No phone available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="shrink-0 px-6 py-5 bg-gray-50 border-t">
              <Button
                onClick={() => {
                  setSelectedStudent(null);
                  setIdCardImage(null);
                }}
                className="px-8 py-2.5 text-sm font-medium bg-[#0c1f4d] hover:bg-[#153171] text-white rounded-md shadow-md"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Form */}
        <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
          <DialogContent
            className="p-0 overflow-hidden bg-white rounded-xl shadow-2xl [&>button]:hidden flex flex-col"
            style={{
              width: "95vw",
              maxWidth: "1000px",
              height: "90vh",
              maxHeight: "90vh",
            }}
            hideCloseButton
          >
            {editingStudent && (
              <form onSubmit={handleUpdateStudent} className="flex flex-col h-full overflow-hidden">
                {/* Custom Header */}
                <div className="px-6 py-4 flex flex-none items-center bg-gradient-to-r from-[#0c1f4d] to-[#153171] text-white relative">
                  <h2 className="text-2xl font-bold ">
                    Edit Student
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="absolute top-4 cursor-pointer right-4 text-white hover:bg-white/20 rounded-full p-2 transition-all hover:scale-110"
                    aria-label="Close modal"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-gray-200">
                  <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Left Column - Form Fields */}
                      <div className="space-y-5">
                       
                        {/* College Email */}
                        <div className="space-y-1.5 relative">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                            <Mail className="w-4 h-4 text-gray-400" /> College Email (Optional)
                          </Label>
                          <Input
                            type="email"
                            name="college_email"
                            value={formData.college_email}
                            onChange={handleFormChange}
                            placeholder="student@college.edu"
                            className="h-11 text-sm transition-all focus:ring-1 border-gray-300 focus:border-[#0c1f4d] focus:ring-[#0c1f4d]"
                          />
                        </div>

                        {/* College Name */}
                        <div className="space-y-1.5 relative">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                            <Building2 className="w-4 h-4 text-gray-400" /> College Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="text"
                            name="college_name"
                            value={formData.college_name}
                            onChange={handleFormChange}
                            required
                            placeholder="XYZ Engineering College"
                            className="h-11 text-sm transition-all focus:ring-1 border-gray-300 focus:border-[#0c1f4d] focus:ring-[#0c1f4d]"
                          />
                        </div>

                        {/* University Name */}
                        <div className="space-y-1.5 relative">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                            <GraduationCap className="w-4 h-4 text-gray-400" /> University Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="text"
                            name="university_name"
                            value={formData.university_name}
                            onChange={handleFormChange}
                            required
                            placeholder="Anna University"
                            className="h-11 text-sm transition-all focus:ring-1 border-gray-300 focus:border-[#0c1f4d] focus:ring-[#0c1f4d]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                              College Start Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="date"
                              name="college_start_month_year"
                              value={formData.college_start_month_year}
                              onChange={handleFormChange}
                              required
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                              College End Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="date"
                              name="college_end_month_year"
                              value={formData.college_end_month_year}
                              onChange={handleFormChange}
                              required
                              className="h-11"
                            />
                          </div>
                        </div>

                      </div>

                      {/* Right Column - ID Card Upload & Preview */}
                      <div className="space-y-5">
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 shadow-sm h-full flex flex-col">
                          <Label className="block text-sm font-bold text-[#0c1f4d] mb-4">
                            ID Card Details
                          </Label>

                          {/* Current ID Card Preview */}
                          {(formData.id_card || idCardImage || selectedFile) ? (
                            <div className="relative mb-6 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white p-2">
                              <Zoom>
                                <img
                                  src={selectedFile ? URL.createObjectURL(selectedFile) : (formData.id_card || idCardImage)}
                                  alt="Current ID Card"
                                  className="w-full max-h-[280px] object-contain rounded cursor-zoom-in"
                                />
                              </Zoom>
                              <Button
                                type="button"
                                onClick={() => {
                                  if (selectedFile) {
                                    setSelectedFile(null); // Direct state clear instead of triggering validation
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                  } else {
                                    handleIdCardDelete();
                                  }
                                }}
                                disabled={isUploading}
                                className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-2.5 shadow-xl transition-transform hover:scale-105"
                                size="icon"
                                title="Remove Image"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                             <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-white mb-6 flex-1 min-h-[200px]">
                                <div className="bg-gray-100 p-3 rounded-full mb-3">
                                   <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600 font-medium">No ID card uploaded</p>
                                <p className="text-xs text-gray-400 mt-1">Upload an image of the student ID</p>
                             </div>
                          )}

                          {/* Upload New ID Card */}
                          <div className="space-y-3 mt-auto border-t border-gray-200 pt-4">
                            <Label className="text-sm text-gray-600 font-semibold block">Update ID Card</Label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                              <div className="flex-1 w-full">
                                <label
                                  htmlFor="idCardFile"
                                  className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors border-dashed"
                                >
                                  <Upload className="h-4 w-4 text-blue-600" />
                                  {selectedFile ? <span className="truncate max-w-[150px]">{selectedFile.name}</span> : "Browse Files"}
                                </label>
                                <Input
                                  id="idCardFile"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileSelect}
                                  className="hidden"
                                  ref={fileInputRef}
                                />
                              </div>

                              {selectedFile && (
                                <Button
                                  type="button"
                                  onClick={handleIdCardUpload}
                                  disabled={isUploading || !formData.college_name.trim()}
                                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto shadow-sm"
                                >
                                  {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Uploading</> : "Upload New"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Footer with Action Buttons */}
                <div className="flex-none flex items-center justify-end gap-3 px-6 py-5 bg-gray-50 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingStudent(null)}
                    className="text-gray-600 hover:bg-gray-100 px-6 h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#0c1f4d] hover:bg-[#153171] text-white px-8 h-11 shadow-md gap-2"
                    disabled={!formData.college_name.trim() || !formData.university_name.trim()}
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Student Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 p-4">
            <Card className="bg-white rounded-xl shadow-xl max-w-full sm:max-w-lg md:max-w-3xl w-full border border-gray-200 relative">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors z-10"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
              <CardContent className="p-0 overflow-hidden">
                <StudentCreationForm onStudentCreated={handleStudentCreated} />
              </CardContent>
            </Card>
          </div>
        )}

        <DeleteDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Are you sure you want to delete this student?"
          description="This action will delete the student, their address, and their ID card image. It cannot be undone."
        />
      </div>
    </div>
  );
}

export default AllStudents;
