import React, { useState } from 'react';
import { useSidebar } from "../../hooks/useSidebar";
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, LockKeyhole, Edit3, Network, AlertTriangle } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import showToast from '@/toast/showToast';

// Create a QueryClient instance
const queryClient = new QueryClient();

const fetchRoles = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/role/fetch-all-role`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch roles');
  }
  return response.json();
};

const RoleListContent = () => {
  const { isSidebarOpen } = useSidebar();
  const [searchTerm, setSearchTerm] = useState('');
  const [newRole, setNewRole] = useState('');
  const [editRole, setEditRole] = useState({ id: null, role: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rolesPerPage = 10;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });

  const handleAddRole = async () => {
    if (!newRole.trim()) {
      showToast('Role name cannot be empty', 'error');
      return;
    }

    const allowedRoles = ["USER", "MERCHANT", "SERVICE_PROVIDER", "SUB_DEALER", "GROCERY_SELLER", "STUDENT", "ADMIN", "SUB_ADMIN"];
    if (!allowedRoles.includes(newRole.toUpperCase())) {
      showToast(`Role must be one of: ${allowedRoles.join(', ')}`, 'error');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/role/create-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole.toUpperCase() }),
      });
      if (response.ok) {
        showToast('Role created successfully', 'success');
        setIsDialogOpen(false);
        setNewRole('');
        setCurrentPage(1);
        refetch();
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to add role', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error adding role', 'error');
    }
  };

  const handleEditRole = async () => {
    if (!editRole.role.trim()) {
      showToast('Role name cannot be empty', 'error');
      return;
    }

    const allowedRoles = ["USER", "MERCHANT", "SERVICE_PROVIDER", "SUB_DEALER", "GROCERY_SELLER", "STUDENT", "ADMIN", "SUB_ADMIN"];
    if (!allowedRoles.includes(editRole.role.toUpperCase())) {
      showToast(`Role must be one of: ${allowedRoles.join(', ')}`, 'error');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/role/update-role-by-id/${editRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: editRole.role.toUpperCase() }),
      });
      if (response.ok) {
        showToast('Role updated successfully', 'success');
        setIsEditDialogOpen(false);
        setEditRole({ id: null, role: '' });
        setCurrentPage(1);
        refetch();
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to update role', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error updating role', 'error');
    }
  };

  const handleDeleteRole = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/role/delete-role-by-id/${roleToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showToast('Role deleted successfully', 'success');
        setIsDeleteDialogOpen(false);
        setRoleToDelete(null);
        setCurrentPage(1);
        refetch();
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to delete role', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error deleting role', 'error');
    }
  };

  const filteredRoles = data?.data?.filter((role) =>
    role.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const indexOfFirstItem = (currentPage - 1) * rolesPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirstItem, indexOfFirstItem + rolesPerPage);
  const totalPages = Math.ceil(filteredRoles.length / rolesPerPage);

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

  return (
    <div className={` ${isSidebarOpen ? 'lg:ml-56' : 'lg:ml-16'}`}>
      <h1 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Role Management</h1>
      {/* ---------------------------------------------------------------------------
            LEFT PANEL: RBAC SOP
           --------------------------------------------------------------------------- */}
      <div className="xl:col-span-1">

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
            RBAC Protocols
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Standard Operating Procedures for defining system-level access roles. <span className='text-red-600'>don't access this page without root admin permission</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 space-y-4 mb-4 md:space-y-0">

          {/* SOP 1: Hierarchy */}
          <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <Network size={16} className="text-blue-600" />
                1. Role Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                Define roles based on business function (e.g., <em>Manager</em>, <em>Editor</em>), not individual names.
                <br />
                <span className="italic">Avoid creating duplicate roles with overlapping permissions.</span>
              </p>
            </CardContent>
          </Card>

          {/* SOP 2: Modification */}
          <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <Edit3 size={16} className="text-amber-600" />
                2. Update Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                Editing a <strong>Role Name</strong> updates it system-wide immediately.
                <br />
                Ensure the new name clearly reflects the permissions attached to avoid confusion during audits.
              </p>
            </CardContent>
          </Card>

          {/* SOP 3: Deletion Safety */}
          <Card className="border-l-4 border-l-red-600 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <LockKeyhole size={16} className="text-red-600" />
                3. Deletion Hazards
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="bg-red-50 p-2 rounded border border-red-100 mb-2">
                <p className="text-[10px] font-bold text-red-700 flex items-center gap-1">
                  <AlertTriangle size={10} /> WARNING
                </p>
                <p className="text-[10px] text-red-600 leading-tight">
                  Do not delete a role assigned to active users. This will orphan their accounts.
                </p>
              </div>
              <p className="text-xs text-slate-600">
                <strong>Reassign</strong> all users to a new role before deleting the old one.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ---------------------------------------------------------------------------
            RIGHT PANEL: ROLE TABLE
           --------------------------------------------------------------------------- */}

      {/* Search and Add Role Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
        <Input
          placeholder="e.g. Search roles"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm rounded-md border-2 border-slate-300 focus:ring-2 focus:ring-gray-900 text-sm"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c204ddc] text-white text-sm px-4 py-2 w-full sm:w-auto">
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm sm:max-w-md bg-white rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add New Role</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-sm">Role</Label>
                <Input
                  id="role"
                  placeholder="e.g. MANAGER"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="text-sm border-2 border-slate-300"
                />
              </div>
            </div>
            <Button
              onClick={handleAddRole}
              disabled={!newRole.trim()}
              className="bg-[#1c1b20] hover:bg-[#c0302c] text-white text-sm"
            >
              Create Role
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading/Error States */}
      {isLoading && (
        <div className="text-center py-4 text-gray-600 text-sm">
          Loading roles...
        </div>
      )}
      {error && (
        <div className="text-center py-4 text-red-500 text-sm">
          Error: {error.message}
        </div>
      )}
      {!isLoading && !error && filteredRoles.length === 0 && (
        <div className="text-center py-4 text-gray-600 text-sm">
          No roles found
        </div>
      )}

      {/* Mobile Card View */}
      {!isLoading && !error && filteredRoles.length > 0 && (
        <div className="sm:hidden space-y-4">
          {currentRoles.map((role, index) => (
            <Card
              key={role.id}
              className="border rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-900">
                    {role.role || 'N/A'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditRole({ id: role.id, role: role.role });
                        setIsEditDialogOpen(true);
                        showToast(`Editing role: ${role.role}`, 'info');
                      }}
                      className="bg-[#1c1b20] hover:bg-[#c0302c] text-white text-sm px-3 py-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setRoleToDelete(role.id);
                        setIsDeleteDialogOpen(true);
                        showToast(`Preparing to delete role: ${role.role}`, 'info');
                      }}
                      className="bg-[#1c1b20] hover:bg-[#c0302c] text-white text-sm px-3 py-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">S.No:</span> {indexOfFirstItem + index + 1}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">ID:</span> {role.id || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Desktop Table View */}
      {!isLoading && !error && filteredRoles.length > 0 && (
        <div className="hidden sm:block">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-0">
              <Table>
                <TableHeader className="bg-[#0c1f4d]">
                  <TableRow >
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">ID</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Role</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRoles.map((role) => (
                    <TableRow key={role.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm text-gray-600">{role.id || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{role.role || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditRole({ id: role.id, role: role.role });
                              setIsEditDialogOpen(true);
                              showToast(`Editing role: ${role.role}`, 'info');
                            }}
                            className="bg-[#1c1b20] hover:bg-[#c0302c] text-white text-sm px-3 py-1"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setRoleToDelete(role.id);
                              setIsDeleteDialogOpen(true);
                              showToast(`Preparing to delete role: ${role.role}`, 'info');
                            }}
                            className="bg-[#1c1b20] hover:bg-[#c0302c] text-white text-sm px-3 py-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && filteredRoles.length > 0 && (
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
              {renderPages()}
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
      )}

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-sm sm:max-w-md bg-white rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Role</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-role" className="text-sm">Role</Label>
              <Input
                id="edit-role"
                placeholder="e.g. MANAGER"
                value={editRole.role}
                onChange={(e) => setEditRole({ ...editRole, role: e.target.value })}
                className="text-sm border-2 border-slate-300"
              />
            </div>
          </div>
          <Button
            onClick={handleEditRole}
            disabled={!editRole.role.trim()}
            className="bg-[#1c1b20] hover:bg-[#c0302c] text-white text-sm"
          >
            Update Role
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm sm:max-w-md bg-white rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Are you sure you want to delete this role?</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-sm border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteRole}
              className="bg-[#1c1b20] hover:bg-[#c0302c] text-white text-sm"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
