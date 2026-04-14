// src/data/services/kitchenApi.service.ts
import axios from "axios";
import type { Order, OrderStatus } from "../../types/order";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
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
