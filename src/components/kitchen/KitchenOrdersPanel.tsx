import { Box, Chip, Typography } from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import WifiIcon from "@mui/icons-material/Wifi";
import KitchenOrderCard from "./KitchenOrderCard";
import { OrderStatus, type Order } from "../../types/order";

interface Props {
  orders: Order[];
  connected: boolean;
  error: string | null;
  onStatusChange: (id: string, estado: OrderStatus) => Promise<void>;
  isAdmin: boolean;
}

export default function KitchenOrdersPanel({
  orders,
  connected,
  error,
  onStatusChange,
  isAdmin,
}: Props) {
  const active = orders
    .filter(
      (order) =>
        order.validadoPorAdmin &&
        (order.estado === OrderStatus.PENDIENTE ||
          order.estado === OrderStatus.EN_PREPARACION),
    )
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const preparing = active.filter(
    (order) => order.estado === OrderStatus.EN_PREPARACION,
  ).length;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Typography component="h2" variant="subtitle1" fontWeight={700}>
          En curso ({active.length})
        </Typography>
        {active.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {active.length - preparing} por preparar · {preparing} en
            preparación
          </Typography>
        )}
        <Chip
          icon={connected ? <WifiIcon /> : <WifiOffIcon />}
          label={connected ? "Conectado" : "Reconectando…"}
          color={connected ? "success" : "default"}
          size="small"
          sx={{ ml: { sm: "auto" } }}
        />
        {error && (
          <Typography
            role="status"
            variant="caption"
            color="error"
            sx={{ width: "100%" }}
          >
            {error}
          </Typography>
        )}
      </Box>
      {active.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography color="text.secondary" fontWeight={500}>
            Sin comandas activas
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          {active.map((order) => (
            <KitchenOrderCard
              key={order._id}
              order={order}
              onStatusChange={onStatusChange}
              isAdmin={isAdmin}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
