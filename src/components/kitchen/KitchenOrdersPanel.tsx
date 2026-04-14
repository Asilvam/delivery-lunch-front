// src/components/kitchen/KitchenOrdersPanel.tsx
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
}

export default function KitchenOrdersPanel({
  orders,
  connected,
  error,
  onStatusChange,
}: Props) {
  const active = orders.filter(
    (o) =>
      o.estado !== OrderStatus.ENTREGADO && o.estado !== OrderStatus.CANCELADO,
  );
  const done = orders.filter(
    (o) =>
      o.estado === OrderStatus.ENTREGADO || o.estado === OrderStatus.CANCELADO,
  );

  return (
    <Box>
      {/* Connection status */}
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        {connected ? (
          <Chip
            icon={<WifiIcon />}
            label="Conectado"
            color="success"
            size="small"
          />
        ) : (
          <Chip
            icon={<WifiOffIcon />}
            label="Reconectando…"
            color="default"
            size="small"
          />
        )}
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </Box>

      {active.length === 0 && done.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography color="text.secondary" fontWeight={500}>
            Sin comandas activas
          </Typography>
        </Box>
      ) : (
        <>
          {active.length > 0 && (
            <Box mb={4}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="text.secondary"
                mb={1.5}
                textTransform="uppercase"
                letterSpacing={1}
              >
                En curso ({active.length})
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {active.map((order) => (
                  <KitchenOrderCard
                    key={order._id}
                    order={order}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </Box>
            </Box>
          )}

          {done.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="text.secondary"
                mb={1.5}
                textTransform="uppercase"
                letterSpacing={1}
              >
                Completados ({done.length})
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {done.map((order) => (
                  <KitchenOrderCard
                    key={order._id}
                    order={order}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
