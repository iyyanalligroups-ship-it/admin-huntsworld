import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useSyncWithRazorpayMutation,
} from "@/redux/api/SubcriptionPlanApi";
import { Trash2, RefreshCw, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import showToast from "@/toast/showToast";


const getInitialState = () => ({
  plan_code: "",
  plan_name: "",
  price: "",
  strike_amount: "",
  business_type: "",
  status: "Active",
  description: "",
  razorpay_plan_id: "",
  razorpay_plan_id_test: "",
  razorpay_plan_id_live: "",
});
const SubcriptionPlanForm = ({ open, setOpen, plan }) => {
  const [formData, setFormData] = useState({
    plan_code: "",
    plan_name: "",
    price: "",
    strike_amount: "",
    business_type: "",
    status: "Active",
    description: "",
    razorpay_plan_id: "",
    razorpay_plan_id_test: "",
    razorpay_plan_id_live: "",
  });

  const [createPlan] = useCreatePlanMutation();
  const [updatePlan] = useUpdatePlanMutation();
  const [deletePlan] = useDeletePlanMutation();
  const [syncWithRazorpay, { isLoading: isSyncing }] = useSyncWithRazorpayMutation();

  const resetForm = () => {
    setFormData(getInitialState());
  };

  const handleSyncRazorpay = async () => {
    if (!formData.plan_name.trim()) {
      showToast("Enter plan name first", "error");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      showToast("Enter a valid price first", "error");
      return;
    }

    try {
      const result = await syncWithRazorpay({
        plan_name: formData.plan_name.trim(),
        price: Number(formData.price),
      }).unwrap();

      if (result.mode === 'live') {
        setFormData((prev) => ({ ...prev, razorpay_plan_id_live: result.razorpay_plan_id }));
        showToast("Razorpay LIVE plan created successfully!", "success");
      } else {
        setFormData((prev) => ({ ...prev, razorpay_plan_id_test: result.razorpay_plan_id }));
        showToast("Razorpay TEST plan created successfully!", "success");
      }
    } catch (err) {
      console.error("Razorpay sync error:", err);
      showToast(err?.data?.message || "Failed to sync with Razorpay. Check your API keys.", "error");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this subscription plan? This action cannot be undone.")) {
      return;
    }

    try {
      await deletePlan(plan._id).unwrap();
      showToast("Plan deleted successfully", "success");
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      showToast(err?.data?.message || "Failed to delete plan", "error");
    }
  };
  // Initialize form when plan changes or dialog opens
  useEffect(() => {
    if (plan && open) {
      setFormData({
        plan_code: plan.plan_code || "",
        plan_name: plan.plan_name || "",
        price: plan.price || "",
        strike_amount: plan.strike_amount || "",
        business_type: plan.business_type || "",
        status: plan.status || "Active",
        description: plan.description || "",
        razorpay_plan_id: plan.razorpay_plan_id || "",
        razorpay_plan_id_test: plan.razorpay_plan_id_test || "",
        razorpay_plan_id_live: plan.razorpay_plan_id_live || "",
      });
    } else if (open && !plan) {
      resetForm();
    }
  }, [plan, open]);


  // Auto-generate plan_code from plan_name (uppercase, replace spaces with underscore)
  useEffect(() => {
    if (formData.plan_name) {
      const generatedCode = formData.plan_name
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, ""); // Remove special chars
      setFormData((prev) => ({
        ...prev,
        plan_code: generatedCode,
      }));
    } else {
      setFormData((prev) => ({ ...prev, plan_code: "" }));
    }
  }, [formData.plan_name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.plan_name.trim()) {
      showToast("Plan name is required", "error");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      showToast("Valid price is required", "error");
      return;
    }
    if (!formData.business_type) {
      showToast("Business type is required", "error");
      return;
    }

    const payload = {
      plan_code: formData.plan_code,
      plan_name: formData.plan_name.trim(),
      price: Number(formData.price),
      strike_amount: formData.strike_amount ? Number(formData.strike_amount) : null,
      business_type: formData.business_type,
      status: formData.status,
      description: formData.description.trim() || null,
      razorpay_plan_id: formData.razorpay_plan_id.trim() || null,
      razorpay_plan_id_test: formData.razorpay_plan_id_test.trim() || null,
      razorpay_plan_id_live: formData.razorpay_plan_id_live.trim() || null,
    };

    try {
      if (plan) {
        await updatePlan({ id: plan._id, ...payload }).unwrap();
        showToast("Plan updated successfully", "success");
      } else {
        await createPlan(payload).unwrap();
        showToast("Plan created successfully", "success");
      }
      resetForm();
      setOpen(false);
    } catch (err) {
      console.error("Plan save error:", err);
      showToast(
        err?.data?.message || "Failed to save plan. Check if plan code is unique.",
        "error"
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) resetForm();
      }}
    >

      <DialogContent
        className="sm:max-w-lg max-h-[600px] p-0 flex flex-col"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">
            {plan ? "Edit Subscription Plan" : "Create New Plan"}
          </DialogTitle>
          <DialogDescription>
            {plan
              ? "Update the details of this subscription plan."
              : "Fill in the details to create a new pricing tier."}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plan Name */}
            <div className="space-y-2">
              <Label htmlFor="plan_name">Plan Name *</Label>
              <Input
                id="plan_name"
                name="plan_name"
                placeholder="e.g. Pro Plan"
                value={formData.plan_name}
                onChange={handleChange}
                required
                autoFocus
                className="border-2 border-slate-300"
              />
              <p className="text-xs text-gray-500">
                Plan code will be auto-generated from this name
              </p>
            </div>

            {/* Plan Code (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="plan_code">Plan Code</Label>
              <Input
                id="plan_code"
                value={formData.plan_code}
                disabled
                placeholder="Auto-generated"
                className="bg-gray-50"
              />
            </div>

            {/* Business Type */}
            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type *</Label>
              <Select
                value={formData.business_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, business_type: value }))
                }
                required
              >
                <SelectTrigger className="border-2 border-slate-300">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merchant">Merchant</SelectItem>
                  <SelectItem value="grocery_seller">Grocery Seller</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price & Strike Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  name="price"
                  placeholder="e.g. 999"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1"
                  className="border-2 border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strike_amount">Strike Amount (₹)</Label>
                <Input
                  id="strike_amount"
                  type="number"
                  name="strike_amount"
                  placeholder="e.g. 1499 (optional)"
                  value={formData.strike_amount}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="border-2 border-slate-300"
                />
                <p className="text-xs text-gray-500">For discounted display</p>
              </div>
            </div>

            {/* Razorpay Plan IDs */}
            <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg bg-slate-50">
              <Label className="text-indigo-900 font-semibold mb-1 flex items-center justify-between">
                <span>Razorpay Auto-Pay Integration</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncRazorpay}
                  disabled={isSyncing}
                  className="h-7 text-xs border-indigo-200 hover:bg-indigo-50"
                >
                  {isSyncing ? (
                    <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Syncing...</>
                  ) : (
                    <><RefreshCw className="w-3 h-3 mr-1" /> Auto-Generate</>
                  )}
                </Button>
              </Label>

              <div className="space-y-2">
                <Label htmlFor="razorpay_plan_id_test" className="text-xs text-gray-500">Test Plan ID</Label>
                <Input
                  id="razorpay_plan_id_test"
                  name="razorpay_plan_id_test"
                  placeholder="plan_test_xxxxxx"
                  value={formData.razorpay_plan_id_test}
                  onChange={handleChange}
                  className={`h-9 border-2 border-slate-300 ${formData.razorpay_plan_id_test ? "border-amber-300 bg-amber-50" : "bg-white"}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razorpay_plan_id_live" className="text-xs text-gray-500">Live Plan ID</Label>
                <Input
                  id="razorpay_plan_id_live"
                  name="razorpay_plan_id_live"
                  placeholder="plan_live_xxxxxx"
                  value={formData.razorpay_plan_id_live}
                  onChange={handleChange}
                  className={`h-9 border-2 border-slate-300 ${formData.razorpay_plan_id_live ? "border-green-300 bg-green-50" : "bg-white"}`}
                />
              </div>

              {/* Legacy fallback / primary */}
              <div className="space-y-2">
                <Label htmlFor="razorpay_plan_id" className="text-xs text-gray-500">Primary/Legacy Plan ID (Optional)</Label>
                <Input
                  id="razorpay_plan_id"
                  name="razorpay_plan_id"
                  placeholder="Legacy ID"
                  value={formData.razorpay_plan_id}
                  onChange={handleChange}
                  className="h-8 text-xs bg-white"
                />
              </div>

              <p className="text-[10px] text-gray-500 italic mt-1 leading-tight">
                Fill the name and price, then click "Auto-Generate" to sync with Razorpay based on your current server mode.
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, status: v }))
                }
              >
                <SelectTrigger className="border-2 border-slate-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="e.g. Best for professionals who need advanced features..."
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="border-2 border-slate-300"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-2">
              {plan && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#0c1f4d] hover:bg-[#0a183a]"
              >
                {plan ? "Update Plan" : "Create Plan"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubcriptionPlanForm;
