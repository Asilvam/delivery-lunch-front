// src/pages/AdminPage.tsx
import { AppBar, Button, Container, Toolbar, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdminOrdersStream } from "../hooks/useAdminOrdersStream";
import {
  adminValidateOrder,
  cancelOrder,
} from "../data/services/adminApi.service";
import AdminOrdersPanel from "../components/admin/AdminOrdersPanel";

export default function AdminPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const { orders, removeOrder, connected, error } = useAdminOrdersStream(token);

  const handleValidate = async (id: string) => {
    if (!token) return;
    await adminValidateOrder(token, id);
    // El pedido aprobado sale del panel admin (va a cocina)
    removeOrder(id);
  };

  const handleCancel = async (id: string) => {
    if (!token) return;
    await cancelOrder(token, id);
    // El pedido cancelado sale del panel admin
    removeOrder(id);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <AdminPanelSettingsIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6" fontWeight={700} flexGrow={1}>
            Panel Administrador
          </Typography>
          <Button
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            color="inherit"
            size="small"
            sx={{ fontWeight: 600 }}
          >
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h5" fontWeight={800} mb={1}>
          Pedidos pendientes de aprobación
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Aprueba cada pedido para enviarlo a cocina.
        </Typography>

        <AdminOrdersPanel
          orders={orders}
          connected={connected}
          error={error}
          onValidate={handleValidate}
          onCancel={handleCancel}
        />
      </Container>
    </>
  );
}
