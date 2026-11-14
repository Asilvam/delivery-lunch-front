import { useId } from "react";
import { useCurrentDay } from "../../hooks/useCurrentDay";
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
  const today = useCurrentDay();
  const sectionId = useId();
  const active = orders
    .filter(
      (order) =>
        order.validadoPorAdmin &&
        (order.estado === OrderStatus.PENDIENTE ||
          order.estado === OrderStatus.EN_PREPARACION),
    )
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const previous = active.filter((order) => order.fecha < today);
  const current = active.filter((order) => !(order.fecha < today));
  const groups = [
    { id: "current", title: `En curso (${current.length})`, orders: current },
    ...(previous.length
      ? [
          {
            id: "previous",
            title: `Pendientes de días anteriores (${previous.length})`,
            orders: previous,
          },
        ]
      : []),
  ];

  return (
    <Box>
      {groups.map((group) => {
        const older = group.id === "previous";
        const preparing = group.orders.filter(
          (order) => order.estado === OrderStatus.EN_PREPARACION,
        ).length;
        return (
          <Box
            component="section"
            key={group.id}
            aria-labelledby={`${sectionId}-${group.id}`}
            sx={{ mt: older ? 4 : 0 }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1.5,
                mb: 3,
              }}
            >
              <Typography
                component="h2"
                id={`${sectionId}-${group.id}`}
                variant="subtitle1"
                fontWeight={700}
                color={older ? "warning.dark" : "text.primary"}
              >
                {group.title}
              </Typography>
              {group.orders.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {group.orders.length - preparing} por preparar · {preparing}{" "}
                  en preparación
                </Typography>
              )}
              {!older && (
                <Chip
                  icon={connected ? <WifiIcon /> : <WifiOffIcon />}
                  label={connected ? "Conectado" : "Reconectando…"}
                  color={connected ? "success" : "default"}
                  size="small"
                  sx={{ ml: { sm: "auto" } }}
                />
              )}
              {!older && error && (
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
            {group.orders.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Typography color="text.secondary" fontWeight={500}>
                  {previous.length
                    ? "Sin comandas de hoy"
                    : "Sin comandas activas"}
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
                {group.orders.map((order) => (
                  <KitchenOrderCard
                    key={order._id}
                    order={order}
                    showMenuDate={older}
                    onStatusChange={onStatusChange}
                    isAdmin={isAdmin}
                  />
                ))}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
