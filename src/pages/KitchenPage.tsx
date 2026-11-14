import { PageLayout } from "../components/layout/PageLayout";
import StaffNavigation from "../components/admin/StaffNavigation";
import { Box, Button, Typography } from "@mui/material";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import { useAuth } from "../hooks/useAuth";
import { useKitchenOrdersStream } from "../hooks/useKitchenOrdersStream";
import { updateOrderStatus } from "../data/services/kitchenApi.service";
import KitchenOrdersPanel from "../components/kitchen/KitchenOrdersPanel";
import type { OrderStatus } from "../types/order";
import { useKitchenBell } from "../hooks/useKitchenBell";
import { staffAlert } from "../utils/notifications";

export default function KitchenPage() {
  const { token, role } = useAuth();
  const bell = useKitchenBell();
  const { orders, updateOrder, connected, error } = useKitchenOrdersStream(
    token,
    bell.ring,
  );

  const toggleBell = async () => {
    try {
      await bell.toggle();
    } catch (error) {
      void staffAlert.fire({
        icon: "error",
        title:
          error instanceof Error
            ? error.message
            : "No pudimos activar el timbre. Intenta nuevamente.",
      });
    }
  };

  const handleStatusChange = async (id: string, estado: OrderStatus) => {
    if (!token) return;
    const updated = await updateOrderStatus(token, id, estado);
    updateOrder(updated);
  };

  return (
    <PageLayout
      header={<StaffNavigation />}
      mobileNavigation={role === "admin"}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            component="h1"
            variant="h4"
            fontWeight={800}
            mb={1}
            sx={{ fontSize: { xs: "1.65rem", sm: "2.125rem" } }}
          >
            Comandas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pedidos aprobados listos para preparar.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={
            bell.enabled ? (
              <NotificationsActiveOutlinedIcon />
            ) : (
              <NotificationsOffOutlinedIcon />
            )
          }
          aria-pressed={bell.enabled}
          disabled={bell.activating}
          onClick={() => void toggleBell()}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {bell.activating
            ? "Activando sonido…"
            : bell.enabled
              ? "Silenciar timbre"
              : "Activar sonido"}
        </Button>
      </Box>

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
