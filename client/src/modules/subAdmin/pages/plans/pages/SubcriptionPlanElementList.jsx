import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Plus,
  Layers,
  CheckCircle2,
  LayoutGrid
} from "lucide-react";
import {
  useGetElementsQuery,
  useDeleteElementMutation,
} from "@/redux/api/SubscriptionPlanElementApi";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

import SubcriptionPlanElementForm from "../final-form/SubcriptionPlanElementForm";
import DeleteDialog from "@/model/DeleteModel";
import showToast from "@/toast/showToast";

const SubscriptionPlanElementList = () => {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const itemsPerPage = 12;

  const { data, isLoading } = useGetElementsQuery({ page, limit: itemsPerPage });
  const [deleteElement] = useDeleteElementMutation();

  const handleDelete = (id) => {
    setDeleteId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteElement(deleteId).unwrap();
      showToast("Feature deleted successfully", "success");
    } catch (err) {
      showToast("Failed to delete feature", "error");
    } finally {
      setIsDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const features = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalRecords = data?.total || 0;

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" />
              Feature Library
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Define atomic features here. These elements are reusable blocks that can be toggled on/off within specific Subscription Plans.
            </p>
          </div>

          <Button
            onClick={() => {
              setSelectedFeature(null);
              setOpen(true);
            }}
            className="bg-[#0c1f4d] hover:bg-[#0c204df4] cursor-pointer text-white shadow-md transition-all w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Feature
          </Button>
        </div>

        {/* Feature Grid Catalog */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between">
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </div>
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-6 w-6" />
                </div>
              </div>
            ))
          ) : features.length > 0 ? (
            features.map((feature, index) => {
              const serialNumber = (page - 1) * itemsPerPage + index + 1;
              const formattedSerial = serialNumber < 10 ? `0${serialNumber}` : serialNumber;

              return (
                <div
                  key={feature._id}
                  className="group bg-white rounded-lg border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[140px] relative overflow-hidden"
                >
                  {/* Decorative Background Icon */}
                  <Layers className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-50 opacity-50 group-hover:opacity-0 transition-opacity" />

                  <div className="flex items-start gap-3 z-10">
                    <div className="mt-0.5 min-w-[24px]">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-medium text-slate-400 mb-1 block">
                        #{formattedSerial}
                      </span>
                      <h3 className="font-semibold text-slate-800 leading-snug line-clamp-2" title={feature.feature_name}>
                        {feature.feature_name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex justify-end items-center gap-2 pt-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-y-2 group-hover:translate-y-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                      onClick={() => {
                        setSelectedFeature(feature);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(feature._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>

                  {/* Mobile Actions */}
                  <div className="sm:hidden flex justify-end items-center gap-2 pt-2 z-10">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-500"
                      onClick={() => {
                        setSelectedFeature(feature);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => handleDelete(feature._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <LayoutGrid className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Feature Library Empty</h3>
              <p className="text-slate-500 mt-1 max-w-sm">
                No reusable features found. Create features here to use them across multiple subscription plans.
              </p>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 pl-2">
              Viewing <span className="font-medium text-slate-900">{(page - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-slate-900">{Math.min(page * itemsPerPage, totalRecords)}</span> of {totalRecords} features
            </p>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(page - 1)}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-slate-50"}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink isActive className="bg-indigo-600 hover:bg-indigo-700">{page}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(page + 1)}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-slate-50"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Modals */}
        <SubcriptionPlanElementForm
          open={open}
          setOpen={setOpen}
          feature={selectedFeature}
        />

        <DeleteDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Feature?"
          description="Warning: Removing this feature will remove it from all plans currently using it. This cannot be undone."
        />
      </div>
    </div>
  );
};

export default SubscriptionPlanElementList;
