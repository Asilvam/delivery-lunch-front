import axios from "axios";
import type { CustomerSession } from "../../context/customer-session";
export function sessionExpiresAt(session: CustomerSession | null): number {
  try {
    const payload = JSON.parse(
      atob(
        session!.access_token
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/"),
      ),
    ) as { role?: string; exp?: number };
    return payload.role === "customer" && typeof payload.exp === "number"
      ? payload.exp * 1000
      : 0;
  } catch {
    return 0;
  }
}
export function customerAuthMessage(error: unknown): string {
  const message = axios.isAxiosError(error)
    ? error.response?.data?.message
    : null;
  return typeof message === "string"
    ? message
    : "No pudimos recuperar tu sesión. Revisa tu conexión e intenta nuevamente.";
}
