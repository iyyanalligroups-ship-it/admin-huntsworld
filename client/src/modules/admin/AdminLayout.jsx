// import { Outlet } from "react-router-dom";
// import Sidebar from "./layout/Sidebar";
// import Header from "./layout/Header";

// const AdminLayout = () => {
//   return (
//     <div className="admin-layout">
//       <Header />
//       <div className="content flex">
//         <Sidebar />
//         <main className="flex-1 p-4 pt-[10px]">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default AdminLayout;
// src/modules/admin/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";

/* Admin-only providers */
import { SidebarProvider } from "./context/SidebarContext";
import { SelectedUserProvider } from "./context/SelectedUserContext";
import { SocketProvider } from "./context/SocketContext";
import { UnreadCountProvider } from "./context/UnreadCountContext";
import { NotificationProvider } from "./context/NotificationContext";
import { MerchantProvider } from "./context/MerchantContext";
import { ActiveUserProvider } from "./context/ActiveUserProvider";

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <SelectedUserProvider>
        <SocketProvider>
          <UnreadCountProvider>
            <NotificationProvider>
              <MerchantProvider>
                <ActiveUserProvider>
                  <div className="admin-layout">
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

export default AdminLayout;
