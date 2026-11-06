import axios from 'axios';
import type { OrderPayload, OrderResponse } from '../../types/order';

const KEY = 'pending_order_attempt';
interface Attempt { key: string; googleId: string; payload: OrderPayload }
export function getPendingOrder(): Attempt | null {
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') as Attempt | null; } catch { return null; }
}
export async function sendOrder(payload: OrderPayload, token: string, googleId: string): Promise<OrderResponse> {
  const previous = getPendingOrder();
  if (previous && previous.googleId !== googleId) throw new Error('Vuelve a la cuenta con la que iniciaste este pedido para confirmar su resultado.');
  const attempt = previous ?? { key: crypto.randomUUID(), googleId, payload };
  sessionStorage.setItem(KEY, JSON.stringify(attempt));
  try {
    const res = await axios.post<OrderResponse>(`${import.meta.env.VITE_API_BASE_URL}/orders`, attempt.payload, {
      headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': attempt.key }, timeout: 15000,
    });
    sessionStorage.removeItem(KEY);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500 && (![408, 409, 429].includes(error.response.status) || (error.response.status === 409 && error.response.data?.code === 'PRICE_CHANGED'))) {
      sessionStorage.removeItem(KEY);
    }
    throw error;
  }
}
