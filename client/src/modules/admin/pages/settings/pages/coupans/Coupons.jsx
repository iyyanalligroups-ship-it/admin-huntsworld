import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import CouponForm from './CouponsForm';
import CouponList from './CouponsList';
   import { TicketPercent, PlusCircle, FilePenLine, Trash2 } from "lucide-react";


const Coupons = () => {
  const [open, setOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const handleAddNew = () => {
    setSelectedCoupon(null);
    setOpen(true);
  };

  const handleEdit = (coupon) => {
    setSelectedCoupon(coupon);
    setOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Coupon Names</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="flex gap-2 items-center">
              <PlusCircle className="w-4 h-4" /> Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="text-lg font-semibold">
              {selectedCoupon ? "Edit Coupon" : "Add Coupon"}
            </DialogTitle>
            <CouponForm selectedCoupon={selectedCoupon} onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

{/* SOP / Coupon Management Guidelines */}
<div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 mb-6 shadow-sm">
    <div className="flex items-start gap-3">
        <TicketPercent className="text-emerald-700 mt-1 shrink-0" size={24} />
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-emerald-900">
                Coupon Management SOP
            </h2>
            <p className="text-sm text-emerald-800">
                Manage the library of coupon codes. These codes are used to grant discounts or special access within the application.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {/* Step 1: Add */}
                <div className="bg-white/60 p-3 rounded border border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                        <PlusCircle className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-gray-900 text-sm">Create New</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      coupon from the which platform add the name here like Amazon , Flipkart etc..
                    </p>
                </div>

                {/* Step 2: Edit */}
                <div className="bg-white/60 p-3 rounded border border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                        <FilePenLine className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-900 text-sm">Update</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        Use the <strong>Edit</strong> button to fix typos in the coupon name.
                        <span className="italic text-gray-500"> (Note: Changing a name might affect users currently trying to use the old code).</span>
                    </p>
                </div>

                {/* Step 3: Delete */}
                <div className="bg-white/60 p-3 rounded border border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span className="font-semibold text-gray-900 text-sm">Remove</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        Use <strong>Delete</strong> to remove expired or obsolete coupons. This action ensures users can no longer select or apply this specific code.
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>
      <CouponList onEdit={handleEdit} />
    </div>
  );
};

export default Coupons;
