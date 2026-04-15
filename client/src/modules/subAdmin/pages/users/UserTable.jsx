import { useContext, useState, useEffect } from "react";
import { useGetRoleUserDataQuery, useDeleteUserMutation } from "@/redux/api/Authapi";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";

import { Button } from "@/components/ui/button";
import { MoreVertical, ToggleLeft, ToggleRight, Loader2, RefreshCw, MapPin, ShieldCheck, UserPlus, Eye } from "lucide-react";
import { io } from "socket.io-client";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from "axios";

const Truncate = ({ text }) => {
  const rawText = text || "N/A";
  let formattedText = rawText.replace(/[-_]/g, " ");
  formattedText = formattedText.replace(/\b\w/g, (c) => c.toUpperCase());
  const isLong = formattedText.length > 15;
  const truncated = isLong ? `${formattedText.slice(0, 15)}…` : formattedText;
  return isLong ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block max-w-[10ch] truncate cursor-default">
            {truncated}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs break-words p-2 bg-gray-900 text-white"
        >
          {formattedText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span className="inline-block max-w-[10ch] truncate">{formattedText}</span>
  );
};

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

  // Local copy of users for instant UI updates
  const [localUsers, setLocalUsers] = useState([]);

  // Per-user loading state for toggle button
  const [togglingUsers, setTogglingUsers] = useState({});

  const { data, isLoading, isError, error, refetch } = useGetRoleUserDataQuery(
    {
      name: debouncedSearchName,
      page: currentPage,
      limit: usersPerPage,
      role: "USER",
    }
  );

  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError } =
    useGetUserByIdQuery(userId, { skip: !userId });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchName(searchName.trim());
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchName]);

  const handleMarkAsRead = async (userId) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/users/mark-read/${userId}`, {}, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      refetch();
    } catch (err) {
      console.error("Error marking user as read:", err);
    }
  };

  useEffect(() => {
    // Real-time notifications
    const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/admin-notifications`, {
      reconnection: true,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[User Table] Socket connected');
    });

    socket.on('new-user', () => {
      console.log('[User Table] New user event received, refreshing...');
      refetch();
    });

    return () => {
      socket.disconnect();
    };
  }, [refetch]);


  // Permissions
  const currentPagePath = "common-users";
  const pagePermissions = currentUser?.approved_permissions?.find(
    (p) => p.page === currentPagePath
  );
  const canEdit = pagePermissions?.actions.includes("edit") || false;
  const canDelete = pagePermissions?.actions.includes("delete") || false;

  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    showToast("Failed to load user permissions", "error");
  }


  // Sync localUsers when API data changes
  useEffect(() => {
    if (data?.users) {
      setLocalUsers(data.users);
    }
  }, [data]);

  const users = localUsers;
  const totalPages = data?.totalPages || 1;

  const [deleteUser] = useDeleteUserMutation();

  // Modal handlers
  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setIsUserFormOpen(true);
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
    const response = await deleteUser(selectedUser._id);
    if (response?.data) {
      showToast(response.data.message || "User Deleted Successfully", "success");
      // Optional: refetch after delete
      refetch();
    } else {
      showToast("Failed to Delete", "error");
    }
    setDeletePopup(false);
  };

  // Toggle activate/deactivate + instant UI update
  const handleToggle = async (selectedUserId) => {
    setTogglingUsers((prev) => ({ ...prev, [selectedUserId]: true }));

    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/toggle-status/${selectedUserId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showToast(res.data.message || "Status updated successfully", "success");

      // ── INSTANT UI UPDATE ────────────────────────────────
      setLocalUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === selectedUserId ? { ...u, isActive: !u.isActive } : u
        )
      );
      // ─────────────────────────────────────────────────────

    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Failed to update status", "error");
    } finally {
      setTogglingUsers((prev) => ({ ...prev, [selectedUserId]: false }));
    }
  };

  // Pagination rendering logic (unchanged)
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
    if (currentPage > 2) {
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(1);
            }}
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
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2)
        pages.push(<PaginationEllipsis key="end-ellipsis" />);
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(totalPages);
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  return (
    <div className="p-2">
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
      <div className="flex gap-3">
        <Button
          className="mb-4 hover:shadow-lg text-white bg-[#0c1f4d] py-2 rounded-md cursor-pointer"
          onClick={() => handleOpenModal(null)}
          
       
        >
          + Add User
        </Button>
        <Input
          type="text"
          placeholder="Search by name..."
          className="p-2 border rounded-md w-64 mb-4"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </div>

      {/* Loading / Error / Empty States */}
      {isLoading && <p className="text-center text-gray-600">Loading users...</p>}
      {isError && (
        <p className="text-center text-red-500">
          Error fetching users: {error?.data?.message || error.message}
        </p>
      )}
      {!isLoading && !isError && users.length === 0 && (
        <p className="text-center text-gray-600">
          No users found for search "{debouncedSearchName || "all"}".
        </p>
      )}

      {/* Desktop Table View */}
      {!isLoading && !isError && users.length > 0 && (
        <div className="hidden md:block">
          <Table className="border border-gray-200 overflow-hidden">
            <TableHeader className="bg-[#0c1f4d]">
              <TableRow>
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">
                  Name
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">
                  Email
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">
                  Phone Number
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">
                  Role
                </TableHead>
                {/* <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">
                  Email Status
                </TableHead> */}
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">
                  Account Status
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id} className="border-b hover:bg-gray-50">
                  <TableCell className="p-3">
                    <div className="flex items-center gap-2">
                      <Truncate text={user?.name || "N/A"} />
                      {user.markAsRead !== true && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                          New
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-3">{user?.email || "N/A"}</TableCell>
                  <TableCell className="p-3">{user?.phone || "N/A"}</TableCell>
                  <TableCell className="p-3">{user?.role?.role || "N/A"}</TableCell>
                  {/* <TableCell className="p-3">
                    <Badge
                      className={`${user?.email_verified ? "bg-green-500" : "bg-red-500"
                        } text-white rounded-2xl p-1`}
                    >
                      {user?.email_verified ? "Verified" : "Not Verified"}
                    </Badge>
                  </TableCell> */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-xs sm:text-sm font-medium ${user?.isActive ? 'text-green-700' : 'text-red-700'}`}>
                        {user?.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="p-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <span className="cursor-pointer p-2 rounded-full hover:bg-gray-200">
                          <MoreVertical className="w-5 h-5" />
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                          View more
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenModal(user)}
                          disabled={!canEdit}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggle(user._id)}
                          disabled={togglingUsers[user._id]}
                          className="flex items-center gap-2 cursor-pointer text-sm px-4 py-2 hover:bg-gray-100"
                        >
                          {togglingUsers[user._id] ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : user.isActive ? (
                            <>
                              <ToggleLeft className="w-4 h-4 text-red-600" />
                              <span className="text-red-600 font-medium">Deactivate Account</span>
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-4 h-4 text-green-600" />
                              <span className="text-green-600 font-medium">Activate Account</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(user)}
                          disabled={!canDelete}
                        >
                          Delete
                        </DropdownMenuItem>
                        {user.markAsRead !== true && (
                          <DropdownMenuItem
                            onClick={() => handleMarkAsRead(user._id)}
                            className="text-blue-600 font-medium"
                          >
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleOpenAddressPopup(user)}
                          
                        >
                          Add Address
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile Card View */}
      {!isLoading && !isError && users.length > 0 && (
        <div className="md:hidden space-y-4">
          {users.map((user) => (
            <Card key={user._id} className="shadow-md">
              <CardContent className="pt-4">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Name:</span>{" "}
                      {user?.name || "N/A"}
                      {user.markAsRead !== true && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                          New
                        </span>
                      )}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <span className="cursor-pointer p-2 rounded-full hover:bg-gray-200">
                          <MoreVertical className="w-5 h-5" />
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                          View more
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenModal(user)}
                          disabled={!canEdit}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggle(user._id)}
                          disabled={togglingUsers[user._id]}
                          className="justify-center"
                        >
                          <div
                            className={`px-4 py-2 rounded-lg font-medium text-white transition-all duration-300 shadow-md w-full text-center
                              ${user.isActive
                                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                              }
                              ${togglingUsers[user._id]
                                ? "opacity-70 cursor-not-allowed"
                                : "hover:shadow-lg transform hover:scale-105"
                              }`}
                          >
                            {togglingUsers[user._id]
                              ? "Updating..."
                              : user.isActive
                                ? "Deactivate Now"
                                : "Activate Now"}
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(user)}
                          disabled={!canDelete}
                        >
                          Delete
                        </DropdownMenuItem>
                        {user.markAsRead !== true && (
                          <DropdownMenuItem
                            onClick={() => handleMarkAsRead(user._id)}
                            className="text-blue-600 font-medium"
                          >
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleOpenAddressPopup(user)}
                          disabled={!canEdit}
                        >
                          Add Address
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p>
                    <span className="font-medium">Email:</span> {user?.email || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Phone Number:</span>{" "}
                    {user?.phone || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Role:</span>{" "}
                    {user?.role?.role || "N/A"}
                  </p>
                  {/* <p>
                    <span className="font-medium">Email Status:</span>{" "}
                    <Badge
                      className={`${user?.email_verified ? "bg-green-500" : "bg-red-500"
                        } text-white rounded-2xl p-1`}
                    >
                      {user?.email_verified ? "Verified" : "Not Verified"}
                    </Badge>
                  </p> */}
                  <p>
                    <span className="font-medium">Account Status:</span>{" "}
                    <Badge
                      className={`rounded-2xl px-3 py-1 text-white font-medium ${user?.isActive ? "bg-emerald-600" : "bg-rose-600"
                        }`}
                    >
                      {user?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && users.length > 0 && (
        <Pagination className="mt-4 justify-end">
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
      )}

      {/* Modals */}
      {isUserDetailsOpen && selectedUser && (
        <UserDetails
          user={selectedUser}
          closeModal={() => setIsUserDetailsOpen(false)}
        />
      )}

      {isUserFormOpen && (
        <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
          <DialogContent className="max-w-lg sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{selectedUser ? "Edit User" : "Add User"}</DialogTitle>
            </DialogHeader>
            <UserForm
              user={selectedUser}
              closeModal={() => setIsUserFormOpen(false)}
              refetch={refetch}
            />
          </DialogContent>
        </Dialog>
      )}

      {addressPopup && (
        <Dialog open={addressPopup} onOpenChange={setAddressPopup}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Address</DialogTitle>
            </DialogHeader>
            <AddressForm
              user={selectedUser}
              closeModal={() => setAddressPopup(false)}
              refetch={refetch}
            />
          </DialogContent>
        </Dialog>
      )}

      {deletePopup && (
        <DeleteDialog
          open={deletePopup}
          onClose={() => setDeletePopup(false)}
          onConfirm={confirmDelete}
          title={`Are you sure you want to delete ${selectedUser?.name}?`}
        />
      )}
    </div>
  );
};

export default UserTable;
