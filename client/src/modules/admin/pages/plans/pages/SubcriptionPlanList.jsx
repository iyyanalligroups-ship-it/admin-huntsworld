
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Package,
  CreditCard,
  MoreVertical,
  CheckCircle2,
  XCircle
} from "lucide-react";
import {
  useGetPlansQuery,
  useDeletePlanMutation,
} from "@/redux/api/SubcriptionPlanApi";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import SubscriptionPlanForm from "../final-form/SubcriptionPlanForm";
import DeleteDialog from "@/model/DeleteModel";
import showToast from "@/toast/showToast";

const SubscriptionPlanList = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const itemsPerPage = 9; // Changed to 9 for better 3x3 grid layout
  const { data, isLoading } = useGetPlansQuery({
    page: page,
    limit: itemsPerPage
  });
  const [deletePlan] = useDeletePlanMutation();

  useEffect(() => {
    const handleResize = () => { };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDelete = (id) => {
    setDeleteId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deletePlan(deleteId).unwrap();
      showToast("Subscription plan deleted successfully.", "success");
    } catch (error) {
      showToast("Failed to delete subscription plan.", "error");
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

  console.log(data, 'data joisudfdf');


  const plans = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalRecords = data?.total || 0;
  console.log(plans, 'planss');

  return (
    <div className="min-h-screen bg-slate-50/50 p-2 font-sans">
      <div className=" space-y-8">

        {/* SOP Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Package className="w-6 h-6 text-indigo-600" />
              Subscription Management
            </h1>
            <p className="text-sm text-slate-500 max-w-lg">
              SOP: Manage B2B pricing tiers. Ensure plan codes match the backend configuration before activating.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm text-slate-600 hidden lg:block">
              Total Plans: <span className="font-bold text-indigo-600">{totalRecords}</span>
            </div>
            <Button
              onClick={() => {
                setSelectedPlan(null);
                setOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md w-full md:w-auto transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </div>

        {/* Grid Layout for Plans (More Visual than Table) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            ))
          ) : plans.length > 0 ? (
            plans.map((plan) => (
              <div
                key={plan._id}
                className={`group relative bg-white rounded-xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden
                  ${plan.status === "Active" ? "border-indigo-100 border-t-4 border-t-indigo-500" : "border-slate-200 border-t-4 border-t-slate-400 opacity-90"}
                `}
              >
                {/* Card Header */}
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-slate-50 border border-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-500">
                      ID: {plan.plan_code}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={`
                          ${plan.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"}
                        `}
                      >
                        {plan.status === "Active" ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </Badge>
                      {plan.razorpay_plan_id_test ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                          title={`Test ID: ${plan.razorpay_plan_id_test}`}
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> Test
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 opacity-50">
                          -Test
                        </Badge>
                      )}
                      
                      {plan.razorpay_plan_id_live ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200"
                          title={`Live ID: ${plan.razorpay_plan_id_live}`}
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> Live
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 opacity-50">
                          -Live
                        </Badge>
                      )}

                      {plan.razorpay_plan_id && !plan.razorpay_plan_id_test && !plan.razorpay_plan_id_live && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> Primary
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {plan.plan_name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        ₹{plan.price}
                      </span>
                      {plan.strike_amount && (
                        <span className="text-sm text-slate-400 line-through decoration-slate-400">
                          ₹{plan.strike_amount}
                        </span>
                      )}
                      <span className="text-sm font-medium text-slate-500">/period</span>
                    </div>
                  </div>

                  <div className="h-16">
                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                      {plan.description || "No specific description available for this plan tier."}
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    Edit Details
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg flex-shrink-0"
                    onClick={() => handleDelete(plan._id)}
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <CreditCard className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No subscription plans found</h3>
              <p className="text-slate-500 mt-1 max-w-sm">
                Get started by creating your first subscription tier for your B2B customers.
              </p>
              <Button
                variant="link"
                onClick={() => setOpen(true)}
                className="mt-4 text-indigo-600"
              >
                Create New Plan
              </Button>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 mb-4 sm:mb-0">
              Showing <span className="font-medium text-slate-900">{(page - 1) * itemsPerPage + 1}</span> -{" "}
              <span className="font-medium text-slate-900">
                {Math.min(page * itemsPerPage, totalRecords)}
              </span>{" "}
              of <span className="font-medium text-slate-900">{totalRecords}</span>
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
        <SubscriptionPlanForm open={open} setOpen={setOpen} plan={selectedPlan} />

        <DeleteDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Archive Plan?"
          description="Are you sure you want to delete this subscription plan? This will remove it from the checkout page immediately."
        />
      </div>
    </div>
  );
};

export default SubscriptionPlanList;
