import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useCreateElementMutation,
  useUpdateElementMutation,
} from "@/redux/api/SubscriptionPlanElementApi";
import showToast from "@/toast/showToast";

const SubscriptionPlanElementForm = ({ open, setOpen, plan }) => {
  const [formData, setFormData] = useState({
    feature_name: "",
    feature_code: "",
  });

  // Track if user has manually edited the code
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  const [createElement] = useCreateElementMutation();
  const [updateElement] = useUpdateElementMutation();

  // Auto-calculate suggested code
  const suggestedCode = useMemo(() => {
    if (!formData.feature_name.trim()) return "";
    return formData.feature_name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")     // remove special characters
      .replace(/\s+/g, "_");           // spaces → underscore
  }, [formData.feature_name]);

  useEffect(() => {
    if (plan) {
      // Edit mode
      setFormData({
        feature_name: plan.feature_name || "",
        feature_code: plan.feature_code || "",
      });
      setCodeManuallyEdited(true); // assume existing codes were approved
    } else {
      // Create mode
      setFormData({
        feature_name: "",
        feature_code: "",
      });
      setCodeManuallyEdited(false);
    }
  }, [plan]);

  // Auto-fill suggested code only when creating + user hasn't edited yet
  useEffect(() => {
    if (!plan && !codeManuallyEdited) {
      setFormData((prev) => ({
        ...prev,
        feature_code: suggestedCode,
      }));
    }
  }, [suggestedCode, plan, codeManuallyEdited]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "feature_code") {
      setCodeManuallyEdited(true);
      // Enforce allowed characters (uppercase, numbers, underscore)
      const sanitized = value
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.feature_name.trim()) {
      showToast("Feature name is required", "error");
      return;
    }

    // ✅ Always ensure feature_code exists
    const finalCode =
      formData.feature_code?.trim() ||
      formData.feature_name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .replace(/\s+/g, "_");

    const payload = {
      feature_name: formData.feature_name.trim(),
      feature_code: finalCode,
    };

    console.log("Submitting Payload:", payload); // debug

    try {
      if (plan) {
        await updateElement({
          id: plan._id,
          ...payload,
        }).unwrap();

        showToast("Feature updated successfully", "success");
      } else {
        await createElement(payload).unwrap();

        showToast("Feature created successfully", "success");
      }

      setFormData({ feature_name: "", feature_code: "" });
      setCodeManuallyEdited(false);
      setOpen(false);
    } catch (err) {
      const errorMsg =
        err?.data?.message ||
        "Failed to save feature. Please try again.";

      showToast(errorMsg, "error");
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Feature" : "Add New Feature"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Feature Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Feature Name *</label>
            <Input
              name="feature_name"
              placeholder="e.g. Advanced Analytics Dashboard"
              value={formData.feature_name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          {/* Feature Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>Feature Code *</span>
              {!codeManuallyEdited && !plan && suggestedCode && (
                <span className="text-xs text-green-600">auto-suggested</span>
              )}
            </label>

            <Input
              name="feature_code"
              value={formData.feature_code}
              onChange={handleChange}
              placeholder="ADVANCED_ANALYTICS_DASHBOARD"
              className="font-mono tracking-wide"
              required
            />

            <p className="text-xs text-muted-foreground">
              Uppercase letters, numbers and underscores only.
              {suggestedCode &&
                suggestedCode !== formData.feature_code &&
                !codeManuallyEdited && (
                  <button
                    type="button"
                    className="ml-2 text-indigo-600 hover:underline text-xs"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        feature_code: suggestedCode,
                      }))
                    }
                  >
                    Use suggestion
                  </button>
                )}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {plan ? "Update Feature" : "Create Feature"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPlanElementForm;
