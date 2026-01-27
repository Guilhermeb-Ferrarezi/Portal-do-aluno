import { Navigate, Outlet } from "react-router-dom";
import { hasRole, isLoggedIn } from "./auth";
import type { Role } from "./auth";

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
