// src/modules/admin/components/layout/Header.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { Menu, MessageSquare, HelpCircle, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AdminBreadcrumb from "../utils/AdminBreadcrumb";
import SearchCommand from "../utils/SearchCommand";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSidebar } from "../hooks/useSidebar";
import GlobalNotificationBell from "../pages/globalNotifications/GlobalNotificationBell";
import Badge from "../pages/chat/components/helper/Badge";
import { useUnreadCount } from "../context/UnreadCountContext";
import { Button } from "@/components/ui/button";
import axios from "axios";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const userPhoto = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg";

const Header = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { user } = useContext(AuthContext);
  const { totalUnread } = useUnreadCount();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);

  // Separate live counts
  const [pendingHelpCount, setPendingHelpCount] = useState(0);
  const [pendingReportCount, setPendingReportCount] = useState(0);

  const adminId = user?.user?._id;

  // Fetch Pending Help Requests Count
  const fetchPendingHelpCount = useCallback(async () => {
    if (!adminId) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/help/all`, {
        params: { status: "pending", limit: 1 },
      });

      const count =
        res.data.totalPending ||
        res.data.helpRequests?.filter((item) => item.status === "pending").length ||
        0;
      setPendingHelpCount(count);
    } catch (err) {
      console.error("Failed to fetch pending help count:", err);
    }
  }, [adminId]);

  // Fetch Pending Reports Count
  const fetchPendingReportCount = useCallback(async () => {
    if (!adminId) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/report-file/all`, {
        params: { status: "pending", limit: 1 },
      });

      const count =
        res.data.totalPending ||
        res.data.pagination?.total ||
        res.data.reports?.filter((item) => item.status === "pending").length ||
        0;
      setPendingReportCount(count);
    } catch (err) {
      console.error("Failed to fetch pending report count:", err);
    }
  }, [adminId]);

  // Initial load + polling every 30 seconds
  useEffect(() => {
    fetchPendingHelpCount();
    fetchPendingReportCount();

    const interval = setInterval(() => {
      fetchPendingHelpCount();
      fetchPendingReportCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchPendingHelpCount, fetchPendingReportCount]);

  // Scroll shadow effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigateHelp = () => {
    navigate("/admin-dashboard/help");
  };

  const handleNavigateReport = () => {
    navigate("/admin-dashboard/report");
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b-2 border-solid px-4 py-3 bg-white transition-shadow duration-300
        ${scrolled ? "shadow-md border-b border-gray-200" : ""}
        ${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"}`}
    >
      {/* ==================== MOBILE VIEW ==================== */}
      <div className="flex sm:hidden items-center justify-between gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md border border-gray-300"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-grow flex justify-center">
          <SearchCommand /> sdfkdjfhdj
        </div>

        <div className="flex items-center gap-2">
          <GlobalNotificationBell userId={user?.user?._id} isAdmin={true} />
          <Link to="/chat" className="relative inline-block">
            <MessageSquare className="w-5 h-5" />
            <Badge count={totalUnread} />
          </Link>
          <img
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
            src={user?.user?.profile_pic || userPhoto}
            alt="User"
          />
        </div>
      </div>

      {/* ==================== DESKTOP VIEW ==================== */}
      <div className="hidden sm:flex items-center justify-between w-full gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md border border-gray-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          <AdminBreadcrumb />
        </div>


        <div className="flex-grow cursor-pointer min-w-0 mx-2 md:max-w-xl">
          <div className="w-full cursor-pointer">
            <SearchCommand />
          </div>
        </div>
        {/* Right-side actions with tooltips */}
        <TooltipProvider>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Pending Help Requests */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNavigateHelp}
                  >
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                  {pendingHelpCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {pendingHelpCount > 99 ? "99+" : pendingHelpCount}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black text-white border-none">
                <p>
                  Pending Help Requests{" "}
                  {pendingHelpCount > 0 && <span className="font-bold">({pendingHelpCount})</span>}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Pending Reports */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNavigateReport}
                  >
                    <FileText className="w-5 h-5" />
                  </Button>
                  {pendingReportCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {pendingReportCount > 99 ? "99+" : pendingReportCount}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black text-white border-none">
                <p>
                  Pending Reports{" "}
                  {pendingReportCount > 0 && <span className="font-bold">({pendingReportCount})</span>}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Notification Bell */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <GlobalNotificationBell userId={user?.user?._id} isAdmin={true} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black text-white border-none">
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>

            {/* Chat Messages */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/admin-dashboard/chat" className="relative inline-block">
                  <MessageSquare className="p-1 w-7 h-7 rounded-full hover:bg-gray-100 transition" />
                  {totalUnread > 0 && <Badge count={totalUnread} />}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black text-white border-none">
                <p>
                  Messages{" "}
                  {totalUnread > 0 && <span className="font-bold">({totalUnread} unread)</span>}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* User Profile */}
            <div className="flex items-center gap-2">
              <img
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                src={user?.user?.profile_pic || userPhoto}
                alt="Admin"
              />
              <Link
                to="/admin-dashboard/settings"
                className="text-sm flex gap-1 items-center font-medium hover:text-blue-600"
              >
                <button className="px-3 py-1 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition">
                  {user?.user?.name || "Admin"}
                </button>
              </Link>
            </div>
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
};

export default Header;
