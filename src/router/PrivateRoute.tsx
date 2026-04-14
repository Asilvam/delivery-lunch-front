// src/router/PrivateRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type UserRole } from "../context/AuthContext";

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
