
import React from "react";
import { useSidebar } from "../../hooks/useSidebar";
import SubcriptionPlanList from "./pages/SubcriptionPlanList";
import SubscriptionPlanElementList from "./pages/SubcriptionPlanElementList";
import SubscriptionPlanElementMappingList from "./pages/SubscriptionPlanElementMappingList";
import {GitMerge,Layers,CreditCard} from 'lucide-react'
import { Card,CardHeader,CardTitle,CardContent  } from "@/components/ui/card";
const Subcriptions = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  return (
    <>
      <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>
        {/* ---------------------------------------------------------------------------
            LEFT PANEL: SUBSCRIPTION ARCHITECTURE SOP
           --------------------------------------------------------------------------- */}
        <div className="xl:col-span-1">

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
              Subscription Logic
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Protocols for configuring pricing tiers and feature entitlements.
            </p>
          </div>

       <div className="flex flex-col md:flex-row gap-2 space-y-4 mb-4 md:space-y-0">
            {/* Visual connector line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200 -z-10 hidden xl:block"></div>

            {/* SOP 1: Plans */}
            <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <CreditCard size={16} className="text-blue-600" />
                  1. Define Tiers (Plans)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Create the high-level containers (e.g., <em>Gold, Silver, Platinum</em>).
                  <br/>
                  Define the <strong>Price</strong>, <strong>Validity Period</strong>, and <strong>User Limits</strong> here.
                </p>
              </CardContent>
            </Card>

            {/* SOP 2: Elements */}
            <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <Layers size={16} className="text-emerald-600" />
                  2. Define Features (Elements)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Create the individual "atomic" units of value (e.g., <em>"24/7 Support", "10GB Storage", "Analytics"</em>).
                  <br/>
                  <span className="italic">These are standalone items not yet attached to a plan.</span>
                </p>
              </CardContent>
            </Card>

            {/* SOP 3: Mapping */}
            <Card className="border-l-4 border-l-purple-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <GitMerge size={16} className="text-purple-600" />
                  3. Configuration (Mapping)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>The Final Step:</strong> Connect the <em>Features</em> to the <em>Plans</em>.
                  <br/>
                  Select a Plan - Select Features - Save. This determines what the user actually gets when they pay.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* ---------------------------------------------------------------------------
            RIGHT PANEL: FUNCTIONAL COMPONENTS
           --------------------------------------------------------------------------- */}
        <div className="">
          <SubcriptionPlanList />
          <SubscriptionPlanElementList />
          <SubscriptionPlanElementMappingList />
        </div>
      </div>
    </>
  );
};


export default Subcriptions;
