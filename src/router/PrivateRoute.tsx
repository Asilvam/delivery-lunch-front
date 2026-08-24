// src/router/PrivateRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "../context/auth-context";
import { useAuth } from "../hooks/useAuth";

interface PrivateRouteProps {
  allowedRoles?: UserRole[];
}

export default function PrivateRoute({ allowedRoles }: PrivateRouteProps) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

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
