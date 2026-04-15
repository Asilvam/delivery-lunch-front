// src/components/kitchen/KitchenOrdersPanel.tsx
import { useState } from "react";
import { Box, Chip, Collapse, IconButton, Typography } from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import WifiIcon from "@mui/icons-material/Wifi";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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
  const [collapsed, setCollapsed] = useState(false);

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
                    isAdmin={isAdmin}
                  />
                ))}
              </Box>
            </Box>
          )}

          {done.length > 0 && (
            <Box>
              {/* Collapsible header */}
              <Box
                display="flex"
                alignItems="center"
                sx={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => setCollapsed((c) => !c)}
                mb={collapsed ? 0 : 1.5}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="text.secondary"
                  textTransform="uppercase"
                  letterSpacing={1}
                  flexGrow={1}
                >
                  Completados ({done.length})
                </Typography>
                <IconButton size="small" tabIndex={-1}>
                  {collapsed ? (
                    <ExpandMoreIcon fontSize="small" />
                  ) : (
                    <ExpandLessIcon fontSize="small" />
                  )}
                </IconButton>
              </Box>

              <Collapse in={!collapsed}>
                <Box display="flex" flexDirection="column" gap={2}>
                  {done.map((order) => (
                    <KitchenOrderCard
                      key={order._id}
                      order={order}
                      onStatusChange={onStatusChange}
                      isAdmin={isAdmin}
                    />
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
