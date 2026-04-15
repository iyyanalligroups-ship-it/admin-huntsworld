import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, RefreshCw, Layers } from "lucide-react"; // Icons
import showToast from "@/toast/showToast";
import TopListingPlanForm from "./TopListingPlanForm";
import TopListingPlanTable from "./TopListingPlanTable";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";

const API = `${import.meta.env.VITE_API_URL}/top-listing-plan`;

const TopListingPlan = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Sidebar hook logic
  const { isSidebarOpen } = useSidebar();

  // SOP: Use useCallback to prevent unnecessary function re-creations
  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/list`);
      // SOP: validation to ensure we are setting an array
      setPlans(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch plans. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleEdit = (row) => {
    setEditData(row);
    setOpen(true);
  };

  const handleAddNew = () => {
    setEditData(null); // Ensure clean state for new entries
    setOpen(true);
  };

  return (
    <div
      className={`min-h-screen bg-gray-50/50 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-56 p-6' : 'lg:ml-16 p-4'
        }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Layers className="h-8 w-8 text-[#0c1f4d]" />
              Listing Plans
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage subscription packages for top-tier property listings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPlans}
              disabled={isLoading}
              className="hidden sm:flex cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleAddNew} className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4d] text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Create New Plan
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2 border-b border-gray-100 bg-white rounded-t-lg">
            <CardTitle className="text-lg font-medium">Active Plans</CardTitle>
            <CardDescription>
              A list of all currently active subscription plans available for users.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {/* Ensure your Table component can handle an 'isLoading' prop
               to show a skeleton loader, or check length here
            */}
            <TopListingPlanTable
              data={plans}
              isLoading={isLoading}
              onEdit={handleEdit}
              onRefresh={fetchPlans}
            />
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      <TopListingPlanForm
        open={open}
        setOpen={setOpen}
        editData={editData}
        setEditData={setEditData}
        onRefresh={fetchPlans}
      />
    </div>
  );
};

export default TopListingPlan;
