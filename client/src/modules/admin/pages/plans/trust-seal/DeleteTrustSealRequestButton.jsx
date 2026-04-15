"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import showToast from "@/toast/showToast";
import axios from "axios"; // or your api instance



const DeleteTrustSealRequestButton = ({
  requestId,
  onDeleteSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const token=sessionStorage.getItem("token");

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/trust-seal/delete-request/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }, // if needed
      });

      showToast("Trust seal request has been deleted successfully.", "success");

      onDeleteSuccess?.(); // refresh list / table
      setOpen(false);
    } catch (err) {
      console.error("Delete failed:", err);
      showToast(err.response?.data?.message || "Failed to delete request. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-600 cursor-pointer hover:text-red-700 hover:bg-red-50"
          title="Delete request"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The trust seal request will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // prevent default dialog close
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-600 cursor-pointer hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteTrustSealRequestButton;
