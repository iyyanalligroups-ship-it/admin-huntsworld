// MerchantProgress.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ChevronLeft, ChevronRight,PhoneCall,CheckCircle2,ClipboardList } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------ */
/* ✅ SAFE TRUNCATE COMPONENT (NO PROP LEAKING) */
/* ------------------------------------------------------------------ */



const Truncate = ({ text }) => {
  const rawText = text ?? "N/A";

  // Replace hyphens & underscores
  let formattedText = rawText.replace(/[-_]/g, " ");

  // Capitalize each word
  formattedText = formattedText.replace(/\b\w/g, (c) => c.toUpperCase());

  const isLong = formattedText.length > 15;
  const truncated = isLong
    ? `${formattedText.slice(0, 15)}…`
    : formattedText;

  if (!isLong) {
    return (
      <span className="inline-block max-w-[10ch] truncate">
        {formattedText}
      </span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* ⚠️ No spreading props here */}
          <span className="inline-block max-w-[10ch] truncate cursor-default">
            {truncated}
          </span>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs break-words p-2 bg-gray-900 text-white"
        >
          {formattedText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/* ------------------------------------------------------------------ */
/* MAIN COMPONENT */
/* ------------------------------------------------------------------ */

const MerchantProgress = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { isSidebarOpen } = useSidebar();

  const fetchMerchants = async (p = 1) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/merchants/low-progress?page=${p}&limit=10&unread_only=true`
      );

      setData(res.data.data || []);
      setTotalPages(res.data.total_pages || 1);
    } catch (error) {
      console.error("Failed to fetch merchants:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/merchants/mark-read/${id}`
      );
      fetchMerchants(page);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  useEffect(() => {
    fetchMerchants(page);
  }, [page]);

  /* ------------------------------------------------------------------ */
  /* PAGINATION */
  /* ------------------------------------------------------------------ */

  const Pagination = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-600">
        Page <span className="font-medium">{page}</span> of{" "}
        <span className="font-medium">{totalPages}</span>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* RENDER */
  /* ------------------------------------------------------------------ */

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        isSidebarOpen ? "lg:ml-64" : "lg:ml-16"
      }`}
    >
      <div className="p-4 lg:p-6">
        <h1 className="text-md w-fit border-l-4 border-[#0c1f4d] bg-gray-100 p-2 pl-4 rounded-r-2xl font-bold text-[#153171] mb-4">
          Incomplete Merchant Profiles
        </h1>
 {/* SOP / Outreach Guidelines */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ClipboardList className="text-indigo-700 mt-1 shrink-0" size={24} />
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-indigo-900">
                Incomplete Profile Outreach SOP
              </h2>
              <p className="text-sm text-indigo-800">
                These merchants have started registration but stopped midway. Your goal is to contact them and assist in reaching 100% completion.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {/* Step 1: Analyze */}
                <div className="bg-white/70 p-3 rounded border border-indigo-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2 py-0.5 rounded">Step 1</span>
                    <span className="font-semibold text-gray-900 text-sm">Analyze Progress</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Check the <span className="font-bold text-blue-600">% Progress</span> column. Higher percentages (e.g., 70%+) indicate high intent but potential technical issues.
                  </p>
                </div>

                {/* Step 2: Contact */}
                <div className="bg-white/70 p-3 rounded border border-indigo-100">
                  <div className="flex items-center gap-2 mb-1">
                    <PhoneCall className="w-3 h-3 text-green-600" />
                    <span className="font-semibold text-gray-900 text-sm">Contact Merchant</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Use the provided <strong>Phone</strong> or <strong>Email</strong>. Ask: <em>"We noticed your profile is incomplete. Do you need help uploading documents?"</em>
                  </p>
                </div>

                {/* Step 3: Clear */}
                <div className="bg-white/70 p-3 rounded border border-indigo-100">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    <span className="font-semibold text-gray-900 text-sm">Action & Archive</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Once you have contacted the merchant (or if it is a spam entry), click <strong>"Mark as Read"</strong> to remove them from this pending list.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ---------------- DESKTOP TABLE ---------------- */}
        <div className="hidden md:block rounded-lg border bg-white shadow-sm">
          <Table>
            <TableCaption className="text-sm text-gray-500">
              Merchants with incomplete profiles (unread only)
            </TableCaption>

            <TableHeader className="bg-[#0c1f4d]">
              <TableRow>
                {["Company Name", "Email", "Phone", "Progress", "Action"].map(
                  (h) => (
                    <TableHead
                      key={h}
                      className="px-4 py-3 text-sm font-semibold text-white"
                    >
                      {h}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No incomplete profiles found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((m) => (
                  <TableRow key={m._id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <Truncate text={m.company_name} />
                    </TableCell>
                    <TableCell>{m.company_email}</TableCell>
                    <TableCell>{m.company_phone_number}</TableCell>
                    <TableCell className="text-center font-semibold text-blue-600">
                      {m.merchant_progress}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(m._id)}
                        className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark as Read
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ---------------- MOBILE VIEW ---------------- */}
        <div className="md:hidden space-y-4">
          {data.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                No incomplete profiles found.
              </CardContent>
            </Card>
          ) : (
            data.map((m) => (
              <Card key={m._id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {m.company_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span>{m.company_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{m.company_phone_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span className="font-semibold text-blue-600">
                      {m.merchant_progress}%
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => markAsRead(m._id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark as Read
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Pagination />
      </div>
    </div>
  );
};

export default MerchantProgress;
