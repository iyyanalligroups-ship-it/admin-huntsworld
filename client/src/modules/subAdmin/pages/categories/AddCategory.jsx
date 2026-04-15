import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import AddFullCategoryModal from "./AddFullCategoryModel";
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import {
  Network, GitMerge, Type, FolderTree,
  PlusCircle, Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AddCategory = ({ onSuccess }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { isSidebarOpen } = useSidebar();

  return (
    <div className={`p-4 md:p-6 bg-slate-50/50 min-h-screen transition-all duration-300 ${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"}`}>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start h-full">

        {/* ---------------------------------------------------------------------------
            LEFT PANEL: TAXONOMY SOP
           --------------------------------------------------------------------------- */}
        <div className="xl:col-span-1 space-y-6 sticky top-6">

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
              Taxonomy Builder
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Protocols for constructing the Master Category Tree.
            </p>
          </div>

          <div className="space-y-4">

            {/* SOP 1: Hierarchy Logic */}
            <Card className="border-l-4 border-l-indigo-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <Network size={16} className="text-indigo-600" />
                  1. The 4-Tier Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex gap-2 items-center">
                    <span className="font-bold text-[#0c1f4d]">L1: Category</span> (e.g., Electronics)
                  </li>
                  <li className="flex gap-2 items-center pl-2">
                    <span className="text-slate-400">↳</span>
                    <span className="font-bold text-[#0c1f4d]">L2: Sub</span> (e.g., Audio)
                  </li>
                  <li className="flex gap-2 items-center pl-4">
                    <span className="text-slate-400">↳</span>
                    <span className="font-bold text-[#0c1f4d]">L3: Super Sub</span> (e.g., Headphones)
                  </li>
                  <li className="flex gap-2 items-center pl-6">
                    <span className="text-slate-400">↳</span>
                    <span className="font-bold text-[#0c1f4d]">L4: Deep Sub</span> (e.g., Wireless)
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* SOP 2: Bulk Creation */}
            <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <GitMerge size={16} className="text-emerald-600" />
                  2. Tree Construction
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  This tool allows <strong>Vertical Creation</strong>.
                  <br/>
                  You can create a parent and immediately attach children and grandchildren in a single session. This prevents "Orphaned Categories".
                </p>
              </CardContent>
            </Card>

            {/* SOP 3: Naming */}
            <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <Type size={16} className="text-blue-600" />
                  3. Naming Standard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Use <strong>Title Case</strong> (e.g., "Men's Fashion").
                  <br/>
                  Ensure names are unique within their specific parent branch to avoid search conflicts.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* ---------------------------------------------------------------------------
            RIGHT PANEL: ACTION WORKSPACE
           --------------------------------------------------------------------------- */}
        <div className="xl:col-span-3 h-[calc(100vh-100px)] flex flex-col items-center justify-center">

          <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-[#0c1f4d]">
            <CardContent className="p-10 flex flex-col items-center text-center space-y-6">

              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                <FolderTree className="w-10 h-10 text-[#0c1f4d]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                  Category Architect
                </h2>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Start building your product hierarchy. Click below to open the multi-level tree builder.
                </p>
              </div>

              <div className="pt-4 w-full">
                <Button
                  onClick={() => setModalOpen(true)}
                  size="lg"
                  className="w-full h-14 text-lg bg-[#0c1f4d] hover:bg-[#153171] shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02]"
                >
                  <PlusCircle className="mr-2 h-6 w-6" /> Add Full Category Tree
                </Button>

                <p className="text-xs text-slate-400 mt-4 flex items-center justify-center gap-2">
                  <Layers size={12} /> Supports bulk entry for L1, L2, L3, and L4 levels
                </p>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>

      {/* Full Hierarchy Modal */}
      <AddFullCategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          onSuccess?.();
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default AddCategory;
