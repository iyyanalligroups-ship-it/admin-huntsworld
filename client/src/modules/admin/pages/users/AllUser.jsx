import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Loader2,
  FilterX,
  RefreshCw,
  Key,
  Eye,
} from "lucide-react";
import showToast from "@/toast/showToast";
import { io } from "socket.io-client";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Input State (Immediate UI changes)
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    roleId: "all",
  });

  // 2. Debounced State (For API calls)
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Edit Dialog State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // Fetch Roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/role/fetch-all-role`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const result = await res.json();
        setRoles(result.data || []);
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      }
    };
    fetchRoles();
  }, []);

  // --- HANDLE FILTERS DEBOUNCE ---
  useEffect(() => {
    const timer = setTimeout(() => {
      // When filters stop changing, update the "Active" filters
      setDebouncedFilters(filters);
      // And always reset to page 1 when searching
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Main fetch effect
  useEffect(() => {
    fetchUsers();

    // Real-time notifications for users
    const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/admin-notifications`, {
      reconnection: true,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[User Management] Socket connected');
    });

    socket.on('new-user', () => {
      console.log('[User Management] New user event received, refreshing...');
      fetchUsers();
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedFilters]);

  const handleMarkAsRead = async (userId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/users/mark-read/${userId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchUsers();
    } catch (err) {
      console.error("Error marking user as read:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Use debouncedFilters here, not the raw input state
      const { name, email, phone, roleId } = debouncedFilters;

      const queryParams = new URLSearchParams({
        page: currentPage, // Use current state
        limit,
        name,
        email,
        phone,
        roleId: roleId === "all" ? "" : roleId,
      }).toString();

      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/all?${queryParams}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const result = await res.json();

      if (result.success) {
        const filteredUsers = (result.data || []).filter((user) => {
          const roleName = user?.role?.role?.toLowerCase();
          return roleName !== "admin" && roleName !== "sub_admin";
        });

        setUsers(filteredUsers);
        setTotalPages(Number(result.totalPages) || 1);
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage, e) => {
    if (e) e.preventDefault();
    const target = Number(newPage);
    if (target < 1 || target > totalPages || target === currentPage) return;
    setCurrentPage(target);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email || "",
      phone: user.phone || "",
      password: "",
    });
    setIsDialogOpen(true);

    // Automatically mark as read when editing
    if (user.markAsRead !== true) {
      handleMarkAsRead(user._id);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const password = formData.password.trim();

    // 🔴 PASSWORD VALIDATION (Only if password is being updated)
    if (password !== "") {
      // 1. Min Length
      if (password.length < 6) {
        showToast("Password must be at least 6 characters long", "error");
        return;
      }
      // 2. Capital Letter
      if (!/[A-Z]/.test(password)) {
        showToast("Password must contain at least one capital letter", "error");
        return;
      }
      // 3. Number
      if (!/[0-9]/.test(password)) {
        showToast("Password must contain at least one number", "error");
        return;
      }
      // 4. Symbol
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        showToast("Password must contain at least one special character/symbol", "error");
        return;
      }
    }

    const cleanData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: password
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/users/update/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(cleanData),
        }
      );

      if (res.ok) {
        showToast("User updated successfully", "success");
        setIsDialogOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        showToast(err.message || "Update failed", "error");
      }
    } catch (err) {
      console.error("Update error:", err);
      showToast("Connection error", "error");
    }
  };

  const getPaginationItems = () => {
    if (totalPages <= 1) return [1];
    const pages = [];
    const showMax = 5;

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) end = 4;
      if (currentPage >= totalPages - 2) start = totalPages - 3;

      if (start > 2) pages.push("ellipsis-start");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("ellipsis-end");

      pages.push(totalPages);
    }
    return pages;
  };

  // Reset function needs to reset both states
  const handleReset = () => {
    const empty = { name: "", email: "", phone: "", roleId: "all" };
    setFilters(empty);
    // We don't need to manually fetch here; the useEffect on [filters] will trigger
    // the debounce, which updates debouncedFilters, which triggers the fetch.
  };

  return (
    <div className="lg:p-4">
      <h2 className="text-md mb-3 w-fit border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
        User Management
      </h2>

      {/* Header Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="e.g. John Doe"
            className="w-full rounded-md border-2 border-slate-300 text-sm"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
          <Input
            placeholder="e.g. john@example.com"
            className="w-full rounded-md border-2 border-slate-300 text-sm"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          />
          <Input
            placeholder="e.g. 9876543210"
            className="w-full rounded-md border-2 border-slate-300 text-sm"
            value={filters.phone}
            onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 cursor-pointer border-dashed border-gray-300 text-gray-500 hover:text-red-600"
            >
              <FilterX className="w-4 h-4 mr-2" /> Reset
            </Button>
            <Button
              onClick={() => fetchUsers()}
              className="bg-[#0c1f4d] hover:bg-[#153171] text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 className="animate-spin h-8 w-8 mb-2" />
          <p>Loading users...</p>
        </div>
      )}

      {/* Mobile Card View */}
      {!loading && (
        <div className="sm:hidden space-y-4">
          {users.map((u) => (
            <Card key={u._id} className="border rounded-lg shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs font-mono text-[#0c1f4d] font-bold">
                      {u.user_code}
                    </p>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {u.name}
                      {u.markAsRead !== true && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                          New
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(u)}
                    className="h-8 w-8 mx-auto"
                  >
                    <Edit className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <p><span className="font-semibold">Email:</span> {u.email || "N/A"}</p>
                  <p><span className="font-semibold">Phone:</span> {u.phone || "N/A"}</p>
                  <div className="pt-2 flex justify-between items-center">
                    <Badge variant="outline" className="bg-gray-100 text-[#0c1f4d] uppercase text-[10px]">
                      {u.role?.role || "USER"}
                    </Badge>
                    {u.markAsRead !== true && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(u._id)}
                        className="h-7 text-[10px] text-blue-600 hover:text-blue-700 p-0"
                      >
                        <Eye className="w-3 h-3 mr-1" /> Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Desktop Table View */}
      {!loading && (
        <div className="hidden sm:block bg-white border border-gray-200 overflow-hidden rounded-lg">
          <Table>
            <TableHeader className="bg-[#0c1f4d]">
              <TableRow>
                <TableHead className="text-white font-semibold">Code</TableHead>
                <TableHead className="text-white font-semibold">Name</TableHead>
                <TableHead className="text-white font-semibold">Contact Info</TableHead>
                <TableHead className="text-white font-semibold">Role</TableHead>
                <TableHead className="text-white font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((u) => (
                  <TableRow key={u._id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-xs font-bold text-[#0c1f4d]">
                      {u.user_code}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        {u.name}
                        {u.markAsRead !== true && (
                          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                            New
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <div>{u.email || "—"}</div>
                      <div className="text-xs text-gray-400">{u.phone || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 uppercase text-[10px]">
                        {u.role?.role || "USER"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(u)}
                          className="h-8 w-8"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Button>
                        {u.markAsRead !== true && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAsRead(u._id)}
                            className="h-8 w-8"
                            title="Mark as Read"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                    No users found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <span className="text-sm text-gray-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Pagination className="justify-center sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => handlePageChange(currentPage - 1, e)}
                  aria-disabled={currentPage <= 1}
                  className={
                    currentPage <= 1
                      ? "pointer-events-none opacity-50 select-none"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPaginationItems().map((page, index) => {
                if (page === "ellipsis-start" || page === "ellipsis-end") {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => handlePageChange(page, e)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => handlePageChange(currentPage + 1, e)}
                  aria-disabled={currentPage >= totalPages}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50 select-none"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0c1f4d]">
              Edit User Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="border-2 border-slate-300"
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border-2 border-slate-300"
                placeholder="e.g. john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="border-2 border-slate-300"
                placeholder="e.g. 9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="edit-pass"
                className="flex items-center gap-2 text-amber-600 font-bold"
              >
                <Key className="w-3 h-3" /> Update Password
              </Label>
              <Input
                id="edit-pass"
                type="password"
                placeholder="e.g. Leave blank to keep current"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="border-2 border-slate-300"
              />
              {formData.password && (
                <p className="text-[10px] text-gray-500 mt-1">
                  Must be <span className="font-semibold text-amber-600">min 6 chars</span> with <span className="font-semibold text-amber-600">Uppercase, Number, & Symbol</span>.
                </p>
              )}
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0c1f4d] hover:bg-[#153171]"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
