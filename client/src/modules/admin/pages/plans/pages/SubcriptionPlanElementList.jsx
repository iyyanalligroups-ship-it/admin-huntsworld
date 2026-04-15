
import React, { useState } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  Layers,
  CheckCircle2,
  LayoutGrid,
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
import { Button } from "@/components/ui/button";
import SubscriptionPlanElementForm from "../final-form/SubcriptionPlanElementForm"; // ← fixed typo
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
    <div className="min-h-screen bg-slate-50/50 py-8 ">
      <div className=" space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" />
              Feature Library
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Define atomic, reusable features here. Toggle them on/off in individual subscription plans.
            </p>
          </div>

          <Button
            onClick={() => {
              setSelectedFeature(null);
              setOpen(true);
            }}
            className="bg-[#0c1f4d] hover:bg-[#0c204df4] text-white shadow-md transition-all w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Feature
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {isLoading ? (
            // Skeletons
            Array(8)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-[148px] bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between"
                >
                  <div className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-4/5" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))
          ) : features.length > 0 ? (
            features.map((feature, index) => {
              const serialNumber = (page - 1) * itemsPerPage + index + 1;
              const formattedSerial = serialNumber.toString().padStart(2, "0");

              return (
                <div
                  key={feature._id}
                  className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col h-[148px] relative overflow-hidden"
                >
                  {/* Decorative icon */}
                  <Layers className="absolute -right-5 -bottom-5 w-28 h-28 text-slate-50 opacity-40 group-hover:opacity-0 transition-opacity duration-300" />

                  <div className="flex items-start gap-3 z-10">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-mono text-slate-400 block mb-0.5">
                        #{formattedSerial}
                      </span>
                      <h3
                        className="font-semibold text-slate-900 leading-snug line-clamp-2"
                        title={feature.feature_name}
                      >
                        {feature.feature_name}
                      </h3>

                      {/* Show feature code */}
                      <code className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {feature.feature_code}
                      </code>
                    </div>
                  </div>

                  {/* Actions - desktop (hover) */}
                  <div className="flex justify-end items-center gap-1.5 pt-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                      onClick={() => {
                        setSelectedFeature(feature);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(feature._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile actions - always visible */}
                  <div className="sm:hidden flex justify-end items-center gap-1.5 pt-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-500"
                      onClick={() => {
                        setSelectedFeature(feature);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600"
                      onClick={() => handleDelete(feature._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-50 p-5 rounded-full mb-5">
                <LayoutGrid className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-900">No Features Yet</h3>
              <p className="text-slate-500 mt-2 max-w-md">
                Create your first reusable feature to start building powerful subscription plans.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600 mb-3 sm:mb-0">
              Showing{" "}
              <span className="font-medium text-slate-900">
                {(page - 1) * itemsPerPage + 1}–
                {Math.min(page * itemsPerPage, totalRecords)}
              </span>{" "}
              of <span className="font-medium text-slate-900">{totalRecords}</span>
            </p>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(page - 1)}
                    className={
                      page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink
                    isActive
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(page + 1)}
                    className={
                      page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Modals */}
        <SubscriptionPlanElementForm
          open={open}
          setOpen={setOpen}
          plan={selectedFeature} // ← you can keep prop name as 'plan' if form expects it
          // OR rename in form: feature → plan
        />

        <DeleteDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Feature?"
          description="This will remove the feature from all subscription plans that are currently using it. This action cannot be undone."
        />
      </div>
    </div>
  );
};

export default SubscriptionPlanElementList;
