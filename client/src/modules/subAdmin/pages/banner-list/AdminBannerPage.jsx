import { useState } from "react";
import { Button } from "@/components/ui/button";
import BannerList from "./BannerList";
import BannerFormModal from "./BannerFormModal";
import DeleteDialog from "@/model/DeleteModel";
import { Plus, Loader2, ImageOff } from "lucide-react";

import {
  useGetAdminBannersQuery,
  useDeleteAdminBannerMutation,
} from "@/redux/api/AdminBannerApi";
import { useSidebar } from "../../../admin/hooks/useSidebar";

const LIMIT = 10;

const AdminBannerPage = () => {
  const { isSidebarOpen } = useSidebar();
  const [page, setPage] = useState(1);

  const { data, isFetching } = useGetAdminBannersQuery({
    page,
    limit: LIMIT,
  });

  const [deleteBanner] = useDeleteAdminBannerMutation();

  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBannerId, setSelectedBannerId] = useState(null);

  const handleDeleteClick = (id) => {
    setSelectedBannerId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBannerId) return;
    try {
      await deleteBanner(selectedBannerId).unwrap();
      setDeleteOpen(false);
      setSelectedBannerId(null);
    } catch (error) {
      console.error("Failed to delete banner:", error);
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleCreateNew = () => {
    setEditData(null);
    setOpen(true);
  };

  const banners = data?.data || [];
  const hasMore = data?.pagination?.hasMore ?? false;

  return (
    <div
      className={`min-h-screen bg-slate-50/50 transition-all duration-300 ease-in-out ${isSidebarOpen ? "p-8 lg:ml-64" : "p-6 lg:ml-20"
        }`}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Banner Management
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage, organize, and schedule your website's promotional banners.
            </p>
          </div>

          <Button
            onClick={handleCreateNew}
            className="bg-[#0c1f4d] hover:bg-[#0a1a3d] text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" /> Add New Banner
          </Button>
        </div>

        <div className="min-h-[400px]">
          {banners.length === 0 && !isFetching ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-xl">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <ImageOff className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                No banners found
              </h3>
              <p className="text-slate-500 max-w-sm mt-2 mb-6 text-sm">
                You haven't created any banners yet. Click below to get started.
              </p>
              <Button
                onClick={handleCreateNew}
                variant="outline"
                className="border-slate-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
              >
                Create your first banner
              </Button>
            </div>
          ) : (
            <BannerList
              banners={banners}
              onEdit={(banner) => {
                setEditData(banner);
                setOpen(true);
              }}
              onDelete={handleDeleteClick}
            />
          )}

          {hasMore && (
            <div className="flex justify-center mt-10 pb-10">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleLoadMore}
                disabled={isFetching}
                className="min-w-[150px] bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Banners"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <BannerFormModal
        open={open}
        editData={editData}
        onClose={() => setOpen(false)}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Banner?"
        description="This action cannot be undone."
      />
    </div>
  );
};

export default AdminBannerPage;
