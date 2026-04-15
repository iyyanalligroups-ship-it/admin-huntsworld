import React, { useContext, useState } from "react";
import menuItems from "@/modules/subAdmin/utils/Menuitem";
import { useRequestAccessMutation, useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import showToast from "@/toast/showToast";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Send, RotateCcw, Undo2, Redo2, CheckSquare, AlertCircle } from "lucide-react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Helper: Flatten all routes from menu
const flattenRoutes = (items) => {
  let routes = [];
  items.forEach((item) => {
    if (item.link) routes.push(item.link);
    if (item.children) routes = [...routes, ...flattenRoutes(item.children)];
  });
  return [...new Set(routes)];
};

// Helper: Format path → "Users → Edit Profile"
const formatPageName = (path) => {
  const name = path.replace("/sub-admin-dashboard/", "");
  return name
    .split("/")
    .map((word) => word.replace(/-/g, " "))
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" → ");
};

const AccessRequestForm = () => {
  const { user } = useContext(AuthContext);
  const { isSidebarOpen } = useSidebar();
  const userId = user?.user?._id;

  const { data: currentUser, isError: isUserError, error: userError, isLoading } = useGetUserByIdQuery(userId, { skip: !userId });
  const [permissions, setPermissions] = useState({});
  const [history, setHistory] = useState([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  const [requestAccess, { isLoading: isSubmitting }] = useRequestAccessMutation();
  const [pendingRequestError, setPendingRequestError] = useState(false); // NEW: Track pending error

  const allPages = flattenRoutes(menuItems);

  // Approved permissions (with full path)
  const approvedPermissions =
    currentUser?.approved_permissions?.reduce((acc, perm) => {
      const adjustedPage = perm.page.replace("/sub-admin-dashboard/", "");
      acc[`/sub-admin-dashboard/${adjustedPage}`] = perm.actions;
      return acc;
    }, {}) || {};

  if (isLoading) return <p className="text-center text-gray-600">Loading permissions...</p>;
  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    showToast("Failed to load user permissions", "error");
    return null;
  }

  const updatePermissions = (newPermissions) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPermissions);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setPermissions(newPermissions);
  };

  const handleCheckboxChange = (page, action) => {
    if (approvedPermissions[page]?.includes(action)) return;

    const prev = { ...permissions };
    const pagePerms = prev[page] || { page, actions: [] };
    const newActions = pagePerms.actions.includes(action)
      ? pagePerms.actions.filter((a) => a !== action)
      : [...pagePerms.actions, action];

    const newPermissions = {
      ...prev,
      [page]: { page, actions: newActions },
    };
    updatePermissions(newPermissions);
  };

  const handleReset = () => updatePermissions({});
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setPermissions(history[prevIndex]);
    }
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setPermissions(history[nextIndex]);
    }
  };

  const handleSelectAll = () => {
    let newPermissions = { ...permissions };

    if (!selectAll) {
      allPages.forEach((page) => {
        const approved = approvedPermissions[page] || [];
        const actionsToAdd = ["edit", "delete"].filter((action) => !approved.includes(action));
        if (actionsToAdd.length > 0) {
          newPermissions[page] = { page, actions: actionsToAdd };
        }
      });
      showToast("All non-approved actions selected", "info");
    } else {
      newPermissions = {};
      showToast("All selections cleared", "info");
    }

    setSelectAll(!selectAll);
    updatePermissions(newPermissions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const permissionList = Object.values(permissions)
      .filter((p) => p.actions.length > 0)
      .map((p) => ({
        page: p.page.replace("/sub-admin-dashboard/", ""),
        actions: p.actions.filter((action) => !approvedPermissions[p.page]?.includes(action)),
      }))
      .filter((p) => p.actions.length > 0);

    if (permissionList.length === 0) {
      showToast("Select at least one non-approved action for a page", "error");
      return;
    }

    try {
      setPendingRequestError(false); // Reset error
      await requestAccess({
        requester_id: userId,
        permissions: permissionList,
      }).unwrap();

      showToast("Access request sent successfully", "success");
      setPermissions({});
      setHistory([{}]);
      setHistoryIndex(0);
      setSelectAll(false);
    } catch (error) {
      console.error("Request failed:", error);

      if (error?.data?.message === "A pending access request already exists.") {
        setPendingRequestError(true);
        showToast("You already have a pending access request.", "error");
      } else {
        showToast("Failed to send access request", "error");
      }
    }
  };

  return (
    <div >
      {/* PENDING REQUEST ALERT */}
      {pendingRequestError && (
        <Alert variant="destructive" className="mb-6 max-w-4xl mx-auto">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Pending Access Request</AlertTitle>
          <AlertDescription>
            You already have a pending access request. Please wait for admin approval before submitting a new one.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Request Access to Pages</h2>

        {allPages.length === 0 && (
          <p className="text-gray-600 text-center">No pages available to request access for.</p>
        )}

        {/* Select All Button */}
        <div className="flex justify-end mb-6">
          <Button
            type="button"
            variant={selectAll ? "destructive" : "outline"}
            onClick={handleSelectAll}
            disabled={pendingRequestError}
            className="flex items-center gap-2"
          >
            <CheckSquare size={16} />
            {selectAll ? "Unselect All" : "Select All"}
          </Button>
        </div>

        {/* Page Permission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {allPages.map((page) => (
            <div
              key={page}
              className={`border rounded-lg p-4 bg-white shadow-sm transition-all ${
                pendingRequestError ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-800 text-sm">{formatPageName(page)}</p>
                {approvedPermissions[page]?.length > 0 && (
                  <Badge className="bg-green-500 text-white text-xs">
                    Approved: {approvedPermissions[page].join(", ")}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      approvedPermissions[page]?.includes("edit") ||
                      permissions[page]?.actions.includes("edit") ||
                      false
                    }
                    onCheckedChange={() => handleCheckboxChange(page, "edit")}
                    disabled={approvedPermissions[page]?.includes("edit") || pendingRequestError}
                    className={
                      approvedPermissions[page]?.includes("edit")
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  />
                  <span className="text-sm">Edit</span>
                </label>

                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      approvedPermissions[page]?.includes("delete") ||
                      permissions[page]?.actions.includes("delete") ||
                      false
                    }
                    onCheckedChange={() => handleCheckboxChange(page, "delete")}
                    disabled={approvedPermissions[page]?.includes("delete") || pendingRequestError}
                    className={
                      approvedPermissions[page]?.includes("delete")
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  />
                  <span className="text-sm">Delete</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            disabled={isSubmitting || pendingRequestError}
          >
            <Send size={16} />
            {isSubmitting ? "Sending..." : "Submit Request"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={pendingRequestError}
            className="flex items-center gap-2"
          >
            <RotateCcw size={16} /> Reset
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleUndo}
            disabled={historyIndex === 0 || pendingRequestError}
            className="flex items-center gap-2"
          >
            <Undo2 size={16} /> Undo
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1 || pendingRequestError}
            className="flex items-center gap-2"
          >
            <Redo2 size={16} /> Redo
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AccessRequestForm;