import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useGetSubscriptionPlanQuery,
  useGetSubscriptionPlanElementQuery,
  useCreateMappingMutation,
} from "@/redux/api/SubscriptionPlanElementMappingApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Type, Hash, Loader2, CheckCircle2, Infinity as InfinityIcon, RefreshCw } from "lucide-react";
import showToast from "@/toast/showToast";

const SubscriptionPlanFeatureMappingForm = ({ open, setOpen, mapping }) => {
  const initialFormData = {
    subscription_plan_id: "",
    features: [],
  };
  const [formData, setFormData] = useState(initialFormData);

  const [selectedFeatureIds, setSelectedFeatureIds] = useState([]);
  const {
    data: plansData,
    refetch: refetchPlans,
  } = useGetSubscriptionPlanQuery();

  const {
    data: allFeaturesData,
    refetch: refetchFeatures,
  } = useGetSubscriptionPlanElementQuery();

  const [createMapping] = useCreateMappingMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleManualRefresh = async () => {
    try {
      await Promise.all([refetchPlans(), refetchFeatures()]);
      showToast("Data refreshed successfully", "success");
    } catch (err) {
      showToast("Failed to refresh data", "error");
    }
  };

  // 🧠 SOP: Logic to decide which Tab to show based on the DATA
  const detectFormatFromData = (val, featureName = "") => {
    // 1. "Unlimited" is a special keyword for the LIMIT tab
    if (val?.data === "Unlimited") return "NUMBER";

    // 2. If it has a "unit" or is a pure number, it is LIMIT/NUMBER mode
    if ((val?.unit && val.unit.trim() !== "") || (val?.type === "NUMBER")) return "NUMBER";

    // 3. Status keywords
    const statusKeywords = ["Enable", "Disable", "Free", "No"];
    if (statusKeywords.includes(val?.data)) return "STATUS";

    // 4. Fallback guessing by name
    const n = featureName.toLowerCase();
    if (!val?.data) {
      if (n.includes("photo") || n.includes("point") || n.includes("listing") || n.includes("product")) return "NUMBER";
      if (n.includes("chat") || n.includes("verif") || n.includes("seal")) return "STATUS";
    }

    return "TEXT";
  };
  // 1. Reset everything when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData(initialFormData);
      setSelectedFeatureIds([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return; // Don't run on close

    if (mapping) {
      // Edit mode
      setFormData({
        subscription_plan_id: mapping.subscription_plan_id._id,
        features: mapping.elements?.map((elem) => {
          const safeValue = elem.value ? { ...elem.value } : { type: "TEXT", data: "", unit: "" };
          return {
            feature_id: elem.feature_id,
            feature_name: elem.feature_name || "Unknown",
            is_enabled: elem.is_enabled ?? false,
            value: safeValue,
            ui_format: detectFormatFromData(safeValue, elem.feature_name),
          };
        }) || [],
      });
    } else {
      // Create mode - fresh form
      setFormData({
        subscription_plan_id: plansData?.data?.[0]?._id || "",
        features: [],
      });
    }
  }, [open, mapping, plansData]);

  const availableFeatures = useMemo(() => {
    const addedIds = new Set(formData.features.map((f) => f.feature_id));
    return allFeaturesData?.data?.filter((feat) => !addedIds.has(feat._id)) || [];
  }, [allFeaturesData, formData.features]);

  const addSelectedFeatures = () => {
    const newFeatures = selectedFeatureIds.map((id) => {
      const feat = allFeaturesData?.data?.find((f) => f._id === id);
      const format = detectFormatFromData(null, feat?.feature_name);

      let initialData = "";
      if (format === "STATUS") initialData = "Enable";

      return {
        feature_id: id,
        feature_name: feat?.feature_name || "Unknown",
        is_enabled: true,
        value: {
          type: format === "NUMBER" ? "NUMBER" : "TEXT",
          data: initialData,
          unit: ""
        },
        ui_format: format
      };
    });

    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ...newFeatures],
    }));
    setSelectedFeatureIds([]);
  };

  const removeFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const updateFeature = (index, field, value) => {
    setFormData((prev) => {
      const features = [...prev.features];
      features[index][field] = value;
      return { ...prev, features };
    });
  };

  const updateValue = (index, field, value) => {
    setFormData((prev) => {
      const features = [...prev.features];
      features[index] = {
        ...features[index],
        value: {
          ...features[index].value,  // ← Create new value object
          [field]: value,            // ← Now safe to update
        },
      };
      return { ...prev, features };
    });
  };

  const changeFormat = (index, newFormat) => {
    setFormData((prev) => {
      const features = [...prev.features];
      const oldValue = features[index].value;

      let newValue = { type: "TEXT", data: "", unit: "" };

      if (newFormat === "STATUS") {
        newValue = { type: "TEXT", data: "Enable", unit: "" };
      } else if (newFormat === "NUMBER") {
        newValue = { type: "NUMBER", data: oldValue.data === "Unlimited" ? "" : oldValue.data, unit: oldValue.unit || "" };
      } else {
        newValue = { type: "TEXT", data: oldValue.data, unit: oldValue.unit };
      }

      features[index] = {
        ...features[index],
        ui_format: newFormat,
        value: newValue,  // ← New object, safe
      };

      return { ...prev, features };
    });
  };

  const setLimitMode = (index, mode) => {
    setFormData((prev) => {
      const features = [...prev.features];

      if (mode === "UNLIMITED") {
        features[index] = {
          ...features[index],
          value: {
            ...features[index].value,
            data: "Unlimited",
            unit: "",
            type: "TEXT",
          },
        };
      } else {
        // Limited mode
        features[index] = {
          ...features[index],
          value: {
            ...features[index].value,
            data: features[index].value.data === "Unlimited" ? "" : features[index].value.data,
            type: "NUMBER",
          },
        };
      }

      return { ...prev, features };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subscription_plan_id) {
      return showToast("Select a plan", "error");
    }
    if (formData.features.length === 0) {
      return showToast("Add features", "error");
    }

    setIsSubmitting(true); // ← Start loading

    const payload = {
      subscription_plan_id: formData.subscription_plan_id,
      elements: formData.features.map((f) => ({
        feature_id: f.feature_id,
        is_enabled: f.is_enabled,
        value: f.is_enabled
          ? {
            type: f.value.type,
            data: f.value.data?.toString() || "",
            unit: f.value.unit?.toString() || null,
          }
          : null,
      })),
    };

    try {
      await createMapping(payload).unwrap();
      showToast("Plan configuration saved", "success");
      setOpen(false);
    } catch (err) {
      showToast("Failed to save configuration", "error");
    } finally {
      setIsSubmitting(false); // ← Always stop loading
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50">
        <DialogHeader>
          <DialogTitle>Configure Feature Values</DialogTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            className="flex cursor-pointer w-fit items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan Selector */}
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <label className="text-sm font-bold text-slate-800">Target Plan</label>
            <Select
              value={formData.subscription_plan_id}
              onValueChange={(v) => setFormData((p) => ({ ...p, subscription_plan_id: v }))}
            >
              <SelectTrigger className="mt-2 w-full md:w-1/2 border-slate-300">
                <SelectValue placeholder="Choose a plan..." />
              </SelectTrigger>
              <SelectContent>
                {plansData?.data?.map((plan) => (
                  <SelectItem key={plan._id} value={plan._id}>{plan.plan_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feature List */}
          <div className="space-y-4">
            {formData.features.map((feature, index) => (
              <div key={index} className={`bg-white rounded-xl border shadow-sm transition-all ${feature.is_enabled ? 'border-indigo-300 ring-1 ring-indigo-50' : 'opacity-60 border-gray-200'}`}>

                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={feature.is_enabled}
                      onCheckedChange={(v) => updateFeature(index, "is_enabled", v)}
                    />
                    <span className={`font-semibold text-base ${feature.is_enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                      {feature.feature_name}
                    </span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(index)} className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {feature.is_enabled && (
                  <div className="p-5">
                    {/* Tabs */}
                    <div className="mb-4">
                      <label className="text-xs text-slate-500 uppercase font-bold mb-2 block tracking-wider">
                        Value Format
                      </label>
                      <Tabs
                        value={feature.ui_format}
                        onValueChange={(v) => changeFormat(index, v)}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
                          <TabsTrigger value="TEXT" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Type className="w-4 h-4 mr-2" /> Text / Duration
                          </TabsTrigger>
                          <TabsTrigger value="NUMBER" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Hash className="w-4 h-4 mr-2" /> Limit / Quota
                          </TabsTrigger>
                          <TabsTrigger value="STATUS" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Status Select
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Dynamic Inputs */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">

                      {/* 1. TEXT FORMAT */}
                      {feature.ui_format === "TEXT" && (
                        <div className="w-full">
                          <label className="text-sm font-medium text-slate-700 block mb-1">Display Text</label>
                          <Input
                            placeholder="e.g. 1 Year, First 5 Days"
                            className="bg-white border-slate-300"
                            value={feature.value.data}
                            onChange={(e) => updateValue(index, "data", e.target.value)}
                          />
                        </div>
                      )}

                      {/* 2. LIMIT / QUOTA FORMAT (With Unlimited Check) */}
                      {feature.ui_format === "NUMBER" && (
                        <div className="flex flex-col gap-4">
                          {/* Radio Choice: Unlimited vs Limited */}
                          <div className="flex gap-4 p-1">
                            <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-md border ${feature.value.data === "Unlimited" ? "bg-white border-indigo-500 text-indigo-700" : "border-transparent hover:bg-gray-100"}`}>
                              <input
                                type="radio"
                                name={`limit-${index}`}
                                checked={feature.value.data === "Unlimited"}
                                onChange={() => setLimitMode(index, "UNLIMITED")}
                                className="accent-indigo-600"
                              />
                              <div className="flex items-center">
                                <InfinityIcon className="w-4 h-4 mr-2" />
                                <span className="font-medium text-sm">Unlimited</span>
                              </div>
                            </label>

                            <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-md border ${feature.value.data !== "Unlimited" ? "bg-white border-indigo-500 text-indigo-700" : "border-transparent hover:bg-gray-100"}`}>
                              <input
                                type="radio"
                                name={`limit-${index}`}
                                checked={feature.value.data !== "Unlimited"}
                                onChange={() => setLimitMode(index, "LIMITED")}
                                className="accent-indigo-600"
                              />
                              <span className="font-medium text-sm">Limited / Specific Count</span>
                            </label>
                          </div>

                          {/* Conditional Inputs: Only show if NOT unlimited */}
                          {feature.value.data !== "Unlimited" && (
                            <div className="flex gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Quantity</label>
                                <Input
                                  type="number"
                                  placeholder="e.g. 15"
                                  className="bg-white border-slate-300"
                                  value={feature.value.data}
                                  onChange={(e) => updateValue(index, "data", e.target.value)}
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Unit</label>
                                <Input
                                  placeholder="e.g. /product"
                                  className="bg-white border-slate-300"
                                  value={feature.value.unit}
                                  onChange={(e) => updateValue(index, "unit", e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. STATUS FORMAT */}
                      {feature.ui_format === "STATUS" && (
                        <div className="w-full">
                          <label className="text-sm font-medium text-slate-700 block mb-1">Select Status</label>
                          <Select
                            value={feature.value.data}
                            onValueChange={(v) => updateValue(index, "data", v)}
                          >
                            <SelectTrigger className="bg-white border-slate-300">
                              <SelectValue placeholder="Select status..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Enable">Enable</SelectItem>
                              <SelectItem value="Disable">Disable</SelectItem>
                              <SelectItem value="Free">Free</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Trigger (Same as before) */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-700">Available Features</h4>
                <span className="text-xs text-slate-500">{availableFeatures.length} remaining</span>
              </div>
              {availableFeatures.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {availableFeatures.map(feat => (
                    <Badge
                      key={feat._id}
                      variant="outline"
                      className="cursor-pointer bg-white hover:bg-indigo-50 hover:border-indigo-300 py-2 px-3 transition-all border-slate-300 text-slate-600"
                      onClick={() => setSelectedFeatureIds([feat._id])}
                    >
                      <Plus className="w-3 h-3 mr-1.5" /> {feat.feature_name}
                    </Badge>
                  ))}
                </div>
              )}
              {selectedFeatureIds.length > 0 && (
                <Button type="button" onClick={addSelectedFeatures} className="mt-4 bg-slate-900 text-white">
                  Confirm Add
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-200 gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={isSubmitting} // Prevents double-clicks
              className="bg-[#0c1f4d] hover:bg- w-full md:w-auto min-w-[150px] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPlanFeatureMappingForm;
