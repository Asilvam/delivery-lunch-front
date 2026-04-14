// src/components/admin/PendingOrderCard.tsx
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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import Swal from "sweetalert2";
import type { Order } from "../../types/order";

interface Props {
  order: Order;
  onValidate: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export default function PendingOrderCard({
  order,
  onValidate,
  onCancel,
}: Props) {
  const [loadingValidate, setLoadingValidate] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  const handleValidate = async () => {
    setLoadingValidate(true);
    try {
      await onValidate(order._id);
    } finally {
      setLoadingValidate(false);
    }
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "¿Cancelar pedido?",
      html: `<span style="font-size:0.95rem">Se cancelará el pedido de <strong>${order.cliente}</strong> y se restaurará el stock de los platos.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, volver",
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#757575",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setLoadingCancel(true);
    try {
      await onCancel(order._id);
      await Swal.fire({
        title: "Pedido cancelado",
        text: "El stock fue restaurado correctamente.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      await Swal.fire({
        title: "Error al cancelar",
        text: "No se pudo cancelar el pedido. Intenta nuevamente.",
        icon: "error",
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#d32f2f",
      });
    } finally {
      setLoadingCancel(false);
    }
  };

  const isAnyLoading = loadingValidate || loadingCancel;

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        border: "1.5px solid",
        borderColor: "warning.light",
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
            label="Pendiente"
            color="warning"
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
          Fecha pedido: {order.fecha} &nbsp;·&nbsp;{" "}
          {new Date(order.createdAt).toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>

        <Divider sx={{ mb: 1.5 }} />

        {/* Items */}
        <Box display="flex" flexDirection="column" gap={0.5} mb={1.5}>
          {order.items.map((item, i) => (
            <Box key={i} display="flex" justifyContent="space-between">
              <Typography variant="body2">
                {item.cantidad}× {item.nombre}
                {Object.entries(item.selecciones ?? {}).map(([k, v]) => (
                  <Typography
                    key={k}
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    {" "}
                    · {v}
                  </Typography>
                ))}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                ${(item.precio * item.cantidad).toLocaleString("es-CL")}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={700} color="primary.main">
            Total: ${order.total.toLocaleString("es-CL")}
          </Typography>

          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={
                loadingCancel ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <CancelOutlinedIcon />
                )
              }
              onClick={() => void handleCancel()}
              disabled={isAnyLoading}
              sx={{ fontWeight: 600, borderRadius: 2 }}
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={
                loadingValidate ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <CheckCircleOutlineIcon />
                )
              }
              onClick={() => void handleValidate()}
              disabled={isAnyLoading}
              sx={{ fontWeight: 600, borderRadius: 2 }}
            >
              Aprobar
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
