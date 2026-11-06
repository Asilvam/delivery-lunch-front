// src/router/PrivateRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../context/auth-context";

interface PrivateRouteProps {
  allowedRoles?: UserRole[];
}

export default function PrivateRoute({ allowedRoles }: PrivateRouteProps) {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role as UserRole)
  ) {
    // Authenticated but wrong role — redirect to their home
    return <Navigate to={role === "kitchen" ? "/cocina" : "/login"} replace />;
  }

  return <Outlet />;
}
