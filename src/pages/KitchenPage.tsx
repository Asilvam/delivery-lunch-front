import { PageLayout } from "../components/layout/PageLayout";
import StaffNavigation from "../components/admin/StaffNavigation";
import { Typography } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { useKitchenOrdersStream } from "../hooks/useKitchenOrdersStream";
import { updateOrderStatus } from "../data/services/kitchenApi.service";
import KitchenOrdersPanel from "../components/kitchen/KitchenOrdersPanel";
import type { OrderStatus } from "../types/order";

export default function KitchenPage() {
  const { token, role } = useAuth();
  const { orders, updateOrder, connected, error } =
    useKitchenOrdersStream(token);

  const handleStatusChange = async (id: string, estado: OrderStatus) => {
    if (!token) return;
    const updated = await updateOrderStatus(token, id, estado);
    updateOrder(updated);
  };

  return (
    <PageLayout header={<StaffNavigation />}>
      <Typography variant="h5" fontWeight={800} mb={1}>
        Comandas
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Pedidos aprobados listos para preparar.
      </Typography>

      <KitchenOrdersPanel
        orders={orders}
        connected={connected}
        error={error}
        onStatusChange={handleStatusChange}
        isAdmin={role === "admin"}
      />
    </PageLayout>
  );
}
