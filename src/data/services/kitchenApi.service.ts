// src/data/services/kitchenApi.service.ts
import axios from "axios";
import type { Order, OrderStatus } from "../../types/order";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Carga el snapshot inicial de pedidos visibles en cocina:
 * todos los estados relevantes del día (excluyendo PENDIENTE que aún no fue validado).
 */
export async function fetchKitchenOrders(token: string): Promise<Order[]> {
  const res = await axios.get<Order[]>(`${BASE_URL}/orders/ByAdminTrue`, {
    headers: authHeaders(token),
    timeout: 10000,
  });
  return res.data;
}

/** Actualiza el estado de un pedido desde cocina. */
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
