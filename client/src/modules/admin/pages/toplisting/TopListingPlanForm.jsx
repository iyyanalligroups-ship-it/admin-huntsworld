import axios from "axios";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import showToast from "@/toast/showToast";
import { Loader2, Save, Wand2, AlertTriangle } from "lucide-react";

const API = `${import.meta.env.VITE_API_URL}/top-listing-plan`;

const INITIAL_STATE = {
  plan_name: "",
  plan_code: "",
  amount: "",
  duration_days: "",
  description: "",
};

export default function TopListingPlanForm({
  open,
  setOpen,
  editData,
  setEditData,
  onRefresh,
}) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(editData ? { ...editData } : INITIAL_STATE);
    } else {
      setForm(INITIAL_STATE);
      setEditData(null);
    }
  }, [open, editData, setEditData]);

  // Standard handler for simple inputs
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Special handler: Updates Code when Name changes (Even in Edit Mode)
  const handleNameChange = (e) => {
    const nameValue = e.target.value;

    // Logic: UpperCase + Replace Spaces with Underscores
    const generatedCode = nameValue
      .toUpperCase()
      .replace(/\s+/g, "_");

    setForm({
      ...form,
      plan_name: nameValue,
      plan_code: generatedCode, // Updates dynamic code
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.plan_name || !form.plan_code || !form.amount || !form.duration_days) {
        setLoading(false);
        return showToast("Please fill in all required fields marked (*)", "error");
      }

      if (parseFloat(form.amount) < 0 || parseInt(form.duration_days) < 0) {
        setLoading(false);
        return showToast("Amount and Duration cannot be negative", "error");
      }

      if (editData) {
        await axios.put(`${API}/update/${editData._id}`, form);
        showToast("Plan updated successfully", "success");
      } else {
        await axios.post(`${API}/create`, form);
        showToast("Plan created successfully", "success");
      }

      onRefresh();
      setOpen(false);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Action failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {editData ? <Save className="w-5 h-5 text-blue-600" /> : <Save className="w-5 h-5 text-green-600" />}
            {editData ? "Update Subscription Plan" : "Create New Plan"}
          </DialogTitle>
          <DialogDescription>
            {editData
              ? "Modify the details of the existing listing plan."
              : "Define the details for a new top listing subscription package."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">

          {/* Row 1: Basic Identity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan_name" className="text-sm font-medium">
                Plan Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="plan_name"
                name="plan_name"
                placeholder="e.g. Gold Premium"
                value={form.plan_name}
                onChange={handleNameChange} // Triggers auto-generation
                autoFocus
                className="border-2 border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan_code" className="text-sm font-medium flex items-center gap-1">
                Plan Code <span className="text-red-500">*</span>
                <Wand2 className="w-3 h-3 text-gray-400" />
              </Label>
              <Input
                id="plan_code"
                name="plan_code"
                placeholder="e.g. GOLD_PREMIUM"
                value={form.plan_code}
                // Allow manual override if needed
                onChange={(e) => setForm({...form, plan_code: e.target.value.toUpperCase().replace(/\s+/g, "_")})}
                className="bg-gray-50 border-2 border-slate-300"
              />
              {/* SOP Warning: Only show when editing to warn about breaking changes */}
              {editData && (
                <p className="text-[11px] text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Warning: Changing code may affect active users.
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                placeholder="e.g. 499"
                value={form.amount}
                onChange={handleChange}
                className="border-2 border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_days" className="text-sm font-medium">
                Duration (Days) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duration_days"
                name="duration_days"
                type="number"
                min="1"
                placeholder="e.g. 30"
                value={form.duration_days}
                onChange={handleChange}
                className="border-2 border-slate-300"
              />
            </div>
          </div>

          {/* Row 3: Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description / Benefits
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="e.g. List the benefits included in this plan..."
              value={form.description}
              onChange={handleChange}
              className="resize-none h-24 border-2 border-slate-300"
            />
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className={editData ? "bg-blue-600 ml-2 hover:bg-blue-700" : "bg-green-600 ml-2 cursor-pointer hover:bg-green-700"}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                editData ? "Update Plan" : "Create Plan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
