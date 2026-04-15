import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const PrivateRoute = ({ allowedRoles }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  const role = user?.role?.role || user?.role || user?.user?.role?.role || "UNKNOWN";
  console.log("PrivateRoute - User role:", role, "Allowed roles:", allowedRoles); // Debug log
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;