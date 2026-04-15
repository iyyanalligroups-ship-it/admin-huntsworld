import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import PrivateRoute from "@/guard/PrivateRoute";
import PublicRoute from "@/guard/PublicRoute";

/* -------------------------------------------------------------------------- */
/* ✅ 1. EAGER LOAD (INSTANT)                       */
/* -------------------------------------------------------------------------- */
/* We import these DIRECTLY so they load immediately with the app.
   User sees the Login screen in milliseconds. No "Loading..." spinner here.
*/
import AdminLogin from "./modules/admin/pages/login/AdminLogin";
import ForgotPasswordPage from "./modules/admin/pages/forgotPassword/ForgotPasswordPage";

/* -------------------------------------------------------------------------- */
/* ⚠️ 2. LAZY LOAD (ON DEMAND)                      */
/* -------------------------------------------------------------------------- */
/* These are heavy. We only download this code AFTER the user logs in.
*/
const AdminRoutes = lazy(() => import("./modules/admin/AdminRoutes"));
const SubAdminRoute = lazy(() => import("./modules/subAdmin/SubAdminRoute"));
const ChatPage = lazy(() => import("./modules/admin/pages/chat/pages/ChatPage"));
const Unauthorized = lazy(() => import("./staticPages/Unauthorized"));
const AdminLayout = lazy(() => import("./modules/admin/AdminLayout"));

/* -------------------------------------------------------------------------- */
/* LOADERS                                    */
/* -------------------------------------------------------------------------- */
const DashboardLoader = () => (
  <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm animate-pulse">
    Loading Dashboard...
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. REDIRECT DEFAULT
          If user goes to "/", immediately send to Login.
      */}
      <Route path="/" element={<Navigate to="/admin-login" replace />} />

      {/* 2. PUBLIC ROUTES (Login / Forgot Pass)
          ❌ No <Suspense> here.
          ✅ Renders Instantly because we used static imports above.
      */}
      <Route element={<PublicRoute />}>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* 3. ADMIN DASHBOARD
          ✅ Wrapped in <Suspense> because AdminRoutes is lazy.
          The loader only appears when switching from Login -> Dashboard.
      */}
      <Route element={<PrivateRoute allowedRoles={["ADMIN"]} />}>
        <Route
          element={
            <Suspense fallback={<DashboardLoader />}>
              <AdminLayout />
            </Suspense>
          }
        >
          {/* Nested Admin Routes */}
          <Route
            path="/admin-dashboard/*"
            element={
              <Suspense fallback={<DashboardLoader />}>
                <AdminRoutes />
              </Suspense>
            }
          />
          <Route
            path="/chat"
            element={
              <Suspense fallback={<DashboardLoader />}>
                <ChatPage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      {/* 4. SUB-ADMIN DASHBOARD
      */}
      <Route element={<PrivateRoute allowedRoles={["SUB_ADMIN"]} />}>
        <Route
          path="/sub-admin-dashboard/*"
          element={
            <Suspense fallback={<DashboardLoader />}>
              <SubAdminRoute />
            </Suspense>
          }
        />
      </Route>

      {/* 5. UTILITY PAGES
      */}
      <Route
        path="/unauthorized"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <Unauthorized />
          </Suspense>
        }
      />

      {/* 6. FALLBACK
          Catch-all redirects back to login
      */}
      <Route path="*" element={<Navigate to="/admin-login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
