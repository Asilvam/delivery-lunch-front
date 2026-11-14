import axios from "axios";
import type { Order, OrderPayload, OrderResponse } from "../../types/order";

const KEY = "pending_order_attempt";
interface Attempt {
  key: string;
  googleId: string;
  payload: OrderPayload;
}
export function getPendingOrder(): Attempt | null {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null") as Attempt | null;
  } catch {
    return null;
  }
}
export async function sendOrder(
  payload: OrderPayload,
  token: string,
  googleId: string,
): Promise<OrderResponse> {
  const previous = getPendingOrder();
  if (previous && previous.googleId !== googleId)
    throw new Error(
      "Vuelve a la cuenta con la que iniciaste este pedido para confirmar su resultado.",
    );
  const attempt = previous ?? { key: crypto.randomUUID(), googleId, payload };
  sessionStorage.setItem(KEY, JSON.stringify(attempt));
  return postAttempt<OrderResponse>(attempt, token, KEY, "orders");
}
const MANUAL_KEY = "pending_manual_order_attempt";
interface ManualAttempt {
  key: string;
  payload: OrderPayload;
}
export function getPendingManualOrder(): ManualAttempt | null {
  try {
    return JSON.parse(
      sessionStorage.getItem(MANUAL_KEY) || "null",
    ) as ManualAttempt | null;
  } catch {
    return null;
  }
}
export function sendManualOrder(
  payload: OrderPayload,
  token: string,
): Promise<Order> {
  const attempt = getPendingManualOrder() ?? {
    key: crypto.randomUUID(),
    payload,
  };
  sessionStorage.setItem(MANUAL_KEY, JSON.stringify(attempt));
  return postAttempt<Order>(attempt, token, MANUAL_KEY, "orders/manual");
}
async function postAttempt<T>(
  attempt: ManualAttempt,
  token: string,
  storageKey: string,
  path: string,
): Promise<T> {
  try {
    const res = await axios.post<T>(
      `${import.meta.env.VITE_API_BASE_URL}/${path}`,
      attempt.payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": attempt.key,
        },
        timeout: 15000,
      },
    );
    sessionStorage.removeItem(storageKey);
    return res.data;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response &&
      error.response.status >= 400 &&
      error.response.status < 500 &&
      (![408, 409, 429].includes(error.response.status) ||
        (error.response.status === 409 &&
          error.response.data?.code === "PRICE_CHANGED"))
    ) {
      sessionStorage.removeItem(storageKey);
    }
    throw error;
  }
}
