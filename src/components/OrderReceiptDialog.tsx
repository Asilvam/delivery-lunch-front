import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { OrderSummary } from "./OrderSummary";
import {
  OrderStatus,
  type OrderPayload,
  type OrderResponse,
} from "../types/order";

export function OrderReceiptDialog({
  open,
  order,
  payload,
  onClose,
}: {
  open: boolean;
  order: OrderResponse;
  payload: OrderPayload;
  onClose: () => void;
}) {
  const status =
    order.estado === OrderStatus.CANCELADO
      ? {
          title: "Pedido cancelado",
          detail: "El pedido figura cancelado.",
          severity: "warning" as const,
        }
      : order.estado === OrderStatus.ENTREGADO
        ? {
            title: "Pedido entregado",
            detail: "El pedido figura entregado.",
            severity: "success" as const,
          }
        : order.estado === OrderStatus.EN_PREPARACION
          ? {
              title: "En preparación",
              detail: "Cocina está preparando tu pedido.",
              severity: "info" as const,
            }
          : order.validadoPorAdmin
            ? {
                title: "Pedido aprobado",
                detail: "El local aprobó tu pedido y lo envió a cocina.",
                severity: "success" as const,
              }
            : {
                title: "Pendiente de aprobación",
                detail:
                  "El local revisará tu pedido antes de enviarlo a cocina.",
                severity: "info" as const,
              };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="receipt-title"
      slotProps={{
        paper: {
          sx: { maxHeight: "92dvh", m: 1.5, width: "calc(100% - 24px)" },
        },
      }}
    >
      <DialogTitle
        id="receipt-title"
        sx={{ fontWeight: 800, color: "primary.dark" }}
      >
        Comprobante del pedido
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2 }}>
        <Alert severity={status.severity}>
          <Typography variant="body2" fontWeight={800}>
            {status.title}
          </Typography>
          <Typography variant="body2">{status.detail}</Typography>
        </Alert>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Número de pedido
          </Typography>
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ overflowWrap: "anywhere", userSelect: "all" }}
          >
            {order._id}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {payload.cliente} · {payload.telefono}
          </Typography>
        </Box>
        <OrderSummary
          items={payload.items.map((item, index) => ({
            key: `${item.platoId}-${index}`,
            name: /^hipo$/i.test(item.nombre)
              ? "Menú hipocalórico"
              : item.nombre,
            quantity: item.cantidad,
            price: item.precio,
            protein: item.selecciones?.proteina,
          }))}
          total={order.total}
        />
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          flexShrink: 0,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button fullWidth variant="contained" onClick={onClose}>
          Volver al menú
        </Button>
      </DialogActions>
    </Dialog>
  );
}
