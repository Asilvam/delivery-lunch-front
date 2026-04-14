// src/components/admin/AdminOrdersPanel.tsx
import { Box, Chip, Typography } from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import WifiIcon from "@mui/icons-material/Wifi";
import PendingOrderCard from "./PendingOrderCard";
import type { Order } from "../../types/order";

interface Props {
  orders: Order[];
  connected: boolean;
  error: string | null;
  onValidate: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export default function AdminOrdersPanel({
  orders,
  connected,
  error,
  onValidate,
  onCancel,
}: Props) {
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

      {orders.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography color="text.secondary" fontWeight={500}>
            Sin pedidos pendientes de aprobación
          </Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {orders.map((order) => (
            <PendingOrderCard
              key={order._id}
              order={order}
              onValidate={onValidate}
              onCancel={onCancel}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
