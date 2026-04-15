import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2,AlertTriangle,Clock,Calculator } from "lucide-react";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import showToast from "@/toast/showToast";
import { Card, CardContent,CardHeader,CardTitle } from "@/components/ui/card";

const SubscriptionPlanList = ({ data, onEdit, onDelete, userId, currentPage = "plans/common-subscriptions", totalPages = 1, totalPlans = 0, onPageChange }) => {

  const { data: currentUser, isError: isUserError, error: userError } =
    useGetUserByIdQuery(userId, { skip: !userId });


  const pagePermissions = currentUser?.approved_permissions?.find(
    (p) => p.page === currentPage
  );

  const canEdit = pagePermissions?.actions?.includes("edit") || false;
  const canDelete = pagePermissions?.actions?.includes("delete") || false;
  if (isUserError) {
    console.error("Error fetching user permissions:", isUserError);
    showToast("Failed to load user permissions", "error");
  }

  const handlePaginationChange = (newPage) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  return (
    <div className="">
      {/* Table view for larger screens */}
       <div className="xl:col-span-1">

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
                    System Variables
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    Protocols for configuring subscription tiers and dynamic system constants.
                  </p>
                </div>

               <div className="flex flex-col md:flex-row gap-2 space-y-4 mb-4 md:space-y-0">

                  {/* SOP 1: Variable Definition */}
                  <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                        <Calculator size={16} className="text-blue-600" />
                        1. Value Definition
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        This registry controls global values.
                        <br/>
                        <strong>For GST:</strong> Set <em>Name="GST"</em>, <em>Price=18</em> (representing %).
                        <br/>
                        <strong>For Banner Ads:</strong> Set <em>Name="Banner_Slot_1"</em>, <em>Price=5000</em>.
                        <br/>
                        <span className="italic text-slate-500">Ensure naming conventions match backend keys exactly.</span>
                      </p>
                    </CardContent>
                  </Card>

                  {/* SOP 2: Duration Logic */}
                  <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                        <Clock size={16} className="text-emerald-600" />
                        2. Duration Logic
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>Subscriptions:</strong> Define valid validity (e.g., <em>30 Days</em>).
                        <br/>
                        <strong>One-time Fees:</strong> For items like <em>Trendpoints</em> or <em>Ad Slots</em>, set Duration to <strong>"Fixed"</strong> or <strong>"Lifetime"</strong> to indicate a single purchase event.
                      </p>
                    </CardContent>
                  </Card>

                  {/* SOP 3: Critical Impact */}
                  <Card className="border-l-4 border-l-red-600 shadow-sm bg-white">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                        <AlertTriangle size={16} className="text-red-600" />
                        3. Modification Risks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>Do not delete</strong> variables used in calculation logic (e.g., GST).
                        <br/>
                        Updating a <em>Subscription Price</em> only affects <strong>new</strong> renewals, not active subscriptions.
                      </p>
                    </CardContent>
                  </Card>

                </div>
              </div>
      <div className="hidden md:block">
        <Table>
          <caption className="p-4 text-left text-gray-900 font-semibold bg-gray-100">
            All available subscription plans
          </caption>
          <TableHeader className="bg-[#0c1f4d]">
            <TableRow>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Name</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Category</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Duration Type</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Value</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Price</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No subscription plans found
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((plan) => (
                <TableRow key={plan._id} className="border-t">
                  <TableCell className="px-4 py-2">{plan.name || "-"}</TableCell>
                  <TableCell className="px-4 py-2">{plan.category || "-"}</TableCell>
                  <TableCell className="px-4 py-2">{plan.durationType || "-"}</TableCell>
                  <TableCell className="px-4 py-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {plan.durationValue || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      ₹{plan.price || "0"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-2 flex justify-end gap-2">
                    <Button
                      size="sm"
                      className="bg-[#0c1f4d] hover:bg-[#0c1f4dcb] cursor-pointer"
                      onClick={() => onEdit(plan)}
                      disabled={!canEdit}
                      title={!canEdit ? "You do not have permission to edit plans" : "Edit plan"}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-500 cursor-pointer"
                      onClick={() => onDelete(plan._id, plan.name)}
                      disabled={!canDelete}
                      title={!canDelete ? "You do not have permission to delete plans" : "Delete plan"}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Card view for mobile screens */}
      <div className="md:hidden space-y-4">
        {data?.data?.length === 0 ? (
          <div className="text-center text-gray-600">No subscription plans found</div>
        ) : (
          data?.data?.map((plan) => (
            <div key={plan._id} className="border rounded-lg shadow-md p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm">{plan.name || "-"}</h3>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="bg-[#0c1f4d] hover:bg-[#0c1f4dcb] cursor-pointer"
                      onClick={() => onEdit(plan)}
                      disabled={!canEdit}
                      title={!canEdit ? "You do not have permission to edit plans" : "Edit plan"}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-500 cursor-pointer"
                      onClick={() => onDelete(plan._id, plan.name)}
                      disabled={!canDelete}
                      title={!canDelete ? "You do not have permission to delete plans" : "Delete plan"}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <p><span className="font-medium">Category:</span> {plan.category || "-"}</p>
                  <p><span className="font-medium">Duration Type:</span> {plan.durationType || "-"}</p>
                  <p>
                    <span className="font-medium">Value:</span>{" "}
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {plan.durationValue || "-"}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Price:</span>{" "}
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      ₹{plan.price || "0"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center mt-4 gap-4">
        <div className="text-xs sm:text-sm text-gray-600">
          Total Records: {totalPlans}
        </div>
        <div className="flex justify-center gap-2 sm:gap-4">
          <Button
            disabled={currentPage === 1 || totalPlans === 0}
            onClick={() => handlePaginationChange(currentPage - 1)}
            variant="outline"
            className="text-xs sm:text-sm"
          >
            Previous
          </Button>
          <span className="font-semibold text-xs sm:text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            disabled={currentPage === totalPages || totalPlans === 0}
            onClick={() => handlePaginationChange(currentPage + 1)}
            variant="outline"
            className="text-xs sm:text-sm"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanList;
