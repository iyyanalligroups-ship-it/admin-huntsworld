// TopListingPlanTable.jsx
import axios from "axios";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, AlertCircle } from "lucide-react";
import showToast from "@/toast/showToast";

const API = `${import.meta.env.VITE_API_URL}/top-listing-plan`;

export default function TopListingPlanTable({ data, onEdit, onRefresh, isLoading }) {
  const [planToDelete, setPlanToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API}/delete/${planToDelete._id}`);
      showToast("Plan permanently deleted", "success");
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete plan", "error");
    } finally {
      setIsDeleting(false);
      setPlanToDelete(null);
    }
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card text-center py-12 text-muted-foreground">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/70 mb-3" />
        <p className="text-lg font-medium">No active listing plans found</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table – hidden below md breakpoint */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/70">
            <TableRow>
              <TableHead className="w-[200px] font-semibold text-gray-700">Plan Details</TableHead>
              <TableHead className="font-semibold text-gray-700">Plan Code</TableHead>
              <TableHead className="font-semibold text-gray-700">Amount</TableHead>
              <TableHead className="font-semibold text-gray-700">Duration</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((row) => (
              <TableRow key={row._id} className="hover:bg-gray-50/60 transition-colors">
                <TableCell className="font-medium text-gray-900">{row.plan_name}</TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600">
                    {row.plan_code}
                  </code>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(row.amount)}</TableCell>
                <TableCell className="text-gray-600">{row.duration_days} Days</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${
                      row.is_active
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {row.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => onEdit(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setPlanToDelete(row)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards – visible below md breakpoint */}
      <div className="md:hidden space-y-4">
        {data.map((row) => (
          <Card key={row._id} className="overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 pb-3 space-y-4">
                {/* Top row: Name + Status */}
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold text-base leading-tight">{row.plan_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-600">
                        {row.plan_code}
                      </code>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${
                      row.is_active
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    } whitespace-nowrap`}
                  >
                    {row.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Price & Duration */}
                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Amount</p>
                    <p className="font-semibold text-lg mt-0.5">{formatCurrency(row.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Duration</p>
                    <p className="font-medium mt-0.5">{row.duration_days} Days</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => onEdit(row)}
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setPlanToDelete(row)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!planToDelete} onOpenChange={() => !isDeleting && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Permanently Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the plan
              <strong> ({planToDelete?.plan_name})</strong> from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-red-600 cursor-pointer hover:bg-red-700 focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="md:hidden">
          <Skeleton className="h-44 w-full rounded-lg" />
        </div>
      ))}
      {[1, 2].map((i) => (
        <div key={i} className="hidden md:block">
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}
