import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Alert, Box, Typography } from "@mui/material";
import { OrderSummary } from "./OrderSummary";
import { appAlert } from "../utils/notifications";
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
  // A React portal preserves escaping, theme and accessibility inside SweetAlert.
  const [content] = useState(() => document.createElement("div"));
  useEffect(() => {
    if (!open) return;
    let active = true;
    let resolved = false;
    void appAlert
      .fire({
        title: "Comprobante del pedido",
        html: content,
        width: "min(560px, calc(100vw - 24px))",
        confirmButtonText: "Volver al menú",
        showCloseButton: true,
        closeButtonAriaLabel: "Cerrar comprobante",
      })
      .then(() => {
        resolved = true;
        if (active) onClose();
      });
    return () => {
      active = false;
      if (!resolved && appAlert.getHtmlContainer()?.contains(content))
        appAlert.close();
    };
  }, [open, content, onClose]);
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
  if (!open) return null;
  return createPortal(
    <Box sx={{ display: "grid", gap: 2, textAlign: "left" }}>
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
          name: /^hipo$/i.test(item.nombre) ? "Menú hipocalórico" : item.nombre,
          quantity: item.cantidad,
          price: item.precio,
          protein: item.selecciones?.proteina,
        }))}
        total={order.total}
      />
    </Box>,
    content,
  );
}
