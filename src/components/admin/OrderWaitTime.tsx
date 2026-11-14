import { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import { OrderStatus, type Order } from "../../types/order";

export default function OrderWaitTime({ order }: { order: Order }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 60_000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const since =
    order.estado === OrderStatus.LISTO
      ? order.listoEn
      : order.estado === OrderStatus.EN_PREPARACION
        ? order.aceptadoEn
        : order.createdAt;
  if (
    !since ||
    !Number.isFinite(Date.parse(since)) ||
    order.estado === OrderStatus.ENTREGADO ||
    order.estado === OrderStatus.CANCELADO
  )
    return null;
  const minutes = Math.max(0, Math.floor((now - Date.parse(since)) / 60_000));
  const label =
    order.estado === OrderStatus.LISTO
      ? "Listo hace"
      : order.estado === OrderStatus.EN_PREPARACION
        ? "En preparación hace"
        : "Esperando hace";
  return (
    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
      {label} {minutes} {minutes === 1 ? "minuto" : "minutos"}
    </Typography>
  );
}
