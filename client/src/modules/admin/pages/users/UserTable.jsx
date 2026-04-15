import React, { useContext, useState, useEffect } from "react";
import { useGetRoleUserDataQuery, useDeleteUserMutation } from "@/redux/api/Authapi";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { MoreVertical, ToggleLeft, ToggleRight, Loader2, RefreshCw, MapPin, ShieldCheck, UserPlus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserForm from "./UserForm";
import DeleteDialog from "@/model/DeleteModel";
import AddressForm from "./AddressForm";
import UserDetails from "./UserDetails";
import showToast from "@/toast/showToast";
import { Badge } from "@/components/ui/badge";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import axios from "axios";

const UserTable = () => {
  const { user } = useContext(AuthContext);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [addressPopup, setAddressPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearchName, setDebouncedSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [loadingUsers, setLoadingUsers] = useState({}); // Track loading per user ID

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchName(searchName.trim());
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchName]);

  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  // Permissions
  const currentPagePath = "/sub-admin-dashboard/common-users";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions.includes("edit") || false;
  const canDelete = pagePermissions?.actions.includes("delete") || false;
  if (isUserError) {
    showToast(userError?.data?.message || "Failed to load user permissions", "error");
  }

  const { data, isLoading, isError, error, refetch } = useGetRoleUserDataQuery({
    name: debouncedSearchName,
    page: currentPage,
    limit: usersPerPage,
    role: "USER",
  });

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  const [deleteUser] = useDeleteUserMutation();

  // Modal handlers
  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setIsUserFormOpen(true);
    // Automatically mark as read when editing
    if (user && user.markAsRead !== true) {
      handleMarkAsRead(user._id);
    }
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setDeletePopup(true);
  };

  const handleOpenAddressPopup = (user) => {
    setSelectedUser(user);
    setAddressPopup(true);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);
    // Automatically mark as read when viewing details
    if (user.markAsRead !== true) {
      handleMarkAsRead(user._id);
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteUser(selectedUser._id);
      if (response?.data) {
        showToast(response.data.message || "User Deleted Successfully", "success");
      } else {
        showToast("Failed to Delete", "error");
      }
    } catch (error) {
      showToast(error?.data?.message || "Failed to delete user", "error");
    }
    setDeletePopup(false);
    setSelectedUser(null);
  };

  const handleMarkAsRead = async (userId) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/mark-read/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refetch();
    } catch (err) {
      console.error("Error marking user as read:", err);
    }
  };

  const handleToggle = async (userId) => {
    try {
      setLoadingUsers((prev) => ({ ...prev, [userId]: true }));

      const token = sessionStorage.getItem("token");

      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/toggle-status/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showToast(response.data.message || "Status updated successfully", "success");

      refetch(); // refresh list

    } catch (err) {
      console.error("Toggle error:", err);
      showToast(
        err?.response?.data?.message || "Failed to update user status",
        "error"
      );
    } finally {
      setLoadingUsers((prev) => ({ ...prev, [userId]: false }));
    }
  };
  // Pagination rendering logic
  const renderPages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <PaginationItem key={page}>
          <PaginationLink
            href="#"
            isActive={page === currentPage}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(page);
            }}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      ));
    }

    const pages = [];

    // Always render page 1
    pages.push(
      <PaginationItem key={1}>
        <PaginationLink
          href="#"
          isActive={currentPage === 1}
          onClick={(e) => {
            e.preventDefault();
            setCurrentPage(1);
          }}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Start ellipsis if current page is far from start
    if (currentPage > 3) {
      pages.push(<PaginationEllipsis key="start-ellipsis" />);
    }

    // Middle pages around the current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={i === currentPage}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(i);
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // End ellipsis if current page is far from end
    if (currentPage < totalPages - 2) {
      pages.push(<PaginationEllipsis key="end-ellipsis" />);
    }

    // Always render last page
    pages.push(
      <PaginationItem key={totalPages}>
        <PaginationLink
          href="#"
          isActive={currentPage === totalPages}
          onClick={(e) => {
            e.preventDefault();
            setCurrentPage(totalPages);
          }}
        >
          {totalPages}
        </PaginationLink>
      </PaginationItem>
    );

    return pages;
  };

  const indexOfFirstItem = (currentPage - 1) * usersPerPage;

  return (
    <div className="lg:p-4">
      <h2 className="text-md mb-3 w-fit border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">All Users</h2>
      {/* ---------------------------------------------------------------------------
            LEFT PANEL: USER MANAGEMENT SOP
           --------------------------------------------------------------------------- */}
      <div className="xl:col-span-1">

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
            User Registry
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Protocols for managing general platform accounts and internal staff access.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 space-y-4 mb-4 md:space-y-0">

          {/* SOP 1: Provisioning */}
          <Card className="border-l-4 border-l-indigo-600 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <UserPlus size={16} className="text-indigo-600" />
                1. Provisioning & Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                When adding a new user, verify the <strong>Phone Number</strong> is unique.
                <br />
                Ensure the assigned <strong>Role</strong> aligns strictly with the user's operational needs (Least Privilege Principle).

              </p>
            </CardContent>
          </Card>

          {/* SOP 2: Security */}
          <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <ShieldCheck size={16} className="text-emerald-600" />
                2. Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                  <span><strong>Active:</strong> User has full system access.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                  <span><strong>Inactive:</strong> Use this to suspend access without losing data history.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* SOP 3: Profile Data */}
          <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <MapPin size={16} className="text-amber-600" />
                3. Profile Enrichment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                Use the <strong>Add Address</strong> function to map physical locations to users.
                <br />
                <strong>Delete</strong> actions are permanent. Prefer deactivation unless the account is spam/duplicate.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search by name..."
          className="w-full sm:w-64 rounded-md border-gray-300 focus:ring-2 focus:ring-gray-900 text-sm"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 sm:mt-0">
          <Button
            onClick={() => handleOpenModal(null)}
            className="flex items-center bg-[#0c1f4d] hover:bg-[#0c204de9] text-white rounded-md text-sm px-4 py-2"
          >
            + Add User
          </Button>
          <Button
            onClick={() => {
              refetch();
              showToast("User list refreshed", "info");
            }}
            className="flex items-center bg-[#0c1f4d] hover:bg-[#153171] text-white rounded-md text-sm px-4 py-2"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading/Error States */}
      {isLoading && (
        <div className="text-center py-4 text-gray-600 text-sm">
          Loading users...
        </div>
      )}
      {isError && (
        <div className="text-center py-4 text-red-500 text-sm">
          Error fetching users: {error?.data?.message || error.message}
        </div>
      )}
      {!isLoading && !isError && users.length === 0 && (
        <div className="text-center py-4 text-gray-600 text-sm">
          No users found for search "{debouncedSearchName || 'all'}".
        </div>
      )}

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {users.length > 0 && (
          users.map((user, index) => (
            <Card key={user._id} className="border rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {user.name || "N/A"}
                    {user.markAsRead !== true && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                        New
                      </span>
                    )}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreVertical className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-md shadow-lg bg-white z-50">
                      <DropdownMenuItem
                        onClick={() => handleViewDetails(user)}
                        className="text-sm text-gray-700 hover:bg-gray-100"
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenModal(user)}
                        className="text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </DropdownMenuItem>
                      {user._id !== userId && (
                        <DropdownMenuItem
                          onClick={() => handleToggle(user._id)}
                          disabled={loadingUsers[user._id]}
                          className="text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {loadingUsers[user._id] ? 'Updating...' : user.isActive ? 'Deactivate Account' : 'Activate Account'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(user)}
                        className="text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenAddressPopup(user)}
                        className="text-sm text-gray-700 hover:bg-gray-100 p-2"
                      >
                        Add Address
                      </DropdownMenuItem>
                      {user.markAsRead !== true && (
                        <DropdownMenuItem
                          onClick={() => handleMarkAsRead(user._id)}
                          className="text-sm text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Mark as Read
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">S.No:</span> {indexOfFirstItem + index + 1}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {user.email || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {user.phone || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Active:</span>{" "}
                    <Badge className={`${user.isActive ? "bg-green-500" : "bg-red-500"} text-white text-xs`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <div className="bg-white border border-gray-200">
          <div className="p-0">
            <Table>
              <TableHeader className="bg-[#0c1f4d]">
                <TableRow>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">Name</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">Email</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">Phone Number</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">Role</TableHead>
                  <TableHead className="px-4 py-3 text-center text-sm font-semibold text-white">Account Status</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id} className="hover:bg-gray-50">
                    <TableCell className="text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        {u.name || "N/A"}
                        {u.markAsRead !== true && (
                          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                            New
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{u.email || "N/A"}</TableCell>
                    <TableCell className="text-sm text-gray-600">{u.phone || "N/A"}</TableCell>
                    <TableCell className="text-sm text-gray-600">{u.role?.role || "N/A"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${u.isActive ? "bg-green-500" : "bg-red-500"}`} />
                        <span className={`text-xs font-medium ${u.isActive ? "text-green-700" : "text-red-700"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <span className="cursor-pointer p-2 rounded-full hover:bg-gray-100">
                            <MoreVertical className="h-5 w-5 text-gray-600" />
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-md shadow-lg bg-white z-50">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(u)}
                            className="text-sm text-gray-700 hover:bg-gray-100"
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggle(u._id)}
                            disabled={loadingUsers[u._id]}
                            className={`flex items-center gap-2 cursor-pointer ${u.isActive ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}`}
                          >
                            {loadingUsers[u._id] ? <Loader2 className="h-4 w-4 animate-spin" /> :
                              u.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                            {u.isActive ? 'Deactivate Now' : 'Activate Now'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenModal(u)}
                            className="text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(u)}
                            className="text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenAddressPopup(u)}
                            className="text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Add Address
                          </DropdownMenuItem>
                          {u.markAsRead !== true && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsRead(u._id)}
                              className="text-sm text-blue-600 hover:bg-blue-50 font-medium"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && !isError && users.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Pagination className="justify-center sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  disabled={currentPage === 1}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                />
              </PaginationItem>
              {renderPages()}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  disabled={currentPage === totalPages}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modals */}
      {isUserDetailsOpen && selectedUser && (
        <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <UserDetails user={selectedUser} closeModal={() => setIsUserDetailsOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
      {isUserFormOpen && (
        <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
          <DialogContent className="max-w-lg sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{selectedUser ? "Edit User" : "Add User"}</DialogTitle>
            </DialogHeader>
            <UserForm user={selectedUser} closeModal={() => setIsUserFormOpen(false)} refetch={refetch} />
          </DialogContent>
        </Dialog>
      )}
      {addressPopup && (
        <Dialog open={addressPopup} onOpenChange={setAddressPopup}>
          <DialogContent className="max-w-lg sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add Address</DialogTitle>
            </DialogHeader>
            <AddressForm user={selectedUser} closeModal={() => setAddressPopup(false)} refetch={refetch} />
          </DialogContent>
        </Dialog>
      )}
      {deletePopup && (
        <DeleteDialog
          open={deletePopup}
          onClose={() => setDeletePopup(false)}
          onConfirm={confirmDelete}
          title={`Are you sure you want to delete ${selectedUser?.name}?`}
          description="This action cannot be undone."
        />
      )}
    </div>
  );
};

export default UserTable;
