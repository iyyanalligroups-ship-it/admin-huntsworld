// src/components/modals/AddProductModal.jsx

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import MerchantProductForm from "./MerchantProductForm"; // Adjust path if needed

const AddProductModal = ({ open, onClose, editingProduct }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="p-0 bg-white overflow-hidden [&>button]:hidden"
        style={{
          width: "50vw",
          maxWidth: "50vw",
          height: "90vh",
          maxHeight: "90vh",
        }}
      >
        {/* Custom Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 bg-gradient-to-r from-[#0c1f4d] to-[#1e3a8a] text-white border-b border-white/20">
          <DialogTitle className="text-2xl font-bold">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>

          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white cursor-pointer hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        {/* Form inside scrollable area */}
        <div className="overflow-y-auto h-[calc(90vh-90px)] p-6 bg-gray-50">
          <MerchantProductForm
            editingProduct={editingProduct}
            onClose={onClose}  
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
