import { useCallback, useEffect, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { OrderStatus, type Order } from "../types/order";
import { fetchOrders } from "../data/services/adminApi.service";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
export interface UseAdminOrdersStreamResult {
  orders: Order[];
  updateOrder: (updated: Order) => void;
  removeOrder: (id: string) => void;
  connected: boolean;
  error: string | null;
}
const pending = (order: Order) =>
  !order.validadoPorAdmin && order.estado === OrderStatus.PENDIENTE;

export function useAdminOrdersStream(
  token: string | null,
): UseAdminOrdersStreamResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateOrder = useCallback((updated: Order) => {
    setOrders((prev) =>
      pending(updated)
        ? prev.some((order) => order._id === updated._id)
          ? prev.map((order) => (order._id === updated._id ? updated : order))
          : [updated, ...prev]
        : prev.filter((order) => order._id !== updated._id),
    );
  }, []);
  const removeOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((order) => order._id !== id));
  }, []);
  useEffect(() => {
    if (!token) return;
    const ctrl = new AbortController();
    void fetchEventSource(`${BASE_URL}/orders/stream/admin`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
      onopen: async (res) => {
        if (ctrl.signal.aborted) return;
        if (!res.ok) {
          if (res.status === 401) {
            window.dispatchEvent(new Event("staff-session-expired"));
            ctrl.abort();
          }
          throw new Error("No se pudo establecer la conexión");
        }
        // Reconcile the whole queue on reconnect, including approvals missed offline.
        // Live events are buffered by fetchEventSource until onopen completes.
        const snapshot = await fetchOrders(
          token,
          OrderStatus.PENDIENTE,
          ctrl.signal,
        );
        if (ctrl.signal.aborted) return;
        setOrders(snapshot.filter(pending));
        setConnected(true);
        setError(null);
      },
      onmessage: (event) => {
        if (ctrl.signal.aborted) return;
        if (
          ![
            "new_order",
            "order_cancelled",
            "order_validated",
            "payment_update",
          ].includes(event.event)
        )
          return;
        try {
          const order = JSON.parse(event.data) as Order;
          setOrders((prev) => {
            if (
              !["new_order", "payment_update"].includes(event.event) ||
              !pending(order)
            )
              return prev.filter((current) => current._id !== order._id);
            return prev.some((current) => current._id === order._id)
              ? prev.map((current) =>
                  current._id === order._id ? order : current,
                )
              : [order, ...prev];
          });
        } catch {
          /* Ignore malformed events without changing the queue. */
        }
      },
      onerror: () => {
        if (ctrl.signal.aborted) return;
        setConnected(false);
        setError(
          "Conexión interrumpida. Estamos intentando recuperar los pedidos.",
        );
      },
      onclose: () => {
        if (ctrl.signal.aborted) return;
        setConnected(false);
        throw new Error("Conexión cerrada; reintentando");
      },
    });
    return () => {
      ctrl.abort();
    };
  }, [token]);
  return { orders, updateOrder, removeOrder, connected, error };
}
