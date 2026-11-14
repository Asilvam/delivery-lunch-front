import { useState } from "react";
import { Box, Button, Chip } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { useMountedRef } from "../../hooks/useMountedRef";
import { registerOrderPayment } from "../../data/services/adminApi.service";
import { appAlert } from "../../utils/notifications";
import { showActionError, showActionSuccess } from "../../utils/actionFeedback";
import type { Order } from "../../types/order";

export default function OrderPayment({
  order,
  onRecorded,
}: {
  order: Order;
  onRecorded?: () => void;
}) {
  const { token, role } = useAuth();
  const mounted = useMountedRef();
  const [saved, setSaved] = useState<Order>();
  const [saving, setSaving] = useState(false);
  const paid = order.pagado === true || saved?.pagado === true;
  const method = order.medioPago ?? saved?.medioPago;
  const record = async () => {
    if (!token || saving || paid) return;
    const result = await appAlert.fire({
      title: "Registrar pago completo",
      text: `${order.cliente} · $${order.total.toLocaleString("es-CL")}`,
      input: "select",
      inputOptions: { efectivo: "Efectivo", transferencia: "Transferencia" },
      inputPlaceholder: "Medio de pago",
      inputValidator: (value) =>
        value ? undefined : "Selecciona el medio de pago.",
      showCancelButton: true,
      confirmButtonText: "Registrar pago",
      cancelButtonText: "Volver",
    });
    const medio: unknown = result.value;
    if (
      !result.isConfirmed ||
      (medio !== "efectivo" && medio !== "transferencia")
    )
      return;
    setSaving(true);
    try {
      const updated = await registerOrderPayment(token, order._id, medio);
      if (!mounted.current) return;
      setSaved(updated);
      onRecorded?.();
      void showActionSuccess("Pago registrado");
    } catch (error) {
      if (mounted.current) void showActionError(error);
    } finally {
      if (mounted.current) setSaving(false);
    }
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        my: 1,
      }}
    >
      <Chip
        size="small"
        variant="outlined"
        color={
          paid ? "success" : order.pagado === false ? "warning" : "default"
        }
        label={
          paid
            ? `Pagado · ${method === "efectivo" ? "Efectivo" : "Transferencia"}`
            : order.pagado === false
              ? "Pago pendiente"
              : "Pago sin registrar"
        }
      />
      {!paid && order.estado !== "cancelado" && role === "admin" && (
        <Button
          size="small"
          disabled={saving}
          onClick={() => void record()}
          aria-label={`Marcar pagado el pedido de ${order.cliente}`}
        >
          {saving ? "Guardando…" : "Marcar pagado"}
        </Button>
      )}
    </Box>
  );
}
