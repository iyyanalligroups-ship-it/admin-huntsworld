// components/forms/SubscriptionFeatureForm.jsx
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
import { Label } from "@/components/ui/label";
import {
  useCreateElementMutation,
  useUpdateElementMutation,
} from "@/redux/api/SubscriptionPlanElementApi";
import showToast from "@/toast/showToast";

const SubscriptionFeatureForm = ({ open, setOpen, feature }) => {
  const [formData, setFormData] = useState({
    feature_name: "",
  });

  const [createFeature] = useCreateElementMutation();
  const [updateFeature] = useUpdateElementMutation();

  // Initialize form correctly on open/edit
  useEffect(() => {
    if (feature) {
      setFormData({
        feature_name: feature.feature_name || "",
      });
    } else {
      setFormData({ feature_name: "" });
    }
  }, [feature, open]); // Re-run if dialog opens with new feature

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.feature_name.trim()) {
      showToast("Feature name is required", "error");
      return;
    }

    // 🔥 Always generate feature_code from feature_name
    const generatedCode = formData.feature_name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "_");

    const payload = {
      feature_name: formData.feature_name.trim(),
      feature_code: generatedCode,
    };

    try {
      let response;

      if (feature) {
        // ✅ UPDATE
        response = await updateFeature({
          id: feature._id,
          ...payload,
        }).unwrap();
      } else {
        // ✅ CREATE
        response = await createFeature(payload).unwrap();
      }

      const successMsg =
        response?.message ||
        (feature
          ? "Feature updated successfully"
          : "Feature created successfully");

      showToast(successMsg, "success");

      setOpen(false);
    } catch (err) {
      console.error("Feature save error:", err);

      let errorMsg = "Operation failed. Please try again.";

      if (err?.data?.message) {
        errorMsg = err.data.message;
      } else if (typeof err?.data === "string") {
        errorMsg = err.data;
      }

      showToast(errorMsg, "error");
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {feature ? "Edit Feature" : "Add New Feature"}
          </DialogTitle>
          <DialogDescription>
            {feature
              ? "Update the name of this feature."
              : "Create a new feature that can be assigned to subscription plans."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="feature_name">Feature Name *</Label>
            <Input
              id="feature_name"
              placeholder="e.g., Unlimited Projects"
              value={formData.feature_name}
              onChange={(e) =>
                setFormData({ feature_name: e.target.value })
              }
              required
              autoFocus
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
            <Button
              type="submit"
              className="bg-[#0c1f4d] hover:bg-[#0a183a]"
            >
              {feature ? "Update Feature" : "Create Feature"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionFeatureForm;
