import { Outlet } from "react-router-dom";
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";
const MerchantLayout = () => {
  return (
    <div className="admin-layout">
      <Header />
      <div className="content">
        <Sidebar />
        <main>
          <Outlet />
        </main> 
      </div>
    </div>
  );
};

export default MerchantLayout;
