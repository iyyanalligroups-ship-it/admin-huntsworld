// src/modules/subAdmin/SubAdminLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";

/* Same providers as Admin */
import { SidebarProvider } from "@/modules/admin/context/SidebarContext";
import { SelectedUserProvider } from "@/modules/admin/context/SelectedUserContext";
import { SocketProvider } from "@/modules/admin/context/SocketContext";
import { UnreadCountProvider } from "@/modules/admin/context/UnreadCountContext";
import { NotificationProvider } from "@/modules/admin/context/NotificationContext";
import { MerchantProvider } from "@/modules/admin/context/MerchantContext";
import { ActiveUserProvider } from "@/modules/admin/context/ActiveUserProvider";

const SubAdminLayout = () => {
  return (
    <SidebarProvider>
      <SelectedUserProvider>
        <SocketProvider>
          <UnreadCountProvider>
            <NotificationProvider>
              <MerchantProvider>
                <ActiveUserProvider>
                  <div className="admin-layout subadmin-panel">
                    <Header />
                    <div className="content flex">
                      <Sidebar />
                      <main className="flex-1 p-4 pt-[10px]">
                        <Outlet />
                      </main>
                    </div>
                  </div>
                </ActiveUserProvider>
              </MerchantProvider>
            </NotificationProvider>
          </UnreadCountProvider>
        </SocketProvider>
      </SelectedUserProvider>
    </SidebarProvider>
  );
};

export default SubAdminLayout;
