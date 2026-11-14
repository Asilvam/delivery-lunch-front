import axios from "axios";
import { staffAlert, STAFF_ACTION_DURATION_MS } from "./notifications";
export async function showActionError(error: unknown) {
  const message =
    axios.isAxiosError(error) && error.response?.status === 401
      ? "Tu sesión venció. Inicia sesión nuevamente."
      : "No pudimos completar la acción. El pedido sigue disponible; intenta nuevamente.";
  await staffAlert.fire({
    icon: "error",
    title: "No se pudo actualizar el pedido",
    text: message,
  });
}
export function showActionSuccess(title: string) {
  return staffAlert.fire({
    icon: "success",
    title,
    timer: STAFF_ACTION_DURATION_MS,
  });
}
