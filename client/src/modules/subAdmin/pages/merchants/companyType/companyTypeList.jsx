"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import showToast from "@/toast/showToast";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Plus } from "lucide-react";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

const companyTypeSchema = z.object({
    displayName: z.string().min(2, { message: "Display name is required" }),
    name: z
        .string()
        .min(2, { message: "Internal name is required" })
        .regex(/^[a-z0-9-]+$/, {
            message: "Only lowercase letters, numbers, hyphens allowed",
        }),
    description: z.string().optional(),
    order: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
});



export default function CompanyTypeList() {
    const [companyTypes, setCompanyTypes] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const form = useForm({
        resolver: zodResolver(companyTypeSchema),
        defaultValues: {
            displayName: "",
            name: "",
            description: "",
            order: 0,
            isActive: true,
        },
    });

    // ─── Fetch function ───────────────────────────────────────────────
    const fetchCompanyTypes = async (page) => {
        setLoading(true);
        setError(null);

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/company-types?page=${page}&limit=${ITEMS_PER_PAGE}`
            );

            if (res.data.success) {
                setCompanyTypes(res.data.data || []);
                setTotalItems(res.data.pagination?.total || 0);
                setCurrentPage(res.data.pagination?.page || page);
            } else {
                setError(res.data.message || "Failed to load company types");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.response?.data?.message || "Network error");
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchCompanyTypes(1);
    }, []);

    // Refetch when page changes
    useEffect(() => {
        fetchCompanyTypes(currentPage);
    }, [currentPage]);

    const onSubmit = async (values) => {
        try {
            if (editItem) {
                await axios.patch(
                    `${import.meta.env.VITE_API_URL}/company-types/${editItem._id}`,
                    values
                );
                showToast("Company type updated successfully", "success");
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/company-types`, values);
                showToast("Company type created successfully", "success");
            }
            setDialogOpen(false);
            fetchCompanyTypes(currentPage);
        } catch (err) {
            const msg = err.response?.data?.message || "Operation failed";
            form.setError("root", { message: msg });
            showToast(msg, "error");
        }
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDeactivate = async () => {
        if (!itemToDelete) return;
        setDeleting(true);
        try {
            await axios.patch(
                `${import.meta.env.VITE_API_URL}/company-types/${itemToDelete}/deactivate`
            );
            showToast("Company type deactivated successfully", "success");
            fetchCompanyTypes(currentPage);
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to deactivate company type";
            showToast(msg, "error");
        } finally {
            setDeleting(false);
        }
    };

    const handleEditClick = (item) => {
        setEditItem(item);
        setDialogOpen(true);
    };

    const handleAddClick = () => {
        setEditItem(null);
        setDialogOpen(true);
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Company Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <div className="flex flex-row mb-6 items-center justify-between">
                    <div>
                        <h2 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold" >Company Types</h2>

                    </div>
                    <Button onClick={handleAddClick} className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4d]">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New
                    </Button>
                </div>

                <div>
                    {/* Desktop Table */}
                    <div className="hidden md:block rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#0c1f4d] border-b hover:bg-[#153171] border-gray-300">
                                    <TableHead className="text-xs sm:text-sm font-medium text-white">Display Name</TableHead>
                                    <TableHead className="text-xs sm:text-sm font-medium text-white">Slug</TableHead>
                                    <TableHead className="text-xs sm:text-sm font-medium text-white">Description</TableHead>
                                    <TableHead className="text-xs sm:text-sm font-medium text-white">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {companyTypes.map((type) => (
                                    <TableRow key={type._id}>
                                        <TableCell className="font-medium">{type.displayName}</TableCell>
                                        <TableCell>{type.name}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {type.description || "—"}
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(type)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive/90"
                                                onClick={() => handleDeleteClick(type._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {companyTypes.map((type) => (
                            <Card key={type._id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{type.displayName}</CardTitle>
                                    <p className="text-sm text-muted-foreground">/{type.name}</p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm mb-4">
                                        {type.description || "No description"}
                                    </p>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditClick(type)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteClick(type._id)}
                                        >
                                            Deactivate
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination */}
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

                    {companyTypes.length === 0 && !loading && (
                        <div className="text-center py-12 text-muted-foreground">
                            No company types found.
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Add / Edit Dialog ─── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? "Edit Company Type" : "Add Company Type"}
                        </DialogTitle>
                        <DialogDescription>
                            {editItem
                                ? "Modify the existing company type."
                                : "Create a new company type entry."}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
                            {form.formState.errors.root && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        {form.formState.errors.root.message}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Private Limited" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Internal Name (slug) *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="private-limited" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            lowercase, numbers and hyphens only
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Optional description..."
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="gap-2 px-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-[#0c1f4d] cursor-pointer hover:bg-[#153171] text-white min-w-[100px]" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting
                                        ? "Saving..."
                                        : editItem
                                            ? "Update"
                                            : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* ─── Deactivate Confirmation ─── */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deactivation</DialogTitle>
                        <DialogDescription>
                            This company type will no longer appear in selection menus.
                            Historical records will remain unaffected.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeactivate}
                            disabled={deleting}
                        >
                            {deleting ? "Deactivating..." : "Deactivate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
