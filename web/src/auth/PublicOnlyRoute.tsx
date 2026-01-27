import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "./auth";

export default function PublicOnlyRoute() {
  if (isLoggedIn()) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
