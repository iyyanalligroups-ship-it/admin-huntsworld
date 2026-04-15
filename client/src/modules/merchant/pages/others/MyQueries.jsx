import React, { useState, useContext } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetComplaintsQuery } from "@/redux/api/ComplaintApi";
import ComplaintForm from "./ComplaintForm";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, AlertTriangle, Loader2 } from "lucide-react";

const MyQueries = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const { user } = useContext(AuthContext);

  const options = [
    { label: "Issue with BuyLead/Inquiry", value: "buylead_issue" },
    { label: "Account Activation and Deactivation", value: "account_status" },
    { label: "Account Related", value: "account_related" },
    { label: "IPR Dispute", value: "ipr_dispute" },
    { label: "Complaint of Buyer", value: "buyer_complaint" },
    { label: "Complaint of Supplier", value: "supplier_complaint" },
    { label: "Others", value: "others" },
  ];

  const optionToLabel = Object.fromEntries(
    options.map((opt) => [opt.value, opt.label])
  );

  const { data: complaints, isLoading, error } = useGetComplaintsQuery(
    {
      userId: user?.user?._id,
      value: selectedOption || "",
    },
    { skip: !user?.user?._id }
  );

  const handleSelectChange = (value) => setSelectedOption(value);
  const handleAddComplaint = () => setShowComplaintForm(true);
  const handleCancel = () => setShowComplaintForm(false);

  if (!user || !user.user) {
    return (
      <Card className="max-w-3xl mx-auto mt-10 border border-gray-200 shadow-sm">
        <CardContent className="p-6 text-center text-gray-600">
          Please log in to view complaints.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="w-full sm:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter Complaints
          </label>
          <Select onValueChange={handleSelectChange} value={selectedOption}>
            <SelectTrigger className="w-full border-gray-300">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleAddComplaint}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <PlusCircle className="w-4 h-4" />
          Add Complaint
        </Button>
      </div>

      {/* Complaint Form */}
      {showComplaintForm && (
        <div className="mb-6">
          <ComplaintForm onCancel={handleCancel} />
        </div>
      )}

      {/* Complaints Table */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            My Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading complaints...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>
                {error.status === "FETCH_ERROR"
                  ? "Unable to connect to the server."
                  : error.data?.message || "Failed to fetch complaints"}
              </span>
            </div>
          )}

          {!isLoading && !error && complaints?.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint._id}>
                      <TableCell className="font-mono text-sm">
                        {complaint._id}
                      </TableCell>
                      <TableCell>
                        {complaint.details?.title ||
                          optionToLabel[complaint.option] ||
                          "Untitled"}
                      </TableCell>
                      <TableCell>{complaint.type}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            complaint.details?.status === "Resolved"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {complaint.details?.status || "Pending"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && !error && complaints?.length === 0 && (
            <p className="text-center text-gray-500 py-6">
              No complaints found for the selected filter.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyQueries;