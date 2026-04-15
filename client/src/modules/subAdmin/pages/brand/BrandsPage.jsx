import { useState, useEffect, useContext } from 'react';
import {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from '@/redux/api/BrandApi';
import {
  useUploadBrandImageMutation,
  useDeleteBrandImageMutation
} from "@/redux/api/BrandImageApi";
import { useGetUserByIdQuery } from '@/redux/api/SubAdminAccessRequestApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Trash2, Edit, Plus, Loader2, FilePenLine, PlusCircle, Briefcase } from 'lucide-react';
import DeleteDialog from '@/model/DeleteModel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import showToast from '@/toast/showToast';

const AdminBrands = () => {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const { isSidebarOpen } = useSidebar();
  const [limit] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [formData, setFormData] = useState({ brand_name: '', image_url: '', link: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState('');

  const user_id = user?.user._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(user_id, { skip: !user_id });

  // ────── Permissions ──────
  const currentPagePath = "others/brands";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canCreate = pagePermissions?.actions?.includes("create") || false;
  const canEdit = pagePermissions?.actions?.includes("edit") || false;
  const canDelete = pagePermissions?.actions?.includes("delete") || false;

  const { data, isLoading, isFetching, error } = useGetBrandsQuery({ page, limit });
  const [createBrand, { isLoading: creating, isError: createError, isSuccess: createSuccess }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: updating, isError: updateError, isSuccess: updateSuccess }] = useUpdateBrandMutation();
  const [deleteBrand, { isLoading: deleting, isError: deleteError, isSuccess: deleteSuccess }] = useDeleteBrandMutation();
  const [uploadBrandImage, { isLoading: uploading, isError: uploadError, isSuccess: uploadSuccess }] = useUploadBrandImageMutation();
  const [deleteBrandImage, { isLoading: deletingImage, isError: deleteImageError, isSuccess: deleteImageSuccess }] = useDeleteBrandImageMutation();

  // ────── Toast handling (same pattern as Contact page) ──────
  useEffect(() => {
    if (isUserError) {
      const toastId = 'user-permission';
      showToast("Failed to load user permissions", "error", toastId);
    }
  }, [isUserError, userError]);

  // CREATE
  useEffect(() => {
    if (createSuccess) {
      const toastId = 'create-brand';
      showToast("Brand created successfully", "success", toastId);
      // reset dialog
      setOpenDialog(false);
      setEditBrand(null);
      setFormData({ brand_name: '', image_url: '', link: '' });
      setImagePreview(null);
      setImageFile(null);
      setImageError('');
    }
  }, [createSuccess]);

  // UPDATE
  useEffect(() => {
    if (updateSuccess) {
      const toastId = 'update-brand';
      showToast("Brand updated successfully", "success", toastId);
      setOpenDialog(false);
      setEditBrand(null);
      setFormData({ brand_name: '', image_url: '', link: '' });
      setImagePreview(null);
      setImageFile(null);
      setImageError('');
    }
  }, [updateSuccess]);

  // DELETE
  useEffect(() => {
    if (deleteSuccess) {
      const toastId = 'delete-brand';
      showToast("Brand deleted successfully", "success", toastId);
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    }
  }, [deleteSuccess]);

  // IMAGE UPLOAD
  useEffect(() => {
    if (uploadSuccess) {
      const toastId = 'upload-image';
      showToast("Image uploaded successfully", "success", toastId);
    }
  }, [uploadSuccess]);

  // IMAGE DELETE
  useEffect(() => {
    if (deleteImageSuccess) {
      const toastId = 'delete-image';
      showToast("Image deleted successfully", "success", toastId);
    }
  }, [deleteImageSuccess]);

  // ────── Resize handling ──────
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ────── Search & pagination ──────
  const filteredBrands = data?.data?.filter((brand) => {
    const brandName = brand.brand_name?.toLowerCase() || '';
    const link = brand.link?.toLowerCase() || '';
    return brandName.includes(searchQuery.toLowerCase()) || link.includes(searchQuery.toLowerCase());
  }) || [];

  const totalBrands = filteredBrands.length;
  const totalPages = Math.ceil(totalBrands / limit);
  const startIndex = (page - 1) * limit;
  const displayedBrands = filteredBrands.slice(startIndex, startIndex + limit);

  // ────── Image upload / delete ──────
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // delete old image if editing
    if (editBrand && editBrand.image_url && editBrand.image_url !== imagePreview) {
      try {
        const oldFilename = editBrand.image_url.split('/').pop();
        await deleteBrandImage({
          entity_type: 'brand',
          company_name: 'admin',
          filename: oldFilename,
        }).unwrap();
      } catch (err) {
        setImageError('Failed to replace old image. Please try again.');
        return;
      }
    }

    const uploadFormData = new FormData();
    uploadFormData.append('brand_image', file);
    uploadFormData.append('entity_type', 'brand');
    uploadFormData.append('company_name', 'admin');

    try {
      setImageError('');
      const res = await uploadBrandImage(uploadFormData).unwrap();
      if (res.success) {
        setFormData({ ...formData, image_url: res.data.fileUrl });
        setImagePreview(res.data.fileUrl);
        setImageFile(null);
      }
    } catch (err) {
      setImageError('Image upload failed. Please try again.');
    }
  };

  const handleImageDelete = async () => {
    if (!imagePreview) return;
    try {
      const filename = imagePreview.split('/').pop();
      await deleteBrandImage({
        entity_type: 'brand',
        company_name: 'admin',
        filename,
      }).unwrap();
      setImagePreview(null);
      setFormData({ ...formData, image_url: '' });
      setImageError('');
    } catch (err) {
      setImageError('Failed to delete image. Please try again.');
    }
  };

  // ────── Form submit ──────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      if (editBrand) {
        await updateBrand({ id: editBrand._id, ...formData }).unwrap();
      } else {
        await createBrand(formData).unwrap();
      }
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  // ────── Delete brand ──────
  const handleDelete = async () => {
    if (!brandToDelete) return;
    try {
      if (brandToDelete.image_url) {
        const filename = brandToDelete.image_url.split('/').pop();
        await deleteBrandImage({
          entity_type: 'brand',
          company_name: 'admin',
          filename,
        }).unwrap();
      }
      await deleteBrand(brandToDelete._id).unwrap();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const STRICT_URL_REGEX = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/;
  const isFormValid =
    formData.brand_name.trim() &&
    formData.image_url &&
    STRICT_URL_REGEX.test(formData.link.trim());

  const errorMessage =
    createError?.data?.message ||
    updateError?.data?.message ||
    deleteError?.data?.message ||
    uploadError?.data?.message ||
    deleteImageError?.data?.message ||
    imageError ||
    (error ? error.message || 'Failed to fetch brands' : null);

  if (error) {
    return (
      <div className="container mx-auto lg:p-4 text-red-500">
        Error fetching brands: {error.message}{" "}
        <button onClick={() => window.location.reload()} className="underline text-[#0c1f4d]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${isSidebarOpen ? 'lg:p-6 lg:ml-56' : 'lg:p-4 lg:ml-16'}`}>
      <div className="container mx-auto lg:p-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <h2 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
            Manage Brands
          </h2>
          <div className="flex gap-4 ml-auto">
            <Button
              onClick={() => setOpenDialog(true)}
              className="flex items-center bg-[#0c1f4d] hover:bg-[#0a1d49f7] text-white"
              title={!canCreate ? "You do not have permission to add brands" : "Add brand"}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Brand
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="flex items-center bg-[#0c1f4d] hover:bg-[#0a1d49f7] text-white"
            >
              Refresh
            </Button>
            <Input
              type="text"
              placeholder="Search by brand name or link..."
              className="w-72"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {/* SOP / Brand Management Guidelines */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Briefcase className="text-purple-600 mt-1 shrink-0" size={24} />
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-purple-900">
                Brand & Partner Logo SOP
              </h2>
              <p className="text-sm text-purple-800">
                Manage the logos displayed in the "Our Trusted Partners" section. Ensure all logos are visually consistent.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {/* Instruction 1: Add New */}
                <div className="bg-white/60 p-3 rounded border border-purple-100">
                  <div className="flex items-center gap-2 mb-1">
                    <PlusCircle className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-gray-900 text-sm">Add New Brand</span>
                  </div>
                  <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                    <li>Use <strong>Transparent PNG</strong> or SVG files.</li>
                    <li>Ensure the website Link is valid.</li>
                  </ul>
                </div>

                {/* Instruction 2: Edit */}
                <div className="bg-white/60 p-3 rounded border border-purple-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FilePenLine className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900 text-sm">Update Details</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Click <strong>Edit</strong> to replace an outdated logo or fix a broken redirection link. Changes apply immediately to the live site.
                  </p>
                </div>

                {/* Instruction 3: Delete */}
                <div className="bg-white/60 p-3 rounded border border-purple-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-gray-900 text-sm">Remove Brand</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Use <strong>Delete</strong> only when a partnership has ended. This permanently removes the logo from the homepage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Global error */}
        {errorMessage && (
          <Alert className="mb-4 bg-red-500 text-white" variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Desktop Table */}
        {!isMobile ? (
          <div className="border">
            {isLoading || isFetching ? (
              <div className="p-4">
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table className="min-w-[800px] w-full divide-y divide-gray-200 bg-white">
                <TableHeader className="bg-[#0c1f4d] group-hover:bg-[#0a1d49f7]">
                  <TableRow>
                    <TableHead className="text-white">S.No</TableHead>
                    <TableHead className="text-white">Brand Name</TableHead>
                    <TableHead className="text-white">Image</TableHead>
                    <TableHead className="text-white">Link</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedBrands.length > 0 ? (
                    displayedBrands.map((brand, index) => (
                      <TableRow key={brand._id}>
                        <TableCell>{startIndex + index + 1}</TableCell>
                        <TableCell>{brand.brand_name}</TableCell>
                        <TableCell>
                          {brand.image_url ? (
                            <img src={brand.image_url} alt={brand.brand_name} className="h-12 w-12 object-cover rounded" />
                          ) : (
                            'No Image'
                          )}
                        </TableCell>
                        <TableCell>{brand.link}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            className="cursor-pointer"
                            size="sm"
                            onClick={() => {
                              setEditBrand(brand);
                              setFormData({ ...brand, brand_name: brand.brand_name || '', link: brand.link || '' });
                              setImagePreview(brand.image_url || null);
                              setImageError('');
                              setOpenDialog(true);
                            }}
                            disabled={!canEdit}
                            title={!canEdit ? "You do not have permission to edit brands" : "Edit brand"}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            className="cursor-pointer"
                            size="sm"
                            onClick={() => {
                              setBrandToDelete(brand);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={!canDelete}
                            title={!canDelete ? "You do not have permission to delete brands" : "Delete brand"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No brands found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          /* Mobile Cards */
          <div className="space-y-4">
            {isLoading || isFetching ? (
              <div className="p-4">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : displayedBrands.length > 0 ? (
              displayedBrands.map((brand, index) => (
                <Card key={brand._id} className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">{brand.brand_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>S.No:</strong> {startIndex + index + 1}</p>
                    <div>
                      <strong>Image:</strong>{' '}
                      {brand.image_url ? (
                        <img src={brand.image_url} alt={brand.brand_name} className="h-16 w-16 object-cover rounded mt-2" />
                      ) : (
                        <span className="text-gray-500">No Image</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>Link:</strong> {brand.link}
                    </p>
                    <div className="flex space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => {
                          setEditBrand(brand);
                          setFormData({ ...brand, brand_name: brand.brand_name || '', link: brand.link || '' });
                          setImagePreview(brand.image_url || null);
                          setImageError('');
                          setOpenDialog(true);
                        }}
                        disabled={!canEdit}
                        title={!canEdit ? "You do not have permission to edit brands" : "Edit brand"}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => {
                          setBrandToDelete(brand);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={!canDelete}
                        title={!canDelete ? "You do not have permission to delete brands" : "Delete brand"}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No brands found</div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalBrands > 0 && (
          <Pagination className="mt-4 flex justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1 && !isFetching) setPage(p => p - 1);
                  }}
                  className={page === 1 || isFetching ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                />
              </PaginationItem>

              {isMobile ? (
                <PaginationItem>
                  <PaginationLink isActive>{page}</PaginationLink>
                </PaginationItem>
              ) : (
                [...Array(totalPages).keys()].map(i => {
                  const pg = i + 1;
                  if (pg === 1 || pg === totalPages || (pg >= page - 1 && pg <= page + 1)) {
                    return (
                      <PaginationItem key={pg}>
                        <PaginationLink
                          href="#"
                          isActive={page === pg}
                          onClick={(e) => { e.preventDefault(); if (!isFetching) setPage(pg); }}
                          className="cursor-pointer"
                        >
                          {pg}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if ((pg === page - 2 && page > 3) || (pg === page + 2 && page < totalPages - 2)) {
                    return <PaginationItem key={pg}><PaginationEllipsis /></PaginationItem>;
                  }
                  return null;
                })
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages && !isFetching) setPage(p => p + 1);
                  }}
                  className={page >= totalPages || isFetching ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Add / Edit Dialog */}
        <Dialog
          open={openDialog}
          onOpenChange={(open) => {
            setOpenDialog(open);
            if (!open) {
              setEditBrand(null);
              setFormData({ brand_name: '', image_url: '', link: '' });
              setImagePreview(null);
              setImageFile(null);
              setImageError('');
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
              <DialogDescription>Enter brand details below.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="brand_name" className="mb-2">Brand Name</Label>
                <Input
                  id="brand_name"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  required
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <Label htmlFor="image" className="mb-2">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading || deletingImage}
                />
                {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}
                {uploading && <p className="text-blue-500 text-sm">Uploading...</p>}
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded border" />

                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="link" className="mb-2">Link</Label>
                <Input
                  id="link"
                  type="text"
                  value={formData.link}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, link: val });
                  }}
                  required
                  placeholder="https://example.com"
                  className={formData.link && !STRICT_URL_REGEX.test(formData.link) ? "border-red-500" : ""}
                />
                {formData.link && !STRICT_URL_REGEX.test(formData.link) && (
                  <p className="text-red-500 text-[10px] mt-1 font-medium">
                    Missing domain extension (e.g., .com, .in, .org)
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" className="cursor-pointer" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={!isFormValid || creating || updating || uploading || deletingImage}
                >
                  {(creating || updating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editBrand ? 'Update' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <DeleteDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Brand"
          description="Are you sure you want to delete this brand? This action cannot be undone."
          isLoading={deleting || deletingImage}
        />
      </div>
    </div>
  );
};

export default AdminBrands;
