// src/pages/AdminPage.tsx
import { Container, Typography } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { useAdminOrdersStream } from "../hooks/useAdminOrdersStream";
import {
  adminValidateOrder,
  cancelOrder,
} from "../data/services/adminApi.service";
import AdminOrdersPanel from "../components/admin/AdminOrdersPanel";
import AdminNavigation from "../components/admin/AdminNavigation";

export default function AdminPage() {
  const { token } = useAuth();
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

  return (
    <>
      <AdminNavigation />

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
