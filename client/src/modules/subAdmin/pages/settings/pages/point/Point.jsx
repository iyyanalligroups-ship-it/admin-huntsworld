import React, { useState } from 'react';
import TreandingPointForm from './PointForm';
import TreandingPointList from './PointList';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Settings, CreditCard, Database, AlertTriangle, PlusCircle } from "lucide-react";


const Point = () => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [open, setOpen] = useState(false);

  const handleEdit = (point) => {
    setSelectedPoint(point);
    setOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPoint(null);
    setOpen(true);
  };

  return (
    <div className="p-1 sm:p-6 md:p-8 lg:p-10">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Trending Points Section */}
        <div className="flex-1 space-y-6  p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Trending Points</h2>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="flex gap-2 items-center bg-[#0c1f4d] hover:bg-[#0c204df3] cursor-pointer ">
                  <PlusCircle className="w-4 h-4" /> Add Point
                </Button>
              </DialogTrigger>
              <DialogContent>
                <TreandingPointForm selectedPoint={selectedPoint} onClose={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* SOP / System Configuration Guidelines */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Settings className="text-slate-700 mt-1 shrink-0" size={24} />
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900">
                  System Variables & Subscription Protocols
                </h2>
                <p className="text-sm text-slate-800">
                  This dashboard controls the <strong>dynamic constants</strong> and <strong>subscription logic</strong> of the platform. Changes made here apply globally and immediately.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {/* Section 1: Subscriptions */}
                  <div className="bg-white/60 p-3 rounded border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span className="font-semibold text-gray-900 text-sm">Global Varibal</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Here is the manage all the common varibale value from here
                    </p>
                  </div>

                  {/* Section 2: System Constants */}
                  <div className="bg-white/60 p-3 rounded border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-900 text-sm">Dynamic Constants</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Manage global variables (e.g., Tax %, Platform Fees, API Timeouts). These values inject directly into the code logic without requiring a deployment.
                    </p>
                  </div>

                  {/* Section 3: Critical Warning */}
                  <div className="bg-white/60 p-3 rounded border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-gray-900 text-sm">Impact Warning</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      <strong>Caution:</strong> updating these variables affects live users instantly. Double-check values before saving to avoid system-wide disruptions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <TreandingPointList onEdit={handleEdit} />
        </div>


      </div>
    </div>

  );
};

export default Point;
