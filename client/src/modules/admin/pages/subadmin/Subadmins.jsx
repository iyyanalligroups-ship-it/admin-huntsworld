import React, { useState, useEffect, useContext } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, KeyRound, ShieldAlert, UserCog } from 'lucide-react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useChangeToUserMutation } from '@/redux/api/Authapi';
import showToast from '@/toast/showToast';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import DeleteDialog from '@/model/DeleteModel';
import { fetchUser } from '@/redux/api/FetchUsers';
import UserForm from '@/modules/admin/pages/users/UserForm';


const API_URL = import.meta.env.VITE_API_URL;

function Subadmins() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [subAdminUsers, setSubAdminUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [roles, setRoles] = useState({ ADMIN: null, SUB_ADMIN: null, USER: null });
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const [currentPageAdmin, setCurrentPageAdmin] = useState(1);
  const [currentPageSubAdmin, setCurrentPageSubAdmin] = useState(1);
  const usersPerPage = 10;
  const [loadingUsers, setLoadingUsers] = useState({});
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletePopup, setDeletePopup] = useState(false);
  const [changeToUser] = useChangeToUserMutation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const fetchRoleIds = async () => {
      try {
        const roleResponse = await axios.get(`${API_URL}/role/fetch-all-role`);
        const roleData = roleResponse.data?.data || [];
        const roleMap = {
          ADMIN: roleData.find((r) => r.role === 'ADMIN')?._id || null,
          SUB_ADMIN: roleData.find((r) => r.role === 'SUB_ADMIN')?._id || null,
          USER: roleData.find((r) => r.role === 'USER')?._id || null,
        };
        if (!roleMap.ADMIN || !roleMap.SUB_ADMIN || !roleMap.USER) {
          throw new Error('Required roles not found');
        }
        setRoles(roleMap);
      } catch (err) {
        setError(err.message || 'Failed to fetch roles');
        showToast(err.message || 'Failed to fetch roles', 'error');
      }
    };
    fetchRoleIds();
  }, []);

  const handleDelete = (user) => {
    console.log(user), 'jhvgvhtghgv';
    setSelectedUser(user);
    setDeletePopup(true);
  };

  const confirmDelete = async () => {


    try {
      const response = await changeToUser(selectedUser._id);

      if (response?.data) {
        showToast(response.data.message || "User Deleted Successfully", "success");

      } else {
        showToast("Failed to Delete", "error");
      }
      await fetchAllUsers();
    } catch (error) {
      showToast(error?.data?.message || "Failed to delete user", "error");
    }
    setDeletePopup(false);
    setSelectedUser(null);
  };


  const fetchAllUsers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get(`${API_URL}/users/fetch-all-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { adminUsers = [], subAdminUsers = [] } = response.data;

      const initialRoles = {};
      [...adminUsers, ...subAdminUsers].forEach((user) => {
        if (user._id) {
          initialRoles[user._id] = user.role?.role || 'USER';
        }
      });

      setSelectedRoles(initialRoles);
      setAdminUsers(adminUsers);
      setSubAdminUsers(subAdminUsers);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      showToast(err.message || 'Failed to fetch users', 'error');
    }
  };

  useEffect(() => {

    if (roles.ADMIN && roles.SUB_ADMIN && roles.USER) fetchAllUsers();
  }, [roles.ADMIN, roles.SUB_ADMIN, roles.USER]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setUsers([]);
    setCurrentPageUsers(1);
    try {
      const response = await axios.get(`${API_URL}/users/lookup`, {
        params: { name: searchQuery, email: searchQuery, phone: searchQuery },
      });
      const filtered = response.data.users || [];

      const validUsers = filtered.filter(user => user.user_id && user.role).map(user => ({
        ...user,
        _id: user.user_id,
      }));

      const newRoles = {};
      validUsers.forEach((user) => {
        if (user.user_id) newRoles[user.user_id] = user.role?.role || 'USER';
      });
      setSelectedRoles((prev) => ({ ...prev, ...newRoles }));
      setUsers(validUsers);
      showToast('Search completed successfully', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Search failed';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: newRole }));
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!selectedUserForPassword?._id || !newPassword) {
      showToast("Password cannot be empty", "error");
      return;
    }

    try {
      setUpdatingPassword(true);

      const token = sessionStorage.getItem("token");

      const res = await axios.put(
        `${API_URL}/users/update/${selectedUserForPassword._id}`,
        { password: newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showToast("Password updated successfully", "success");
      setIsPasswordDialogOpen(false);
      setNewPassword("");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update password",
        "error"
      );
    } finally {
      setUpdatingPassword(false);
    }
  };


  const handleSaveRoleForUsers = async (userId) => {
    if (!userId || typeof userId !== 'string') {
      setError('Invalid or missing user ID');
      showToast('Invalid or missing user ID', 'error');
      return;
    }
    if (!selectedRoles[userId]) {
      setError('No role selected for this user');
      showToast('No role selected for this user', 'error');
      return;
    }

    const selectedRole = selectedRoles[userId];
    const roleId = roles[selectedRole];
    if (!roleId) {
      setError(`Role ID for "${selectedRole}" not found`);
      showToast(`Role ID for "${selectedRole}" not found`, 'error');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      await axios.put(
        `${API_URL}/users/update-users-by-id/${userId}`,
        { role: roleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const userToUpdate = users.find((u) => u.user_id === userId);
      if (!userToUpdate) {
        setError('User not found in searched users');
        showToast('User not found in searched users', 'error');
        return;
      }

      const updatedUser = {
        ...userToUpdate,
        _id: userId,
        role: { _id: roleId, role: selectedRole },
      };

      if (selectedRole === 'ADMIN') {
        setAdminUsers((prev) => {
          if (!prev.some((u) => u._id === userId)) {
            return [...prev, updatedUser];
          }
          return prev.map((u) =>
            u._id === userId ? updatedUser : u
          );
        });
        setSubAdminUsers((prev) => prev.filter((u) => u._id !== userId));
      } else if (selectedRole === 'SUB_ADMIN') {
        setSubAdminUsers((prev) => {
          if (!prev.some((u) => u._id === userId)) {
            return [...prev, updatedUser];
          }
          return prev.map((u) =>
            u._id === userId ? updatedUser : u
          );
        });
        setAdminUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        setAdminUsers((prev) => prev.filter((u) => u._id !== userId));
        setSubAdminUsers((prev) => prev.filter((u) => u._id !== userId));
      }

      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      setSelectedRoles((prev) => ({ ...prev, [userId]: selectedRole }));
      showToast(`Role updated to ${selectedRole} successfully`, 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update role';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleSaveRole = async (userId) => {
    if (!userId || !selectedRoles[userId]) {
      setError('Invalid user ID or no role selected');
      showToast('Invalid user ID or no role selected', 'error');
      return;
    }

    const selectedRole = selectedRoles[userId];
    const roleId = roles[selectedRole];
    if (!roleId) {
      setError(`Role ID for "${selectedRole}" not found`);
      showToast(`Role ID for "${selectedRole}" not found`, 'error');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      await axios.put(
        `${API_URL}/users/update-users-by-id/${userId}`,
        { role: roleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updateUser = (u) =>
        u._id === userId
          ? { ...u, role: { ...u.role, _id: roleId, role: selectedRole } }
          : u;

      setAdminUsers((prev) => {
        const updated = prev.map(updateUser);
        if (selectedRole === 'ADMIN') {
          const user = [...users.map(u => ({ ...u, _id: u.user_id })), ...subAdminUsers, ...prev].find((u) => u._id === userId);
          if (user && !prev.some((u) => u._id === userId)) {
            return [...updated, updateUser(user)];
          }
          return updated;
        }
        return updated.filter((u) => u._id !== userId);
      });

      setSubAdminUsers((prev) => {
        const updated = prev.map(updateUser);
        if (selectedRole === 'SUB_ADMIN') {
          const user = [...users.map(u => ({ ...u, _id: u.user_id })), ...adminUsers, ...prev].find((u) => u._id === userId);
          if (user && !prev.some((u) => u._id === userId)) {
            return [...updated, updateUser(user)];
          }
          return updated;
        }
        return updated.filter((u) => u._id !== userId);
      });

      setSelectedRoles((prev) => ({ ...prev, [userId]: selectedRole }));
      showToast(`Role updated to ${selectedRole} successfully`, 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update role';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleToggle = async (selectedUserId) => {
    setLoadingUsers((prev) => ({ ...prev, [selectedUserId]: true }));

    try {
      const token = sessionStorage.getItem("token");

      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/toggle-status/${selectedUserId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update the specific user's isActive in all lists
      setAdminUsers((prev) =>
        prev.map((u) => (u._id === selectedUserId ? { ...u, isActive: res.data.isActive } : u))
      );
      setSubAdminUsers((prev) =>
        prev.map((u) => (u._id === selectedUserId ? { ...u, isActive: res.data.isActive } : u))
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUserId ? { ...u, isActive: res.data.isActive } : u))
      );

      showToast(res.data.message, 'success');
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setLoadingUsers((prev) => ({ ...prev, [selectedUserId]: false }));
    }
  };

  const renderPages = (totalItems, currentPage, setCurrentPage) => {
    const totalPages = Math.ceil(totalItems / usersPerPage);
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <PaginationItem key={page}>
          <PaginationLink
            href="#"
            isActive={page === currentPage}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(page);
              showToast(`Navigated to page ${page}`, 'info');
            }}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      ));
    }

    const pages = [];
    if (currentPage > 2) {
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(1);
              showToast('Navigated to page 1', 'info');
            }}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (currentPage > 3) pages.push(<PaginationEllipsis key="start-ellipsis" />);
    }

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
              showToast(`Navigated to page ${i}`, 'info');
            }}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2) pages.push(<PaginationEllipsis key="end-ellipsis" />);
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(totalPages);
              showToast(`Navigated to page ${totalPages}`, 'info');
            }}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  const renderUserTable = (list, title, isSearchedUsers = false, currentPage, setCurrentPage) => {
    const indexOfFirstItem = (currentPage - 1) * usersPerPage;
    const currentItems = list.slice(indexOfFirstItem, indexOfFirstItem + usersPerPage);
    const totalPages = Math.ceil(list.length / usersPerPage);
    const { user } = useContext(AuthContext);
    const loginUserId = user?.user?._id;

    return (
      <div className="mt-8">
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#0c1f4d]">
                Update Password
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdatePassword} className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">
                  New Password for {selectedUserForPassword?.name}
                </label>
                <Input
                  type="password"
                  placeholder="e.g. NewPassword123!"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="border-2 border-slate-300"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsPasswordDialogOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={updatingPassword}
                  className="bg-[#0c1f4d] hover:bg-[#153171]"
                >
                  {updatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <h2 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">{title}</h2>
        {list.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
              {currentItems.map((user, index) => (
                <Card
                  key={isSearchedUsers ? user.user_id : user._id}
                  className="border rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">S.No:</span> {indexOfFirstItem + index + 1}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {user.email || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {user.phone || user.phone_number || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Role:</span>
                        <Select
                          value={selectedRoles[isSearchedUsers ? user.user_id : user._id] || 'USER'}
                          onValueChange={(val) =>
                            handleRoleChange(isSearchedUsers ? user.user_id : user._id, val)
                          }
                        >
                          <SelectTrigger className="w-full mt-1 border-2 border-slate-300">
                            <SelectValue placeholder="e.g. Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="SUB_ADMIN">Subadmin</SelectItem>
                          </SelectContent>
                        </Select>
                      </p>

                      {/* UPDATED BUTTON CONTAINER */}
                      <div className="flex flex-wrap justify-end items-center gap-2 mt-4">
                        {loginUserId != user?._id && (
                          <Button
                            size="sm"
                            onClick={() => handleToggle(user?._id)}
                            disabled={loadingUsers[user._id]}
                            // Removed m-2 here since gap-2 handles spacing now
                            className={`px-4 py-2 rounded-lg font-medium text-white cursor-pointer transition-all duration-300 shadow-md
                  ${user.isActive
                                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                              }
                  ${loadingUsers[user._id] ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg transform hover:scale-105'}
                `}
                          >
                            {loadingUsers[user._id] ? 'Updating...' : user.isActive ? 'Deactivate Now' : 'Activate Now'}
                          </Button>
                        )}

                        <Button
                          size="sm"
                          onClick={() =>
                            isSearchedUsers
                              ? handleSaveRoleForUsers(user.user_id)
                              : handleSaveRole(user._id)
                          }
                          disabled={
                            selectedRoles[isSearchedUsers ? user.user_id : user._id] ===
                            user.role?.role
                          }
                          className="bg-[#1c1b20] hover:bg-[#c0302c] text-white text-sm px-4 py-2"
                        >
                          Save
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUserForPassword(user);
                            setNewPassword("");
                            setIsPasswordDialogOpen(true);
                          }}
                          // Removed ml-2 here since gap-2 handles spacing
                          className="text-sm"
                        >
                          Edit Password
                        </Button>

                        <Button
                          size="sm" // Added size="sm" to keep it consistent with others
                          variant="ghost" // Changed to ghost or outline for standard styling
                          onClick={() => handleDelete(user)}
                          className="text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <div className="bg-white shadow-sm border border-gray-200">
                <div className="p-0">
                  <Table>
                    <TableHeader className="bg-[#0c1f4d]">
                      <TableRow >
                        <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Name</TableHead>
                        <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Email</TableHead>
                        <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Phone</TableHead>
                        <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Role</TableHead>
                        <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((user) => (
                        <TableRow
                          key={isSearchedUsers ? user.user_id : user._id}
                          className="hover:bg-gray-50"
                        >
                          <TableCell className="text-sm text-gray-600">
                            {user.name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {user.email || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {user.phone || user.phone_number || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            <Select
                              value={selectedRoles[isSearchedUsers ? user.user_id : user._id] || 'USER'}
                              onValueChange={(val) =>
                                handleRoleChange(isSearchedUsers ? user.user_id : user._id, val)
                              }
                            >
                              <SelectTrigger className="w-[180px] border-2 border-slate-300">
                                <SelectValue placeholder="e.g. Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="SUB_ADMIN">Subadmin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {
                              loginUserId != user?._id &&
                              <Button
                                size="sm"
                                onClick={() => handleToggle(user?._id)}
                                disabled={loadingUsers[user._id]}
                                className={`px-4 py-2 rounded-lg font-medium text-white cursor-pointer transition-all duration-300 shadow-md m-2
                                  ${user.isActive
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                  }
                                  ${loadingUsers[user._id] ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg transform hover:scale-105'}
                                `}
                              >
                                {loadingUsers[user._id] ? 'Updating...' : user.isActive ? 'Deactivate Now' : 'Activate Now'}
                              </Button>
                            }
                            <Button
                              size="sm"
                              onClick={() =>
                                isSearchedUsers
                                  ? handleSaveRoleForUsers(user.user_id)
                                  : handleSaveRole(user._id)
                              }
                              disabled={
                                selectedRoles[isSearchedUsers ? user.user_id : user._id] ===
                                user.role?.role
                              }
                              className="bg-[#1c1b20] hover:bg-[#c0302c] text-white text-sm px-4 py-2"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUserForPassword(user);
                                setNewPassword("");
                                setIsPasswordDialogOpen(true);
                              }}
                              className="ml-2 text-sm"
                            >
                              Edit Password
                            </Button>
                            <Button

                              onClick={() => handleDelete(user)}
                              className="text-sm ml-2 bg-red-600 hover:bg-red-600 cursor-pointer"
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            {deletePopup && (
              <DeleteDialog
                open={deletePopup}
                onClose={() => setDeletePopup(false)}
                onConfirm={confirmDelete}
                title={`Are you sure you want to delete ${selectedUser?.name}?`}
                description="This action cannot be undone."
              />
            )}
            {/* Pagination */}
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
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                          showToast(`Navigated to page ${currentPage - 1}`, 'info');
                        }
                      }}
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-sm px-4 py-2"
                    />
                  </PaginationItem>
                  {renderPages(list.length, currentPage, setCurrentPage)}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      disabled={currentPage === totalPages}
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                          showToast(`Navigated to page ${currentPage + 1}`, 'info');
                        }
                      }}
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-sm px-4 py-2"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-sm">No users found for this role.</div>
        )}
      </div>
    );
  };

  return (
    <div className="lg:p-4">
      <h2 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Manage Subadmins</h2>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6">
        {/* ---------------------------------------------------------------------------
            LEFT PANEL: PRIVILEGED ACCESS SOP
           --------------------------------------------------------------------------- */}
        <div className="xl:col-span-1">

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
              Privileged Access
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Protocols for granting and revoking administrative roles.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-2 space-y-4 mb-4 md:space-y-0">

            {/* SOP 1: Role Assignment */}
            <Card className="border-l-4 border-l-purple-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <UserCog size={16} className="text-purple-600" />
                  1. Role Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Admin:</strong> Full system access.
                  <br />
                  <strong>Sub-Admin:</strong> Restricted operational access.
                  <br />
                  <span className="bg-amber-50 text-amber-700 px-1 rounded font-semibold">ACTION:</span> You must click <span className="font-bold border border-slate-300 px-1 rounded text-[10px] bg-slate-800 text-white">Save</span> to commit any role change.
                </p>
              </CardContent>
            </Card>

            {/* SOP 2: Emergency Revocation */}
            <Card className="border-l-4 border-l-red-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <ShieldAlert size={16} className="text-red-600" />
                  2. Immediate Revocation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  In case of suspicious activity or employee exit, use the <strong>Deactivate Now</strong> button.
                  <br />
                  <span className="italic">This instantly kills current sessions and prevents login.</span>
                </p>
              </CardContent>
            </Card>

            {/* SOP 3: Audit Trail */}
            <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <KeyRound size={16} className="text-blue-600" />
                  3. Least Privilege
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Only grant <strong>Admin</strong> status to executive stakeholders. Downgrade unused accounts to <strong>User</strong> instead of deleting them to preserve audit logs.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* ---------------------------------------------------------------------------
            RIGHT PANEL: ROLE MANAGEMENT TABLE
           --------------------------------------------------------------------------- */}


      </div>
      <div className='flex gap-2 justify-end items-center mb-6'>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#0c1f4d] hover:bg-[#153171] cursor-pointer text-white"
        >
          Add New Admin
        </Button>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add New Admin / Subadmin</DialogTitle>
          </DialogHeader>
          <UserForm 
            closeModal={() => setIsAddModalOpen(false)}
            refetch={fetchAllUsers}
            isAdminMode={true}
          />
        </DialogContent>
      </Dialog>
      {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}

      <div>
        {[
          {
            list: users,
            title: 'Searched Users',
            key: 'searched-users',
            isSearchedUsers: true,
            currentPage: currentPageUsers,
            setCurrentPage: setCurrentPageUsers,
          },
          {
            list: adminUsers,
            title: 'Admin Users',
            key: 'admin-users',
            isSearchedUsers: false,
            currentPage: currentPageAdmin,
            setCurrentPage: setCurrentPageAdmin,
          },
          {
            list: subAdminUsers,
            title: 'Subadmin Users',
            key: 'subadmin-users',
            isSearchedUsers: false,
            currentPage: currentPageSubAdmin,
            setCurrentPage: setCurrentPageSubAdmin,
          },
        ].map(({ list, title, key, isSearchedUsers, currentPage, setCurrentPage }) => (
          <div key={key}>{renderUserTable(list, title, isSearchedUsers, currentPage, setCurrentPage)}</div>
        ))}
      </div>
    </div>
  );
}

export default Subadmins;
