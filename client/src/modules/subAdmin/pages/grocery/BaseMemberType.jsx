"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Loader2, Search } from "lucide-react";
import showToast from "@/toast/showToast";

const ITEMS_PER_PAGE = 10;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function BaseMemberType() {
  const [types, setTypes] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newHasFullAccess, setNewHasFullAccess] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editHasFullAccess, setEditHasFullAccess] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchTypes = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = { page, limit: ITEMS_PER_PAGE };
      if (search.trim()) params.search = search.trim();

      const response = await api.get("/base-member-types/fetch-all-base-member-types", {
        params,
      });

      if (response.data.success) {
        setTypes(response.data.data || []);
        setTotalItems(response.data.pagination?.totalRecords || 0);
        setCurrentPage(response.data.pagination?.currentPage || page);
      } else {
        throw new Error(response.data.message || "Failed to fetch types");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showToast(err.response?.data?.message || "Could not load base member types", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes(1, searchTerm);
  }, []);

  useEffect(() => {
    fetchTypes(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchTypes(1, value);
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      showToast("Name is required", "error");
      return;
    }

    try {
      const res = await api.post("/base-member-types/create-base-member-type", { name: trimmed, has_full_access: newHasFullAccess });
      if (res.data.success) {
        showToast("Created successfully", "success");
        setNewName("");
        setNewHasFullAccess(false);
        setIsAddOpen(false);
        fetchTypes(currentPage, searchTerm);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create", "error");
    }
  };

  const handleEdit = async () => {
    const trimmed = editName.trim();
    if (!trimmed || !editId) return;

    try {
      const res = await api.put(`/base-member-types/update-base-member-type/${editId}`, { name: trimmed, has_full_access: editHasFullAccess });
      if (res.data.success) {
        showToast("Updated successfully", "success");
        setEditId(null);
        setEditName("");
        setEditHasFullAccess(false);
        setIsEditOpen(false);
        fetchTypes(currentPage, searchTerm);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await api.delete(`/base-member-types/delete-base-member-type/${deleteId}`);
      if (res.data.success) {
        showToast("Deleted successfully", "success");
        setDeleteId(null);
        fetchTypes(currentPage, searchTerm);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const openEdit = (typeItem) => {
    setEditId(typeItem._id);
    setEditName(typeItem.name);
    setEditHasFullAccess(typeItem.has_full_access || false);
    setIsEditOpen(true);
  };

  const getDisplayName = (name) => name.replace(/_/g, " ");

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="container mx-auto py-10  space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <h2 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold">Base Member Types</h2>

          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. Gold Member"
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9 border-2 border-slate-300"
              />
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#153171] text-white cursor-pointer hover:bg-[#153171eb]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Base Member Type</DialogTitle>
                  <DialogDescription>
                    Enter name (will be normalized for display)
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input
                      placeholder="e.g. Platinum Member"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
                      className="border-2 border-slate-300"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="newFullAccess"
                      checked={newHasFullAccess} 
                      onChange={(e) => setNewHasFullAccess(e.target.checked)} 
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="newFullAccess" className="text-sm font-medium cursor-pointer">
                      Grant Full Access (bypass restrictions)
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-6">
          {/* Showing range info */}
          {types.length > 0 && !loading && (
            <div className="text-sm text-muted-foreground text-center md:text-left">
              Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> types
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : types.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No base member types found.
              {searchTerm && " Try clearing the search."}
            </div>
          ) : (
            <>
              {/* ─── Desktop: Table ─── */}
              <div className="hidden md:block rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0c1f4d] border-b hover:bg-[#153171] border-gray-300">
                      <TableHead className=" w-[40%] text-xs sm:text-sm font-medium text-white">Name</TableHead>
                      <TableHead className="w-[30%] text-xs sm:text-sm font-medium text-white">Display Name</TableHead>
                      <TableHead className="w-[15%] text-xs sm:text-sm font-medium text-white">Full Access</TableHead>
                      <TableHead className="w-[15%] text-xs sm:text-sm font-medium text-white text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {types.map((type) => (
                      <TableRow key={type._id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell>{getDisplayName(type.name)}</TableCell>
                        <TableCell>
                          {type.has_full_access ? (
                            <Badge className="bg-green-600 hover:bg-green-600">Yes</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(type)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => setDeleteId(type._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ─── Mobile: Cards ─── */}
              <div className="md:hidden space-y-4">
                {types.map((type) => (
                  <Card key={type._id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        {type.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Display: {getDisplayName(type.name)}
                      </p>
                      <div className="mt-2">
                        {type.has_full_access ? (
                          <Badge className="bg-green-600 hover:bg-green-600">Full Access: Yes</Badge>
                        ) : (
                          <Badge variant="secondary">Full Access: No</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(type)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(type._id)}
                      >
                        Delete
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ─── Pagination (visible on both desktop & mobile) ─── */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Base Member Type</DialogTitle>
            <DialogDescription>Update the name of this type.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Update Member Name"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleEdit())}
                className="border-2 border-slate-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="editFullAccess"
                checked={editHasFullAccess} 
                onChange={(e) => setEditHasFullAccess(e.target.checked)} 
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="editFullAccess" className="text-sm font-medium cursor-pointer">
                Grant Full Access (bypass restrictions)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the base member type. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BaseMemberType;
