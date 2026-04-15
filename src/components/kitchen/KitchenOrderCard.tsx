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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import Swal from "sweetalert2";
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
  isAdmin: boolean;
}

export default function KitchenOrderCard({
  order,
  onStatusChange,
  isAdmin,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

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

  const isDone =
    order.estado === OrderStatus.ENTREGADO ||
    order.estado === OrderStatus.CANCELADO;

  const handleAdvance = async () => {
    if (!next) return;
    setLoading(true);
    try {
      await onStatusChange(order._id, next);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "¿Cancelar pedido?",
      text: `Se cancelará el pedido de ${order.cliente}. Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#757575",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, volver",
    });

    if (!result.isConfirmed) return;

    setLoadingCancel(true);
    try {
      await onStatusChange(order._id, OrderStatus.CANCELADO);
    } finally {
      setLoadingCancel(false);
    }
  };

  return (
    <Card
      elevation={isDone ? 0 : 2}
      sx={{
        borderRadius: 3,
        border: "1.5px solid",
        borderColor: isDone ? "divider" : "primary.light",
        opacity: isDone ? 0.55 : 1,
        bgcolor: isDone ? "grey.50" : "background.paper",
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

        {/* Footer zone */}
        {isDone ? (
          <>
            <Divider sx={{ mb: 1.5 }} />
            <Box display="flex" justifyContent="flex-end">
              <Chip
                icon={
                  order.estado === OrderStatus.ENTREGADO ? (
                    <CheckCircleIcon />
                  ) : (
                    <CancelIcon />
                  )
                }
                label={STATUS_LABELS[order.estado]}
                color={STATUS_COLOR[order.estado]}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </>
        ) : (
          next &&
          nextLabel && (
            <>
              <Divider sx={{ mb: 1.5 }} />
              <Box display="flex" alignItems="center">
                {isAdmin && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => void handleCancel()}
                    disabled={loadingCancel || loading}
                    startIcon={
                      loadingCancel ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : null
                    }
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => void handleAdvance()}
                  disabled={loading || loadingCancel}
                  startIcon={
                    loading ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : null
                  }
                  sx={{ fontWeight: 600, borderRadius: 2, ml: "auto" }}
                >
                  {nextLabel}
                </Button>
              </Box>
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}
