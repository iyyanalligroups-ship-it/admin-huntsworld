import { useState, useEffect } from 'react';
import {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from '@/redux/api/BrandApi';
import {
  useUploadBrandImageMutation,
  useDeleteBrandImageMutation,
} from '@/redux/api/BrandImageApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Trash2, Edit, Plus, Loader2, FilePenLine, PlusCircle, Briefcase } from 'lucide-react';
import DeleteDialog from '@/model/DeleteModel';
import { Skeleton } from '@/components/ui/skeleton';
import { useSidebar } from '../../hooks/useSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import showToast from '@/toast/showToast';

const AdminBrands = () => {
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
  const [urlError, setUrlError] = useState('');
  const { data, isLoading, isFetching } = useGetBrandsQuery({ page, limit });
  const [createBrand, { isLoading: creating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: updating }] = useUpdateBrandMutation();
  const [deleteBrand, { isLoading: deleting }] = useDeleteBrandMutation();
  const [uploadBrandImage, { isLoading: uploading }] = useUploadBrandImageMutation();
  const [deleteBrandImage, { isLoading: deletingImage }] = useDeleteBrandImageMutation();
  // This regex requires https://, a domain name, a dot, and a TLD (com, in, etc.)
  const STRICT_URL_REGEX = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/;
  // Validates: brand name, image exists, and link matches HTTPS pattern
  const isFormValid =
    formData.brand_name.trim() &&
    formData.image_url &&
    STRICT_URL_REGEX.test(formData.link.trim());
  // Handle window resize to toggle mobile view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset form and dialog on successful create/update
  useEffect(() => {
    if (openDialog && !creating && !updating) {
      setOpenDialog(false);
      setEditBrand(null);
      setFormData({ brand_name: '', image_url: '', link: '' });
      setImagePreview(null);
      setImageFile(null);
      setImageError('');
    }
  }, [creating, updating]);

  // Toast notification handler
  const handleToastNotification = (success, message, defaultErrorMessage) => {
    if (success) {
      showToast(message, 'success');
    } else {
      showToast(message || defaultErrorMessage, 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (editBrand && editBrand.image_url && editBrand.image_url !== imagePreview) {
        try {
          const oldFilename = editBrand.image_url.split('/').pop();
          await deleteBrandImage({
            entity_type: 'brand',
            company_name: 'admin',
            filename: oldFilename,
          }).unwrap();
          handleToastNotification(true, 'Old image deleted successfully', 'Failed to delete old image');
        } catch (error) {
          console.error('Failed to delete old image:', error);
          setImageError('Failed to replace old image. Please try again.');
          handleToastNotification(false, error?.data?.message, 'Failed to delete old image');
          return;
        }
      }

      const uploadFormData = new FormData();
      uploadFormData.append('brand_image', file);
      uploadFormData.append('entity_type', 'brand');
      uploadFormData.append('company_name', 'admin');

      try {
        setImageError('');
        const response = await uploadBrandImage(uploadFormData).unwrap();
        if (response.success) {
          setFormData({ ...formData, image_url: response.data.fileUrl });
          setImagePreview(response.data.fileUrl);
          setImageFile(null);
          handleToastNotification(true, 'Image uploaded successfully', 'Image upload failed');
        }
      } catch (error) {
        setImageError('Image upload failed. Please try again.');
        handleToastNotification(false, error?.data?.message, 'Image upload failed');
        console.error('Upload failed:', error);
      }
    }
  };

  const handleImageDelete = async () => {
    if (imagePreview) {
      try {
        const filename = imagePreview.split('/').pop();
        const response = await deleteBrandImage({
          entity_type: 'brand',
          company_name: 'admin',
          filename: filename,
        }).unwrap();
        if (response.success) {
          setImagePreview(null);
          setFormData({ ...formData, image_url: '' });
          setImageError('');
          handleToastNotification(true, 'Image deleted successfully', 'Failed to delete image');
        }
      } catch (error) {
        setImageError('Failed to delete image. Please try again.');
        handleToastNotification(false, error?.data?.message, 'Failed to delete image');
        console.error('Delete failed:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      if (editBrand) {
        await updateBrand({ id: editBrand._id, ...formData }).unwrap();
        handleToastNotification(true, 'Brand updated successfully', 'Failed to update brand');
      } else {
        await createBrand(formData).unwrap();
        handleToastNotification(true, 'Brand created successfully', 'Failed to create brand');
      }
    } catch (error) {
      handleToastNotification(false, error?.data?.message, editBrand ? 'Failed to update brand' : 'Failed to create brand');
      console.error('Submit failed:', error);
    }
  };

  const handleDelete = async () => {
    if (brandToDelete) {
      try {
        if (brandToDelete.image_url) {
          const filename = brandToDelete.image_url.split('/').pop();
          await deleteBrandImage({
            entity_type: 'brand',
            company_name: 'admin',
            filename: filename,
          }).unwrap();
        }
        await deleteBrand(brandToDelete._id).unwrap();
        handleToastNotification(true, 'Brand deleted successfully', 'Failed to delete brand');
      } catch (error) {
        handleToastNotification(false, error?.data?.message, 'Failed to delete brand');
        console.error('Delete failed:', error);
      } finally {
        setDeleteDialogOpen(false);
        setBrandToDelete(null);
      }
    }
  };

  // const isFormValid = formData.brand_name.trim() && formData.image_url && formData.link.trim();

  return (
    <div className={`${isSidebarOpen ? 'lg:p-6 lg:ml-56' : 'lg:p-4 lg:ml-16'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Manage Brands</h2>
        <Button onClick={() => setOpenDialog(true)} className="cursor-pointer bg-[#0c1f4d]">
          <Plus className="mr-2 h-4 w-4 " /> Add Brand
        </Button>
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

      {!isMobile ? (
        // Desktop/Tablet View - Table Layout
        <div className="border">
          {isLoading || isFetching ? (
            <div className="p-4">
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table className="min-w-[800px] w-full divide-y divide-gray-200 bg-white">
              <TableHeader className="bg-[#0c1f4d] group-hover:bg-[#0c204de7]">
                <TableRow>
                  <TableHead className="text-white">Brand Name</TableHead>
                  <TableHead className="text-white">Image</TableHead>
                  <TableHead className="text-white">Link</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length > 0 ? (
                  data.data.map((brand) => (
                    <TableRow key={brand._id}>
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
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No brands found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      ) : (
        // Mobile View - Card Layout
        <div className="space-y-4">
          {isLoading || isFetching ? (
            <div className="p-4">
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : data?.data?.length > 0 ? (
            data.data.map((brand) => (
              <Card key={brand._id} className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">{brand.brand_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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

      {data?.pagination && (
        <Pagination className="mt-4 flex justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1 && !isFetching) {
                    setPage((prev) => prev - 1);
                  }
                }}
                className={page === 1 || isFetching ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              />
            </PaginationItem>
            {isMobile ? (
              <PaginationItem>
                <PaginationLink isActive>{page}</PaginationLink>
              </PaginationItem>
            ) : (
              [...Array(data.pagination.totalPages).keys()].map((i) => {
                const pageNumber = i + 1;
                if (
                  pageNumber === 1 ||
                  pageNumber === data.pagination.totalPages ||
                  (pageNumber >= page - 1 && pageNumber <= page + 1)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        isActive={page === pageNumber}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!isFetching) setPage(pageNumber);
                        }}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  (pageNumber === page - 2 && page > 3) ||
                  (pageNumber === page + 2 && page < data.pagination.totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < data.pagination.totalPages && !isFetching) {
                    setPage((prev) => prev + 1);
                  }
                }}
                className={page >= data.pagination.totalPages || isFetching ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

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
              <Label htmlFor="brand_name" className="mb-2">
                Brand Name
              </Label>
              <Input
                id="brand_name"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                required
                placeholder="e.g. Apple"
                className="border-2 border-slate-300"
              />
            </div>
            <div>
              <Label htmlFor="image" className="mb-2">
                Image
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading || deletingImage}
                className="border-2 border-slate-300"
              />
              {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}
              {uploading && <p className="text-blue-500 text-sm">Uploading...</p>}
              {imagePreview && (
                <div className="mt-2 relative">
                  <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded border" />
                  {/* <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2"
                    onClick={handleImageDelete}
                    disabled={deletingImage}
                  >
                    {deletingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button> */}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="link" className="mb-2">Link</Label>
              <Input
                id="link"
                type="text" // Use text to override loose browser defaults
                value={formData.link}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, link: val });
                }}
                required
                placeholder="e.g. https://apple.com"
                className={`border-2 border-slate-300 ${formData.link && !STRICT_URL_REGEX.test(formData.link) ? "border-red-500" : ""}`}
              />

              {/* Show error only if they started typing but missed the TLD */}
              {formData.link && !STRICT_URL_REGEX.test(formData.link) && (
                <p className="text-red-500 text-[10px] mt-1 font-medium">
                  Missing domain extension (e.g., .com, .in, .org)
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid || creating || updating || uploading || deletingImage}>
                {(creating || updating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editBrand ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Brand"
        description="Are you sure you want to delete this brand? This action cannot be undone."
        isLoading={deleting || deletingImage}
      />
    </div>
  );
};

export default AdminBrands;
