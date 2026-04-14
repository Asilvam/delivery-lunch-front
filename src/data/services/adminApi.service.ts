// src/data/services/adminApi.service.ts
import axios from "axios";
import type { Order, OrderStatus } from "../../types/order";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Lista todos los pedidos. Opcionalmente filtra por estado. */
export async function fetchOrders(
  token: string,
  estado?: OrderStatus,
): Promise<Order[]> {
  const params = estado ? { estado } : {};
  const res = await axios.get<Order[]>(`${BASE_URL}/orders`, {
    headers: authHeaders(token),
    params,
    timeout: 10000,
  });
  return res.data;
}

/** Aprueba un pedido (lo envía a cocina). */
export async function adminValidateOrder(
  token: string,
  id: string,
): Promise<Order> {
  const res = await axios.patch<Order>(
    `${BASE_URL}/orders/${id}/admin-validate`,
    {},
    { headers: authHeaders(token), timeout: 10000 },
  );
  return res.data;
}

/** Cancela un pedido y restaura el stock. */
export async function cancelOrder(token: string, id: string): Promise<Order> {
  const res = await axios.patch<Order>(
    `${BASE_URL}/orders/${id}/cancel`,
    {},
    { headers: authHeaders(token), timeout: 10000 },
  );
  return res.data;
}

/** Actualiza el estado de un pedido. */
export async function updateOrderStatus(
  token: string,
  id: string,
  estado: OrderStatus,
): Promise<Order> {
  const res = await axios.patch<Order>(
    `${BASE_URL}/orders/${id}/status`,
    { estado },
    { headers: authHeaders(token), timeout: 10000 },
  );
  return res.data;
}
