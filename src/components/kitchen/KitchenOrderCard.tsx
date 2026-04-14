// src/components/kitchen/KitchenOrderCard.tsx
import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { OrderStatus, type Order } from "../../types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: "Pendiente",
  [OrderStatus.EN_PREPARACION]: "En preparación",
  [OrderStatus.ENTREGADO]: "Entregado",
  [OrderStatus.CANCELADO]: "Cancelado",
};

const STATUS_COLOR: Record<
  OrderStatus,
  "default" | "warning" | "success" | "error"
> = {
  [OrderStatus.PENDIENTE]: "warning",
  [OrderStatus.EN_PREPARACION]: "default",
  [OrderStatus.ENTREGADO]: "success",
  [OrderStatus.CANCELADO]: "error",
};

interface Props {
  order: Order;
  onStatusChange: (id: string, estado: OrderStatus) => Promise<void>;
}

export default function KitchenOrderCard({ order, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false);

  const nextStatus: Record<OrderStatus, OrderStatus | null> = {
    [OrderStatus.PENDIENTE]: OrderStatus.EN_PREPARACION,
    [OrderStatus.EN_PREPARACION]: OrderStatus.ENTREGADO,
    [OrderStatus.ENTREGADO]: null,
    [OrderStatus.CANCELADO]: null,
  };

  const nextStatusLabel: Record<OrderStatus, string | null> = {
    [OrderStatus.PENDIENTE]: "Iniciar preparación",
    [OrderStatus.EN_PREPARACION]: "Marcar entregado",
    [OrderStatus.ENTREGADO]: null,
    [OrderStatus.CANCELADO]: null,
  };

  const next = nextStatus[order.estado];
  const nextLabel = nextStatusLabel[order.estado];

  const handleAdvance = async () => {
    if (!next) return;
    setLoading(true);
    try {
      await onStatusChange(order._id, next);
    } finally {
      setLoading(false);
    }
  };

  const isDone =
    order.estado === OrderStatus.ENTREGADO ||
    order.estado === OrderStatus.CANCELADO;

  return (
    <Card
      elevation={isDone ? 0 : 2}
      sx={{
        borderRadius: 3,
        border: "1.5px solid",
        borderColor: isDone ? "divider" : "primary.light",
        opacity: isDone ? 0.6 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      <CardContent sx={{ pb: "12px !important" }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1}
        >
          <Box>
            <Typography fontWeight={700} fontSize="1rem">
              {order.cliente}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {order.telefono}
            </Typography>
          </Box>
          <Chip
            label={STATUS_LABELS[order.estado]}
            color={STATUS_COLOR[order.estado]}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1.5}
        >
          {new Date(order.createdAt).toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>

        <Divider sx={{ mb: 1.5 }} />

        {/* Items */}
        <Box display="flex" flexDirection="column" gap={0.5} mb={1.5}>
          {order.items.map((item, i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight={600}>
                {item.cantidad}× {item.nombre}
              </Typography>
              {Object.entries(item.selecciones ?? {}).map(([k, v]) => (
                <Typography
                  key={k}
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  ml={2}
                >
                  {k}: {v}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>

        {next && nextLabel && (
          <>
            <Divider sx={{ mb: 1.5 }} />
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                size="small"
                onClick={() => void handleAdvance()}
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : null
                }
                sx={{ fontWeight: 600, borderRadius: 2 }}
              >
                {nextLabel}
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
