import React, { useState, useContext } from 'react';
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2 } from 'lucide-react';
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import showToast from "@/toast/showToast";

// Create a QueryClient instance
const queryClient = new QueryClient();

const fetchRoles = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/role/fetch-all-role`);
  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }
  return response.json();
};

const RoleListContent = () => {
  const { user } = useContext(AuthContext);
  const { isSidebarOpen } = useSidebar();
  const [searchTerm, setSearchTerm] = useState('');
  const [newRole, setNewRole] = useState('');
  const [editRole, setEditRole] = useState({ id: null, role: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check permissions for the current page
  const currentPagePath = "subadmin/roles";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions.includes("edit") || false;
  const canDelete = pagePermissions?.actions.includes("delete") || false;

  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    showToast("Failed to load user permissions", "error");
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const handleSearch = () => {
    // Search logic is already handled by filtering below
  };

  const handleAddRole = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/role/create-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole.toUpperCase() }),
      });
      if (response.ok) {
        setIsDialogOpen(false);
        setNewRole('');
        refetch();
        showToast("Role created successfully", "success");
      } else {
        console.error('Failed to add role');
        showToast("Failed to create role", "error");
      }
    } catch (error) {
      console.error('Error adding role:', error);
      showToast("Error adding role", "error");
    }
  };

  const handleEditRole = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/role/update-role-by-id/${editRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: editRole.role.toUpperCase() }),
      });
      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditRole({ id: null, role: '' });
        refetch();
        showToast("Role updated successfully", "success");
      } else {
        console.error('Failed to update role');
        showToast("Failed to update role", "error");
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showToast("Error updating role", "error");
    }
  };

  const handleDeleteRole = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/role/delete-role-by-id/${roleToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setRoleToDelete(null);
        refetch();
        showToast("Role deleted successfully", "success");
      } else {
        console.error('Failed to delete role');
        showToast("Failed to delete role", "error");
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showToast("Error deleting role", "error");
    }
  };

  const filteredRoles = data?.data?.filter((role) =>
    role.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className={`${isSidebarOpen ? 'lg:p-6 lg:ml-56' : 'lg:p-4 lg:ml-16'} `}>
      <div className="p-2">
        <h1 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold w-fit mb-3">Role Management</h1>
        
        {/* Search and Add Role Controls */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleSearch}  className="cursor-pointer bg-[#153171] hover:bg-[#0c1f4d] " >Search</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={!canEdit}
                title={!canEdit ? "You do not have permission to add roles" : "Add role"}
                className="cursor-pointer bg-[#153171] hover:bg-[#0c1f4d] "
              >
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Role</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    placeholder="Enter role name"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleAddRole}   className="cursor-pointer bg-[#153171] hover:bg-[#0c1f4d] " disabled={!newRole}>
                Create Role
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Roles Listing */}
        {isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>Error: {error.message}</div>
        ) : (
          <div>
            {/* Table view for larger screens */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-[#0c1f4d]">
                  <TableRow >
                    <TableHead  className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">ID</TableHead>
                    <TableHead  className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Role</TableHead>
                    <TableHead  className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRoles.length > 0 ? (
                    currentRoles.map((role) => (
                      <TableRow key={role.id} className="bg-white hover:bg-gray-100 text-black">
                        <TableCell>{role.id}</TableCell>
                        <TableCell>{role.role}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditRole({ id: role.id, role: role.role });
                                setIsEditDialogOpen(true);
                              }}
                              disabled={!canEdit}
                              className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setRoleToDelete(role.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              disabled={!canDelete}
                              className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="bg-white text-black">
                      <TableCell colSpan={3} className="text-center">
                        No roles found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Card view for mobile screens */}
            <div className="md:hidden space-y-4">
              {currentRoles.length > 0 ? (
                currentRoles.map((role) => (
                  <Card key={role.id} className="shadow-md">
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center">
                          <p><span className="font-medium">ID:</span> {role.id}</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditRole({ id: role.id, role: role.role });
                                setIsEditDialogOpen(true);
                              }}
                              disabled={!canEdit}
                              className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setRoleToDelete(role.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              disabled={!canDelete}
                              className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p><span className="font-medium">Role:</span> {role.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-600 text-sm py-4">No roles found</p>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  placeholder="Enter role name"
                  value={editRole.role}
                  onChange={(e) => setEditRole({ ...editRole, role: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleEditRole} disabled={!editRole.role}>
              Update Role
            </Button>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this role?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteRole}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const RoleList = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RoleListContent />
    </QueryClientProvider>
  );
};

export default RoleList;