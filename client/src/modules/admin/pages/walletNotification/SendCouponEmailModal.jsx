import { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Ticket, FileText, Send } from "lucide-react";

export default function SendCouponEmailModal({
  open,
  onClose,
  userId,
  showToast,
}) {
  const [couponCode, setCouponCode] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!couponCode || !description) {
      showToast("All fields are required", "destructive");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/payment-accounts/send-coupon-email`,
        {
          userId,
          couponCode,
          description,
        }
      );

      showToast("Coupon email sent successfully 📧", "success");
      onClose();
      setCouponCode("");
      setDescription("");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to send email",
        "destructive"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-[#0c1f4d] p-6 text-white flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <Mail className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">Send Coupon Email</DialogTitle>
            <DialogDescription className="text-blue-100/70 text-sm mt-1">
              Deliver rewards directly to the user's inbox
            </DialogDescription>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#0c1f4d]" />
              Coupon Code
            </label>
            <Input
              placeholder="e.g. WELCOME50"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="border-2 border-slate-300 focus:border-[#0c1f4d] focus:ring-[#0c1f4d] h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0c1f4d]" />
              Instructions / Description
            </label>
            <Textarea
              placeholder="e.g. Provide details on how to use this coupon..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-2 border-slate-300 focus:border-[#0c1f4d] focus:ring-[#0c1f4d] min-h-[120px] resize-none"
            />
          </div>

          <Button 
            onClick={handleSend} 
            disabled={loading}
            className="w-full bg-[#0c1f4d] hover:bg-[#0c1f4dd0] text-white h-12 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {loading ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Email Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
