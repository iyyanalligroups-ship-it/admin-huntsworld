import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Landmark, Smartphone, Phone } from "lucide-react";

const CopyRow = ({ label, value }) => {
  if (!value) return null;

  const copy = () => navigator.clipboard.writeText(value);

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
        <Button size="icon" variant="ghost" onClick={copy}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function StudentPaymentDetailsModal({
  open,
  onClose,
  data = [],
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Student Payment Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {data.map((item) => (
            <div
              key={item._id}
              className="border rounded-lg p-4 space-y-2"
            >
              {/* BANK */}
              {item.payment_method === "BANK" && (
                <>
                  <div className="flex items-center gap-2 font-semibold">
                    <Landmark className="h-4 w-4 text-indigo-600" />
                    Bank Details
                  </div>
                  <CopyRow label="Account Holder" value={item.bank_details.account_holder_name} />
                  <CopyRow label="Account Number" value={item.bank_details.account_number} />
                  <CopyRow label="IFSC Code" value={item.bank_details.ifsc_code} />
                </>
              )}

              {/* UPI ID */}
              {item.payment_method === "UPI_ID" && (
                <>
                  <div className="flex items-center gap-2 font-semibold">
                    <Smartphone className="h-4 w-4 text-green-600" />
                    UPI ID
                  </div>
                  <CopyRow label="UPI ID" value={item.upi_id} />
                </>
              )}

              {/* UPI NUMBER */}
              {item.payment_method === "UPI_NUMBER" && (
                <>
                  <div className="flex items-center gap-2 font-semibold">
                    <Phone className="h-4 w-4 text-orange-600" />
                    UPI Number
                  </div>
                  <CopyRow label="UPI Number" value={item.upi_number} />
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
