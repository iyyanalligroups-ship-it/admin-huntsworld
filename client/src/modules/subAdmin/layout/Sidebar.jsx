import React, { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import * as Icons from "phosphor-react";
import menuItems from "../utils/Menuitem";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import easyCol from "@/assets/images/logo.png";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAdminContactSocket } from "@/modules/admin/context/useAdminContactSocket";
import { useAdminNotificationSocket } from "@/modules/admin/context/useAdminNotificationSocket";

const Sidebar = () => {
  const { logout } = useContext(AuthContext);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [openMenus, setOpenMenus] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const navigate = useNavigate();

  // Get unread counts from socket hooks
  const { contactUnreadCount, othersUnreadCount } = useAdminContactSocket();
  const { unreadCounts } = useAdminNotificationSocket();

  // Calculate total unread for the "Users" parent menu
  const usersTotalUnread = (unreadCounts.users || 0) +
    (unreadCounts.merchants || 0) +
    (unreadCounts.students || 0) +
    (unreadCounts.grocery || 0);

  // Calculate total unread for "Products" parent menu
  const productsTotalUnread = (unreadCounts.notVerifiedProducts || 0) +
    (unreadCounts.otherProducts || 0);

  // Calculate total unread for "Requests" parent menu
  const requestsTotalUnread = (unreadCounts.redeemRequests || 0) +
    (unreadCounts.trustSeal || 0) +
    (unreadCounts.bannerVerify || 0) +
    (unreadCounts.referralRequests || 0);

  // Detect screen resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset submenus when sidebar collapses
  useEffect(() => {
    if (!isSidebarOpen) setOpenMenus({});
  }, [isSidebarOpen]);

  const handleToggleMenu = (title) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleParentClick = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    if (!isSidebarOpen && !isMobile) {
      toggleSidebar();
      return;
    }
    if (hasChildren) handleToggleMenu(item.title);
  };

  const handleNavLinkClick = () => {
    if (!isSidebarOpen && !isMobile) {
      toggleSidebar();
      return;
    }
    if (isMobile && isSidebarOpen) toggleSidebar();
  };

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  const getUnreadBadge = (item) => {
    if (!item) return null;
    const title = item.title;
    const link = item.link;

    let count = 0;
    let isGlobal = false;

    if (title === "Users") {
      count = usersTotalUnread;
      isGlobal = true;
    } else if (title === "Products") {
      count = productsTotalUnread;
      isGlobal = true;
    } else if (title === "Requests") {
      count = requestsTotalUnread;
      isGlobal = true;
    } else if (title === "Merchant" || title === "Merchant List") {
      count = unreadCounts.merchants;
    } else if (title === "Base Members" || title === "Base Members List") {
      count = unreadCounts.grocery;
    } else if (title === "Students" || title === "Students List") {
      count = unreadCounts.students;
    } else if (title === "Common Users" || title === "Users List") {
      count = unreadCounts.users;
    } else if (title === "Contact") { // Fixed casing for Sub-Admin which uses "Contact"
      count = contactUnreadCount;
    } else if (title === "Others" && link === "/sub-admin-dashboard/other-products") {
      count = unreadCounts.otherProducts;
    } else if (title === "Others") {
      count = othersUnreadCount;
      isGlobal = true;
    } else if (title === "Not verified") {
      count = unreadCounts.notVerifiedProducts;
    } else if (title === "Redeem Wallet") {
      count = unreadCounts.redeemRequests;
    } else if (title === "Trust Seal") {
      count = unreadCounts.trustSeal;
    } else if (title === "Banner Verify") {
      count = unreadCounts.bannerVerify;
    } else if (title === "Referral Requests") {
      count = unreadCounts.referralRequests;
    }

    if (count > 0) {
      return (
        <span
          className={`absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md z-10 ${isGlobal ? "animate-pulse" : ""
            }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      );
    }
    return null;
  };

  const renderMenuItems = (items, level = 0) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const IconComponent = Icons[item.icon] || Icons.List;
      const badge = getUnreadBadge(item);

      return (
        <li key={`${item.title}-${level}`} className={`py-1 ${level > 0 ? "pl-2" : ""}`}>
          {item.link ? (
            <NavLink to={item.link} onClick={handleNavLinkClick} end className="block">
              {({ isActive }) => (
                <div
                  className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 relative ${isActive ? "bg-gray-100 text-black shadow-inner" : "text-white hover:bg-[#5a5a5a]"
                    }`}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <IconComponent
                            size={18}
                            weight="duotone"
                            className={`${isActive ? "text-black" : "text-white"}`}
                          />
                        </div>
                      </TooltipTrigger>
                      {!isSidebarOpen && !isMobile && (
                        <TooltipContent side="right" className="z-[1000]">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  <span className={`ml-3 ${!isSidebarOpen && !isMobile ? "hidden" : ""}`}>
                    {item.title}
                  </span>
                  {badge}
                </div>
              )}
            </NavLink>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleParentClick(item)}
              className="flex items-center w-full p-3 cursor-pointer rounded-lg transition-all duration-200 text-white hover:bg-[#5a5a5a] relative group"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <IconComponent size={18} weight="duotone" className="text-white" />
                    </div>
                  </TooltipTrigger>
                  {!isSidebarOpen && !isMobile && (
                    <TooltipContent side="right" className="z-[1000]">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <span className={`ml-3 ${!isSidebarOpen && !isMobile ? "hidden" : ""}`}>
                {item.title}
              </span>
              {badge}
              {hasChildren && isSidebarOpen && (
                <Icons.CaretDown
                  size={14}
                  weight="bold"
                  className={`ml-auto transform transition-transform duration-200 ${openMenus[item.title] ? "rotate-180" : "rotate-0"
                    }`}
                />
              )}
            </div>
          )}

          {hasChildren && openMenus[item.title] && isSidebarOpen && (
            <ul className="ml-4 mt-1 border-l border-white/10">{renderMenuItems(item.children, level + 1)}</ul>
          )}
        </li>
      );
    });
  };

  return (
    <TooltipProvider>
      <>
        {/* Mobile overlay */}
        {isMobile && isSidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30" onClick={toggleSidebar}></div>
        )}

        {/* Sidebar container */}
        <div
          className={`fixed top-0 h-full z-40 bg-[#0c1f4d] text-white shadow-2xl transition-all duration-300 flex flex-col
          ${isMobile
              ? isSidebarOpen
                ? "left-0 w-56"
                : "-left-64 w-56"
              : isSidebarOpen
                ? "left-0 w-56"
                : "left-0 w-16"
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-black/10">
            <img
              src={easyCol}
              alt="Logo"
              onClick={() => {
                navigate("/subAdmin");
                if (isMobile) toggleSidebar();
              }}
              className={`cursor-pointer ml-1 ${!isSidebarOpen && !isMobile ? "hidden" : "w-32"}`}
            />

            {/* Toggle inside header (Desktop always, Mobile when open) */}
            {(!isMobile || isSidebarOpen) && (
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-md hover:bg-[#5a5a5a] cursor-pointer transition"
              >
                {isSidebarOpen ? (
                  <Icons.ArrowCircleLeft size={18} className="text-white" weight="duotone" />
                ) : (
                  <Icons.List size={18} className="text-white" weight="duotone" />
                )}
              </button>
            )}
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="mt-4 space-y-2 px-2 py-2 flex-grow text-[14px] font-bold">
              {renderMenuItems(menuItems)}
            </ul>
          </nav>

          {/* Logout */}
          <div className="flex-shrink-0 p-4 border-t border-black/20">
            <button
              onClick={handleLogout}
              className="flex items-center w-full cursor-pointer p-3 rounded-lg hover:bg-[#5a5a5a] transition-all duration-200 text-white"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Icons.SignOut size={18} weight="duotone" className="text-white" />
                  </div>
                </TooltipTrigger>
                {!isSidebarOpen && !isMobile && (
                  <TooltipContent side="right" className="z-[1000]">
                    Logout
                  </TooltipContent>
                )}
              </Tooltip>
              <span className={`ml-3 ${!isSidebarOpen && !isMobile ? "hidden" : ""}`}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </>
    </TooltipProvider>
  );
};

export default Sidebar;