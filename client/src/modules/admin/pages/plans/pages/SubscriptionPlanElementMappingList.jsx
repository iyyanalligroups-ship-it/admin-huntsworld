
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"; // Ensure you have this component installed
import {
  Trash2,
  Settings2,
  Sliders,
  AlertCircle,
  Search,
  Plus,
  Database
} from "lucide-react";
import { useGetMappingsQuery, useDeleteMappingMutation } from "@/redux/api/SubscriptionPlanElementMappingApi";
import { useGetElementsQuery } from "@/redux/api/SubscriptionPlanElementApi"; // Importing the Master Feature List

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
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import SubcriptionPlanElementMappingForm from "../final-form/SubcriptionPlanElementMappingForm";
import DeleteDialog from "@/model/DeleteModel";
import showToast from "@/toast/showToast";

const SubscriptionPlanElementMappingList = () => {
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [selectedFeatureForAdd, setSelectedFeatureForAdd] = useState(null); // To pre-fill form when switching ON
  const [deleteData, setDeleteData] = useState(null);
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const itemsPerPage = 6;

  // 1. Fetch Plans (Mappings)
  const { data: mappingData, isLoading: isMappingLoading } = useGetMappingsQuery({ page, limit: itemsPerPage });

  // 2. Fetch Master Feature List (To render the switches)
  const { data: elementsData, isLoading: isElementsLoading } = useGetElementsQuery({ page: 1, limit: 100 });

  const [deleteMapping] = useDeleteMappingMutation();

  const handleDelete = (planId, featureId = null) => {
    const isDeletingAll = !featureId;
    setDeleteData({
      subscription_plan_id: planId,
      feature_id: featureId || null,
      delete_all: isDeletingAll
    });
    setIsDeleteAll(isDeletingAll);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteMapping(deleteData).unwrap();
      showToast(isDeleteAll ? "Plan Reset Successfully" : "Feature Disabled", "success");
    } catch (err) {
      showToast("Failed to update configuration", "error");
    } finally {
      setIsDialogOpen(false);
      setDeleteData(null);
    }
  };

  const handleSwitchChange = (isChecked, planMapping, feature) => {
    if (isChecked) {
      // Turning ON (or re-enabling a previously disabled one)
      setSelectedMapping(planMapping);
      setSelectedFeatureForAdd(feature);
      setOpen(true);
    } else {
      // Turning OFF → delete/disable the mapping
      handleDelete(planMapping.subscription_plan_id._id, feature._id);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (mappingData?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const mappings = mappingData?.data || [];
  const allFeatures = elementsData?.data || [];

  // Filter features logic (optional visual improvement)
  const filteredFeatures = allFeatures.filter(f =>
    f.feature_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = mappingData?.totalPages || 1;
  const totalRecords = mappingData?.total || 0;
  const isLoading = isMappingLoading || isElementsLoading;

  const formatValue = (value) => {
    if (!value || !value.data) return "Active";
    return value.unit ? `${value.data} ${value.unit}` : value.data;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 font-sans">
      <div className="space-y-8 px-2">
        {/* SOP Header with Search & Add Button */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-indigo-600" />
              Plan Configuration
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Enable features for each plan using the toggles below. Green toggles indicate active features visible to customers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filter features..."
                className="pl-9 bg-white"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Add Button - Restored */}
            <Button
              onClick={() => {
                setSelectedMapping(null);
                setOpen(true);
              }}
              className="bg-[#0c1f4d] hover:bg-[#0c204df4] cursor-pointer text-white shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Configuration
            </Button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {isLoading ? (
            Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-xl" />)
          ) : mappings.length > 0 ? (
            mappings.map((mapping) => {
              const plan = mapping.subscription_plan_id;
              const mappedElements = mapping.elements || [];
              const mappedIds = new Set(mappedElements.map(m => m.feature_id));

              return (
                <div
                  key={plan._id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-fit"
                >
                  {/* Plan Header */}
                  <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">{plan.plan_name}</h3>
                        <Badge variant="outline" className="font-mono text-xs text-slate-500">{plan.plan_code}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {mappedElements.length} / {allFeatures.length} Features Enabled
                      </p>
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(plan._id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Reset
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Disable all features</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Feature Control Panel List */}
                  <div className="divide-y divide-slate-100">
                    {filteredFeatures.map((feature) => {
                      // Find the config for this feature in the current plan
                      const config = mappedElements.find(m => m.feature_id === feature._id);

                      // Determine switch state:
                      // - Checked only if config exists AND is_enabled === true
                      const isChecked = config ? config.is_enabled === true : false;

                      // Determine if it's explicitly disabled (for styling)
                      const isExplicitlyDisabled = config ? config.is_enabled === false : false;

                      return (
                        <div
                          key={feature._id}
                          className={`
        px-6 py-4 flex items-center justify-between transition-colors duration-200
        ${isChecked ? 'bg-emerald-50/30' : isExplicitlyDisabled ? 'bg-red-50/30' : 'bg-slate-50/30'}
      `}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${isChecked ? 'text-slate-900' :
                                isExplicitlyDisabled ? 'text-red-700' :
                                  'text-slate-500'
                                }`}>
                                {feature.feature_name}
                              </span>
                              {config && (
                                <span className="text-xs font-medium mt-0.5">
                                  ID: {feature._id.slice(-4)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Show Value Only if Enabled */}
                            {isChecked && config?.value && (
                              <div
                                className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full cursor-pointer hover:bg-indigo-100 transition-colors group"
                                onClick={() => {
                                  setSelectedMapping(mapping);
                                  setSelectedFeatureForAdd(feature); // Optional: prefill form
                                  setOpen(true);
                                }}
                              >
                                <span className="text-xs font-bold text-[#0c1f4d]">
                                  {formatValue(config.value)}
                                </span>
                                <Sliders className="w-3 h-3 text-indigo-400 group-hover:text-[#0c1f4d]" />
                              </div>
                            )}

                            {/* Show "Disabled" badge if explicitly disabled */}
                            {isExplicitlyDisabled && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                                <span className="text-xs font-bold text-red-700">Disabled</span>
                              </div>
                            )}

                            {/* The Toggle Switch */}
                            <Switch
                              checked={isChecked}
                              onCheckedChange={(checked) => handleSwitchChange(checked, mapping, feature)}
                              className="data-[state=checked]:bg-emerald-500"
                            // Optional: disable switch if explicitly disabled? Or allow re-enabling
                            />
                          </div>
                        </div>
                      );
                    })}
                    {filteredFeatures.length === 0 && (
                      <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                        <Database className="w-8 h-8 text-slate-300 mb-2" />
                        <p>No features match your search.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900">System Not Ready</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                You need to create Subscription Plans and Define Features in the library before mapping them.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageChange(page - 1)} className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink isActive className="bg-[#0c1f4d] text-white">{page}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext onClick={() => handlePageChange(page + 1)} className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Modals */}
        <SubcriptionPlanElementMappingForm
          open={open}
          setOpen={setOpen}
          mapping={selectedMapping}

        />

        <DeleteDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={confirmDelete}
          title={isDeleteAll ? "Reset Plan Configuration?" : "Disable Feature?"}
          description={
            isDeleteAll
              ? "This will remove ALL feature entitlements from this plan. Customers on this plan will lose access to all features immediately."
              : "Disabling this feature will remove it from the plan immediately."
          }
        />
      </div>
    </div>
  );
};

export default SubscriptionPlanElementMappingList;
