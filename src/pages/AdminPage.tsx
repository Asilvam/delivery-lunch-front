import { PageLayout } from "../components/layout/PageLayout";
import StaffNavigation from "../components/admin/StaffNavigation";
// src/pages/AdminPage.tsx
import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import ManualOrderDialog from "../components/admin/ManualOrderDialog";
import { useAuth } from "../hooks/useAuth";
import { usePendingOrders } from "../hooks/usePendingOrders";
import {
  adminValidateOrder,
  cancelOrder,
} from "../data/services/adminApi.service";
import AdminOrdersPanel from "../components/admin/AdminOrdersPanel";

export default function AdminPage() {
  const { token } = useAuth();
  const { orders, removeOrder, updateOrder, connected, error } =
    usePendingOrders();
  const [creating, setCreating] = useState(false);

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
    <PageLayout header={<StaffNavigation />} mobileNavigation>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
        }}
      >
        <Typography variant="h5" fontWeight={800}>
          Pedidos pendientes de aprobación
        </Typography>
        <Button variant="contained" onClick={() => setCreating(true)}>
          Crear pedido
        </Button>
      </Box>
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
      {creating && (
        <ManualOrderDialog
          onClose={() => setCreating(false)}
          onCreated={updateOrder}
        />
      )}
    </PageLayout>
  );
}
