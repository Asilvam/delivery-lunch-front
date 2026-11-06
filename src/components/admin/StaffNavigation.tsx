import { BrandHeader } from "../layout/PageLayout";
import { Box, Button } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function StaffNavigation() {
  const { role, logout } = useAuth();
  const { pathname } = useLocation();
  const links =
    role === "admin"
      ? [
          ["/admin", "Pedidos"],
          ["/admin/menus", "Menús"],
          ["/cocina", "Cocina"],
          ["/dashboard", "Métricas"],
        ]
      : [["/cocina", "Cocina"]];
  return (
    <BrandHeader
      right={
        <Button onClick={logout} color="inherit" size="small">
          Cerrar sesión
        </Button>
      }
      navigation={
        <Box
          component="nav"
          aria-label="Navegación del personal"
          sx={{ display: "flex", gap: 1, overflowX: "auto" }}
        >
          {links.map(([to, label]) => (
            <Button
              key={to}
              component={NavLink}
              to={to}
              variant={pathname === to ? "contained" : "text"}
              sx={{ flexShrink: 0 }}
            >
              {label}
            </Button>
          ))}
        </Box>
      }
    />
  );
}
