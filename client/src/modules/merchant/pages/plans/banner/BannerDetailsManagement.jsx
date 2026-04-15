import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import {
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} from '@/redux/api/BannerPaymentApi';
import {
  useUploadBannerImageMutation,
  useUploadCircleLogoMutation,
  useUploadRectangleLogoMutation,
  useUpdateBannerImageMutation,
  useUpdateCircleLogoMutation,
  useUpdateRectangleLogoMutation,
  useDeleteBannerImageMutation,
  useDeleteCircleLogoMutation,
  useDeleteRectangleLogoMutation,
} from '@/redux/api/BannerImageApi';
import { toast } from 'react-toastify';

const BannerDetailsManagement = ({ user, subscriptionId, activeBanner, activeBannerPayment, pendingBannerPayment, refetch }) => {
  const [isBannerDetailsOpen, setIsBannerDetailsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState({ banner: false, circle: false, rectangle: false });

  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [circleLogoUrl, setCircleLogoUrl] = useState('');
  const [rectangleLogoUrl, setRectangleLogoUrl] = useState('');
  const [bannerImagePreview, setBannerImagePreview] = useState('');
  const [circleLogoPreview, setCircleLogoPreview] = useState('');
  const [rectangleLogoPreview, setRectangleLogoPreview] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState('');
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [createBanner] = useCreateBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();
  const [uploadBannerImage] = useUploadBannerImageMutation();
  const [uploadCircleLogo] = useUploadCircleLogoMutation();
  const [uploadRectangleLogo] = useUploadRectangleLogoMutation();
  const [updateBannerImage] = useUpdateBannerImageMutation();
  const [updateCircleLogo] = useUpdateCircleLogoMutation();
  const [updateRectangleLogo] = useUpdateRectangleLogoMutation();
  const [deleteBannerImage] = useDeleteBannerImageMutation();
  const [deleteCircleLogo] = useDeleteCircleLogoMutation();
  const [deleteRectangleLogo] = useDeleteRectangleLogoMutation();

  const sanitizeCompanyName = (name) => name.replace(/[^a-zA-Z0-9\s]/g, '_').trim();

  const validateFile = (file) => {
    if (!file) return false;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid file type for ${file.name}. Allowed types: JPEG, JPG, PNG, GIF, WebP.`);
      return false;
    }
    if (file.size > maxSize) {
      toast.error(`File ${file.name} exceeds 200MB limit.`);
      return false;
    }
    return true;
  };

  const handleImageChange = async (e, type) => {
    console.log('handleImageChange called with type:', type);
    if (!['banner', 'circle', 'rectangle'].includes(type)) {
      console.error('Invalid image type:', type);
      toast.error('Invalid image type provided');
      e.target.value = '';
      return;
    }

    const file = e.target.files[0];
    if (!file || !validateFile(file)) {
      e.target.value = '';
      return;
    }
    if (!companyName) {
      toast.error('Please provide a company name before uploading images.');
      e.target.value = '';
      return;
    }

    const sanitizedCompanyName = sanitizeCompanyName(companyName);
    const previewUrl = URL.createObjectURL(file);
    setIsUploading((prev) => ({ ...prev, [type]: true }));

    try {
      let uploadMutation, setImage, setImageUrl, setImagePreview;
      if (type === 'banner') {
        uploadMutation = isUpdateMode && activeBanner?.banner_image ? updateBannerImage : uploadBannerImage;

        setImageUrl = setBannerImageUrl;
        setImagePreview = setBannerImagePreview;
      } else if (type === 'circle') {
        uploadMutation = isUpdateMode && activeBanner?.circle_logo ? updateCircleLogo : uploadCircleLogo;

        setImageUrl = setCircleLogoUrl;
        setImagePreview = setCircleLogoPreview;
      } else if (type === 'rectangle') {
        uploadMutation = isUpdateMode && activeBanner?.rectangle_logo ? updateRectangleLogo : uploadRectangleLogo;
     
        setImageUrl = setRectangleLogoUrl;
        setImagePreview = setRectangleLogoPreview;
      }

      setImage(file);
      setImagePreview(previewUrl);

      console.log(`Uploading ${type} image:`, {
        company_name: sanitizedCompanyName,
        file: file.name,
        mime: file.type,
        size: file.size,
      });

      const response = await uploadMutation({
        file,
        company_name: sanitizedCompanyName,
        old_image_url: isUpdateMode ? activeBanner?.[`${type}_logo`] || activeBanner?.[`${type}_image`] : undefined,
      }).unwrap();
      console.log(`Upload ${type} response:`, response);
      setImageUrl(response.imageUrl);
      setImagePreview('');

      // Update database with new image URL
      if (isUpdateMode && activeBanner?._id) {
        const bannerData = {
          banner_id: activeBanner._id,
          user_id: user?.user?._id,
          subscription_id: subscriptionId,
          banner_payment_id: pendingBannerPayment?._id || activeBannerPayment._id,
          title: title || activeBanner.title,
          company_name: sanitizedCompanyName,
          banner_image: type === 'banner' ? response.imageUrl : activeBanner.banner_image,
          circle_logo: type === 'circle' ? response.imageUrl : activeBanner.circle_logo,
          rectangle_logo: type === 'rectangle' ? response.imageUrl : activeBanner.rectangle_logo,
        };
        await updateBanner(bannerData).unwrap();
        console.log(`Updated banner in database with new ${type} image URL:`, response.imageUrl);
      }

      toast.success(`${type} image uploaded successfully`);
    } catch (error) {
      console.error(`Upload ${type} Image Error:`, {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      toast.error(`Failed to upload ${type} image: ${error.data?.message || error.message}`);
      e.target.value = '';
    } finally {
      setIsUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDeleteImage = async (type, imageUrl) => {
    if (!imageUrl) {
      toast.error(`No ${type} image to delete`);
      return;
    }
    if (!companyName) {
      toast.error('Please provide a company name before deleting images');
      return;
    }

    const sanitizedCompanyName = sanitizeCompanyName(companyName);
    try {
      let deleteMutation, setImage, setImageUrl, setImagePreview;
      if (type === 'banner') {
        deleteMutation = deleteBannerImage;
  
        setImageUrl = setBannerImageUrl;
        setImagePreview = setBannerImagePreview;
      } else if (type === 'circle') {
        deleteMutation = deleteCircleLogo;
      
        setImageUrl = setCircleLogoUrl;
        setImagePreview = setCircleLogoPreview;
      } else if (type === 'rectangle') {
        deleteMutation = deleteRectangleLogo;
     
        setImageUrl = setRectangleLogoUrl;
        setImagePreview = setRectangleLogoPreview;
      } else {
        throw new Error('Invalid image type');
      }

      console.log(`Deleting ${type} image:`, { company_name: sanitizedCompanyName, image_url: imageUrl });
      await deleteMutation({ company_name: sanitizedCompanyName, image_url: imageUrl }).unwrap();
      setImage(null);
      setImageUrl('');
      setImagePreview('');

      // Update database to remove image URL
      if (isUpdateMode && activeBanner?._id) {
        const bannerData = {
          banner_id: activeBanner._id,
          user_id: user?.user?._id,
          subscription_id: subscriptionId,
          banner_payment_id: pendingBannerPayment?._id || activeBannerPayment._id,
          title: title || activeBanner.title,
          company_name: sanitizedCompanyName,
          banner_image: type === 'banner' ? '' : activeBanner.banner_image,
          circle_logo: type === 'circle' ? '' : activeBanner.circle_logo,
          rectangle_logo: type === 'rectangle' ? '' : activeBanner.rectangle_logo,
        };
        await updateBanner(bannerData).unwrap();
        console.log(`Updated banner in database: removed ${type} image URL`);
      }

      toast.success(`${type} image deleted successfully`);
    } catch (error) {
      console.error(`Delete ${type} Image Error:`, {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      toast.error(`Failed to delete ${type} image: ${error.data?.message || error.message}`);
    }
  };

  const handleBannerDetailsSubmit = async () => {
    try {
      if (!title) throw new Error('Please provide a banner title');
      if (!companyName) throw new Error('Please provide a company name');
      if (!bannerImageUrl) throw new Error('Please upload a banner image');
      const userId = user?.user?._id;
      if (!userId) throw new Error('User not logged in');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!pendingBannerPayment && !activeBannerPayment) throw new Error('No active or pending banner payment');

      const sanitizedCompanyName = sanitizeCompanyName(companyName);
      const bannerData = {
        user_id: userId,
        subscription_id: subscriptionId,
        banner_payment_id: pendingBannerPayment?._id || activeBannerPayment._id,
        title,
        company_name: sanitizedCompanyName,
        banner_image: bannerImageUrl,
        circle_logo: circleLogoUrl,
        rectangle_logo: rectangleLogoUrl,
      };

      if (isUpdateMode) {
        bannerData.banner_id = activeBanner._id;
        await updateBanner(bannerData).unwrap();
        toast.success('Banner updated successfully');
      } else {
        await createBanner(bannerData).unwrap();
        toast.success('Banner created successfully');
      }
      setIsBannerDetailsOpen(false);
      refetch();
    } catch (error) {
      console.error('Banner Details Submit Error:', {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      toast.error(`Failed to submit banner details: ${error.data?.message || error.message}`);
    }
  };

  const handleDeleteBanner = async () => {
    try {
      if (!activeBanner) throw new Error('No banner to delete');
      const sanitizedCompanyName = sanitizeCompanyName(companyName || activeBanner.company_name);

      // Delete image files from server and clear database fields
      if (activeBanner.banner_image) {
        await deleteBannerImage({ company_name: sanitizedCompanyName, image_url: activeBanner.banner_image }).unwrap();
      }
      if (activeBanner.circle_logo) {
        await deleteCircleLogo({ company_name: sanitizedCompanyName, image_url: activeBanner.circle_logo }).unwrap();
      }
      if (activeBanner.rectangle_logo) {
        await deleteRectangleLogo({ company_name: sanitizedCompanyName, image_url: activeBanner.rectangle_logo }).unwrap();
      }

      // Update database to clear image URLs before deleting banner
    //   if (activeBanner._id) {
    //     const bannerData = {
    //       banner_id: activeBanner._id,
    //       user_id: user?.user?._id,
    //       subscription_id: subscriptionId,
    //       banner_payment_id: activeBannerPayment?._id || pendingBannerPayment?._id,
    //       title: activeBanner.title,
    //       company_name: sanitizedCompanyName,
    //       banner_image: '',
    //       circle_logo: '',
    //       rectangle_logo: '',
    //     };
    //     await updateBanner(bannerData).unwrap();
    //     console.log('Cleared image URLs in database before banner deletion');
    //   }
console.log(activeBanner,'activebanner');

      // Delete the banner record
   await deleteBanner(activeBanner._id).unwrap();

      toast.success('Banner deleted successfully');

      setBannerImageUrl('');
      setCircleLogoUrl('');
      setRectangleLogoUrl('');
      setBannerImagePreview('');
      setCircleLogoPreview('');
      setRectangleLogoPreview('');
      setTitle('');
      setCompanyName('');
      refetch();
    } catch (error) {
      console.log('Delete Banner Error:', {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      toast.error(`Failed to delete banner: ${error.data?.message || error.message}`);
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleUpdateBanner = () => {
    setIsUpdateMode(true);
    setTitle(activeBanner?.title || '');
    setCompanyName(activeBanner?.company_name || user?.user?.company_name || '');
    setBannerImageUrl(activeBanner?.banner_image || '');
    setCircleLogoUrl(activeBanner?.circle_logo || '');
    setRectangleLogoUrl(activeBanner?.rectangle_logo || '');
    setBannerImagePreview('');
    setCircleLogoPreview('');
    setRectangleLogoPreview('');
    setIsBannerDetailsOpen(true);
  };

  useEffect(() => {
    if (!isBannerDetailsOpen) {
      setIsUpdateMode(false);
      setTitle('');
      setCompanyName(user?.user?.company_name || '');

      setBannerImageUrl('');
      setCircleLogoUrl('');
      setRectangleLogoUrl('');
      setBannerImagePreview('');
      setCircleLogoPreview('');
      setRectangleLogoPreview('');
    }
    // Cleanup object URLs to prevent memory leaks
    return () => {
      if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
      if (circleLogoPreview) URL.revokeObjectURL(circleLogoPreview);
      if (rectangleLogoPreview) URL.revokeObjectURL(rectangleLogoPreview);
    };
  }, [isBannerDetailsOpen, user]);

  return (
    <Card className="border-[#0c1f4d] bg-[#f0f4f6] rounded-xl shadow-md mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#0c1f4d]">Banner Details Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(activeBannerPayment || pendingBannerPayment) && (
          <div className="text-center">
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white"
              onClick={() => {
                setIsUpdateMode(false);
                setIsBannerDetailsOpen(true);
              }}
            >
              Upload Banner
            </Button>
          </div>
        )}
        {activeBanner && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-[#0c1f4d]">Current Banner Details</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Banner Image</TableHead>
                  <TableHead>Circle Logo</TableHead>
                  <TableHead>Rectangle Logo</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{activeBanner.title}</TableCell>
                  <TableCell>{activeBanner.company_name}</TableCell>
                  <TableCell>
                    {activeBanner.banner_image ? (
                      <img
                        src={activeBanner.banner_image}
                        alt="Banner"
                        className="w-24 h-12 object-cover rounded-md"
                      />
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {activeBanner.circle_logo ? (
                      <img
                        src={activeBanner.circle_logo}
                        alt="Circle Logo"
                        className="w-12 h-12 object-cover rounded-full"
                      />
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {activeBanner.rectangle_logo ? (
                      <img
                        src={activeBanner.rectangle_logo}
                        alt="Rectangle Logo"
                        className="w-16 h-8 object-cover rounded-md"
                      />
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      className="bg-[#0c1f4d] text-white hover:bg-[#0c1f4dcc]"
                      onClick={handleUpdateBanner}
                    >
                      Update
                    </Button>
                    <Button
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isBannerDetailsOpen} onOpenChange={setIsBannerDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isUpdateMode ? 'Update Banner Details' : 'Upload Banner Details'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full"
            />
            <Input
              type="text"
              placeholder="Banner Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
            <Input
              type="file"
              id="banner-image"
              accept="image/*"
              onChange={(e) => handleImageChange(e, 'banner')}
              className="w-full"
              disabled={!companyName || isUploading.banner}
            />
            {(bannerImagePreview || bannerImageUrl || (isUpdateMode && activeBanner?.banner_image)) && (
              <div className="relative">
                <img
                  src={bannerImagePreview || bannerImageUrl || activeBanner?.banner_image}
                  alt="Banner Preview"
                  className="w-full h-32 object-cover rounded-md"
                />
                <Button
                  className="absolute top-2 right-2 bg-red-600 text-white hover:bg-red-700"
                  size="icon"
                  onClick={() => handleDeleteImage('banner', bannerImageUrl || activeBanner?.banner_image)}
                  disabled={isUploading.banner}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            )}
            <Input
              type="file"
              id="circle-logo"
              accept="image/*"
              onChange={(e) => handleImageChange(e, 'circle')}
              className="w-full"
              disabled={!companyName || isUploading.circle}
            />
            {(circleLogoPreview || circleLogoUrl || (isUpdateMode && activeBanner?.circle_logo)) && (
              <div className="relative">
                <img
                  src={circleLogoPreview || circleLogoUrl || activeBanner?.circle_logo}
                  alt="Circle Logo Preview"
                  className="w-24 h-24 object-cover rounded-full"
                />
                <Button
                  className="absolute top-2 right-2 bg-red-600 text-white hover:bg-red-700"
                  size="icon"
                  onClick={() => handleDeleteImage('circle', circleLogoUrl || activeBanner?.circle_logo)}
                  disabled={isUploading.circle}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            )}
            <Input
              type="file"
              id="rectangle-logo"
              accept="image/*"
              onChange={(e) => handleImageChange(e, 'rectangle')}
              className="w-full"
              disabled={!companyName || isUploading.rectangle}
            />
            {(rectangleLogoPreview || rectangleLogoUrl || (isUpdateMode && activeBanner?.rectangle_logo)) && (
              <div className="relative">
                <img
                  src={rectangleLogoPreview || rectangleLogoUrl || activeBanner?.rectangle_logo}
                  alt="Rectangle Logo Preview"
                  className="w-32 h-16 object-cover rounded-md"
                />
                <Button
                  className="absolute top-2 right-2 bg-red-600 text-white hover:bg-red-700"
                  size="icon"
                  onClick={() => handleDeleteImage('rectangle', rectangleLogoUrl || activeBanner?.rectangle_logo)}
                  disabled={isUploading.rectangle}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBannerDetailsOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4ddb]"
              disabled={!title || !companyName || !bannerImageUrl || isUploading.banner}
              onClick={handleBannerDetailsSubmit}
            >
              {isUpdateMode ? 'Update Banner' : 'Submit Banner Details'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Banner Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this banner? This action will remove the banner and all associated images from the server and database. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteBanner}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BannerDetailsManagement;