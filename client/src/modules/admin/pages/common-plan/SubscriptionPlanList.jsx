import { useState, useEffect } from "react";
import { Pencil, Trash2,AlertTriangle,Clock,Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SubscriptionPlanList = ({ data, onEdit, onDelete }) => {
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const itemsPerPage = 10;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const plans = data?.data || [];
  const totalPages = Math.ceil(plans.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = page * itemsPerPage;
  const currentPlans = plans.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="">
      {/* Desktop Table */}


      {/* ---------------------------------------------------------------------------
            LEFT PANEL: DYNAMIC VARIABLE SOP
           --------------------------------------------------------------------------- */}
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
      <div className="hidden sm:block w-full overflow-x-scroll border">
        <Table className="min-w-[200px] w-full text-sm">
          <TableCaption className="text-left font-semibold text-gray-900 bg-gray-100 p-4">
            All available subscription plans
          </TableCaption>

          <TableHeader className="bg-[#0c1f4d]">
            <TableRow >
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Name</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Category</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Duration Type</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Value</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Price</TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentPlans.length ? (
              currentPlans.map((plan) => (
                <TableRow key={plan._id} className="border-t">
                  <TableCell className="px-4 py-2">{plan.name}</TableCell>
                  <TableCell className="px-4 py-2">{plan.category}</TableCell>
                  <TableCell className="px-4 py-2">{plan.durationType}</TableCell>
                  <TableCell className="px-4 py-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {plan.durationValue}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      ₹{plan.price}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        className="bg-[#0c1f4d] hover:bg-[#0c1f4dcb]"
                        onClick={() => onEdit(plan)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-500"
                        onClick={() => onDelete(plan._id, plan.name)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-500 py-4"
                >
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {currentPlans.length ? (
          currentPlans.map((plan) => (
            <Card key={plan._id} className="border rounded-lg shadow-sm">
              <CardContent className="p-4">
                <p className="font-semibold text-gray-900">
                  Name: <span className="font-normal">{plan.name || "N/A"}</span>
                </p>
                <p>
                  Category: <span className="font-normal">{plan.category || "N/A"}</span>
                </p>
                <p>
                  Duration Type: <span className="font-normal">{plan.durationType || "N/A"}</span>
                </p>
                <p>
                  Value:{" "}
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {plan.durationValue || "N/A"}
                  </span>
                </p>
                <p>
                  Price:{" "}
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    ₹{plan.price || "0"}
                  </span>
                </p>
                <div className="flex gap-3 mt-3 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(plan)}
                    className="cursor-pointer"
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(plan._id, plan.name)}
                    className="cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No records found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row sm:justify-between items-center mt-4 gap-4 text-sm text-muted-foreground">
          <div>Total Records: {plans.length}</div>
          <Pagination className="flex justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(page - 1)}
                  className={page === 1 || plans.length === 0 ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink isActive>{page}</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(page + 1)}
                  className={page === totalPages || plans.length === 0 ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlanList;
