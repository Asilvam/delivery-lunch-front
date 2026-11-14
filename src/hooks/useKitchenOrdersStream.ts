// src/hooks/useKitchenOrdersStream.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { Order } from "../types/order";
import { fetchKitchenOrders } from "../data/services/kitchenApi.service";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

interface UseKitchenOrdersStreamResult {
  orders: Order[];
  /** Actualiza un pedido existente en la lista por _id */
  updateOrder: (updated: Order) => void;
  connected: boolean;
  error: string | null;
}

export function useKitchenOrdersStream(
  token: string | null,
  onNewOrder?: () => void,
): UseKitchenOrdersStreamResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const updateOrder = useCallback((updated: Order) => {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
  }, []);

  // ── Snapshot inicial via REST ──────────────────────────────────────────────
  // Carga todos los pedidos al montar para que el refresh no pierda
  // órdenes completadas o en curso que ya existían.
  useEffect(() => {
    if (!token) return;
    fetchKitchenOrders(token)
      .then((snapshot) =>
        setOrders((prev) => [
          ...new Map([...snapshot, ...prev].map((o) => [o._id, o])).values(),
        ]),
      )
      .catch(() =>
        setError("No pudimos cargar el historial inicial. Revisa la conexión."),
      );
  }, [token]);

  // ── Stream SSE (actualizaciones en tiempo real) ────────────────────────────
  useEffect(() => {
    if (!token) return;

    const ctrl = new AbortController();
    let snapshotComplete = false;
    const seenOrders = new Set<string>();
    abortRef.current = ctrl;

    void fetchEventSource(`${BASE_URL}/orders/stream/kitchen`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,

      onopen: async (res) => {
        snapshotComplete = false;
        if (res.ok) {
          setConnected(true);
          setError(null);
        } else {
          if (res.status === 401) {
            window.dispatchEvent(new Event("staff-session-expired"));
            ctrl.abort();
          }
          setConnected(false);
          setError("No pudimos actualizar los pedidos. Revisando conexión…");
          throw new Error("No se pudo establecer la conexión");
        }
      },

      onmessage: (ev) => {
        if (ctrl.signal.aborted) return;
        if (ev.event === "kitchen_snapshot_complete") {
          snapshotComplete = true;
          return;
        }
        if (ev.event === "order_validated") {
          try {
            const order = JSON.parse(ev.data) as Order;
            if (!order._id) return;
            const alreadySeen = seenOrders.has(order._id);
            seenOrders.add(order._id);
            setOrders((prev) => {
              // Evitar duplicados (ya puede existir en el snapshot)
              if (prev.some((o) => o._id === order._id)) return prev;
              return [order, ...prev];
            });
            if (
              snapshotComplete &&
              !alreadySeen &&
              order.validadoPorAdmin &&
              order.estado === "pendiente"
            ) {
              onNewOrder?.();
            }
          } catch {
            /* noop */
          }
        }

        if (ev.event === "status_update") {
          try {
            const updated = JSON.parse(ev.data) as Order;
            setOrders((prev) =>
              prev.map((o) => (o._id === updated._id ? updated : o)),
            );
          } catch {
            /* noop */
          }
        }
      },

      onerror: () => {
        snapshotComplete = false;
        setConnected(false);
        setError(
          "Conexión interrumpida. Estamos intentando recuperar los pedidos.",
        );
      },

      onclose: () => {
        snapshotComplete = false;
        setConnected(false);
        if (!ctrl.signal.aborted)
          throw new Error("Conexión cerrada; reintentando");
      },
    });

    return () => {
      ctrl.abort();
      abortRef.current = null;
      setConnected(false);
    };
  }, [token, onNewOrder]);

  return { orders, updateOrder, connected, error };
}
