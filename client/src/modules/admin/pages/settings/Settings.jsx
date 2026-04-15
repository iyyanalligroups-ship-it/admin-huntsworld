import React, { useState, useEffect, useRef } from "react";
import settingsMenuItems from "@/modules/admin/utils/SettingsMenuItem";
import { useSidebar } from "../../hooks/useSidebar";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import showToast from "@/toast/showToast";

const Settings = () => {
  const { isSidebarOpen } = useSidebar();
  const [activePage, setActivePage] = useState(settingsMenuItems[0]?.value);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const activeItem = settingsMenuItems.find((item) => item.value === activePage);

  // Custom click-outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsMobileSidebarOpen(false);
        showToast("Sidebar closed", "info");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileSidebarOpen]);

  const handleMenuItemClick = (value) => {
    setActivePage(value);
    setIsMobileSidebarOpen(false);
    // showToast(`Navigated to ${settingsMenuItems.find((item) => item.value === value)?.label}`, "info");
  };

  return (
    <div
      className={cn(
        "min-h-screen  max-w-7xl mx-auto",
        isSidebarOpen ? "lg:ml-56" : "lg:ml-16"
      )}
    >
      <div className="flex flex-col lg:flex-row bg-white rounded-xl shadow-md overflow-hidden min-h-[80vh]">
        {/* Mobile Sidebar Toggle & Title */}
        <div className="sm:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-800">
            {activeItem?.label || "Settings"}
          </h1>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsMobileSidebarOpen(true);
              showToast("Sidebar opened", "info");
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </Button> */}
        </div>

        {/* Mobile Sidebar */}
        {isMobileSidebarOpen && (
          <div className="sm:hidden fixed inset-0 z-50 flex">
            <aside
              ref={sidebarRef}
              className="w-full sm:w-64 bg-white rounded-r-lg shadow-xl p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    showToast("Sidebar closed", "info");
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex flex-col space-y-2">
                {settingsMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.value;

                  return (
                    <button
                      key={item.value}
                      onClick={() => handleMenuItemClick(item.value)}
                      className={cn(
                        "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                        isActive
                          ? "bg-yellow-100 text-yellow-900"
                          : "hover:bg-gray-200 text-gray-800"
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4 mr-2" />}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </aside>
            <div className="flex-1 bg-black/50" />
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden sm:block lg:w-[220px] border-r bg-gray-50 p-4",
            "flex flex-col space-y-2"
          )}
        >
          {settingsMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.value;

            return (
              <button
                key={item.value}
                onClick={() => handleMenuItemClick(item.value)}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                  isActive
                    ? "bg-yellow-100 text-yellow-900"
                    : "hover:bg-gray-200 text-gray-800"
                )}
              >
                {Icon && <Icon className="w-4 h-4 mr-2" />}
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 p-4",
            isMobileSidebarOpen ? "pointer-events-none opacity-50" : ""
          )}
        >
          {activeItem?.component || (
            <div className="text-gray-600 text-sm">Select a settings page</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
