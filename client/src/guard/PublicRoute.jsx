import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const PublicRoute = () => {
  const { user } = useContext(AuthContext);

  if (user) {
    const role = user?.role?.role || user?.role || user?.user?.role?.role || "UNKNOWN";
    console.log("PublicRoute - User role:", role); // Debug log
    if (role === "ADMIN") return <Navigate to="/admin-dashboard" replace />;
    if (role === "SUB_ADMIN") return <Navigate to="/sub-admin-dashboard" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;