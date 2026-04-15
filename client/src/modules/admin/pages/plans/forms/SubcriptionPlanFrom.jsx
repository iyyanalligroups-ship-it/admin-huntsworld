import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useCreatePlanMutation,
  useUpdatePlanMutation,
} from "@/redux/api/SubcriptionPlanApi";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import showToast from "@/toast/showToast";

const SubcriptionPlanForm = ({ open, setOpen, plan }) => {
  const [formData, setFormData] = useState({
    plan_code: "",
    plan_name: "",
    price: "",
    strike_amount: "", // New field
    status: "Active",
    description: "",
  });
  console.log(plan, "plan selected");

  const [createPlan] = useCreatePlanMutation();
  const [updatePlan] = useUpdatePlanMutation();

  useEffect(() => {
    if (plan) {
      setFormData({
        plan_code: plan.plan_name ? plan.plan_name.toUpperCase() : "",
        plan_name: plan?.plan_name || "",
        price: plan?.price || "",
        strike_amount: plan?.strike_amount || "", // Populate strike_amount
        status: plan?.status || "Active",
        description: plan?.description || "",
      });
    } else {
      setFormData({
        plan_code: "",
        plan_name: "",
        price: "",
        strike_amount: "",
        status: "Active",
        description: "",
      });
    }
  }, [plan]);

  // Auto-update plan_code when plan_name changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      plan_code: prev.plan_name ? prev.plan_name.toUpperCase() : "",
    }));
  }, [formData.plan_name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Optional: Convert empty strike_amount to null or keep as empty string
    const payload = {
      ...formData,
      strike_amount: formData.strike_amount ? Number(formData.strike_amount) : null,
      price: Number(formData.price),
    };

    try {
      let response;
      if (plan) {
        response = await updatePlan({ id: plan._id, ...payload }).unwrap();
        showToast("Subscription plan updated successfully.", "success");
      } else {
        response = await createPlan(payload).unwrap();
        showToast("Subscription plan created successfully.", "success");
      }
    } catch (err) {
      showToast(
        plan
          ? "Failed to update subscription plan."
          : "Failed to create subscription plan.",
        "error"
      );
    }

    // Reset form and close dialog
    setFormData({
      plan_code: "",
      plan_name: "",
      price: "",
      strike_amount: "",
      status: "Active",
      description: "",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Add Plan"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Plan Name</label>
            <Input
              name="plan_name"
              placeholder="e.g. Premium Annual"
              value={formData.plan_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Plan Code (Auto-generated)</label>
            <Input
              name="plan_code"
              placeholder="Auto-filled from Plan Name"
              value={formData.plan_code}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Price (₹)</label>
            <Input
              type="number"
              name="price"
              placeholder="e.g. 999"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Strike Amount (Original Price - Optional)
            </label>
            <Input
              type="number"
              name="strike_amount"
              placeholder="e.g. 1999 (will show as strikethrough)"
              value={formData.strike_amount}
              onChange={handleChange}
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty if no discount. Must be higher than actual price to show.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
            <Textarea
              name="description"
              placeholder="Brief description of the plan"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0c1f4d] hover:bg-[#0c1f4d]/90">
              {plan ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubcriptionPlanForm;
