import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const AuthRoute = ({ allowedRoles }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  const role = user?.role?.role || user?.user?.role?.role;
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default AuthRoute;
