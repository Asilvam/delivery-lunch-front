// src/hooks/useKitchenOrdersStream.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { Order } from "../types/order";
import { fetchKitchenOrders } from "../data/services/kitchenApi.service";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

interface UseKitchenOrdersStreamResult {
  orders: Order[];
  /** Actualiza un pedido existente en la lista por _id */
  updateOrder: (updated: Order) => void;
  connected: boolean;
  error: string | null;
}

export function useKitchenOrdersStream(
  token: string | null,
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
    // If there is no configured API base URL, skip remote calls (dev can use mocks).
    if (!token || !BASE_URL) {
      if (!BASE_URL) {
        // eslint-disable-next-line no-console
        console.warn('useKitchenOrdersStream: VITE_API_BASE_URL not configured, skipping initial fetch');
      }
      return;
    }

    fetchKitchenOrders(token)
      .then((snapshot) => setOrders(snapshot))
      .catch(() => { /* si falla, el SSE compensará con eventos nuevos */ });
  }, [token]);

  // ── Stream SSE (actualizaciones en tiempo real) ────────────────────────────
  useEffect(() => {
    if (!token || !BASE_URL) {
      if (!BASE_URL) {
        // eslint-disable-next-line no-console
        console.warn('useKitchenOrdersStream: VITE_API_BASE_URL not configured, skipping SSE stream');
      }
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    void fetchEventSource(`${BASE_URL}/orders/stream/kitchen`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,

      onopen: async (res) => {
        if (res.ok) {
          setConnected(true);
          setError(null);
        } else {
          setError(`SSE error ${res.status}`);
        }
      },

      onmessage: (ev) => {
        if (ev.event === "order_validated") {
          try {
            const order = JSON.parse(ev.data) as Order;
            setOrders((prev) => {
              // Evitar duplicados (ya puede existir en el snapshot)
              if (prev.some((o) => o._id === order._id)) return prev;
              return [order, ...prev];
            });
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

      onerror: (err) => {
        setConnected(false);
        setError(err instanceof Error ? err.message : "Error en stream SSE");
      },

      onclose: () => {
        setConnected(false);
      },
    });

    return () => {
      ctrl.abort();
      abortRef.current = null;
      setConnected(false);
    };
  }, [token]);

  return { orders, updateOrder, connected, error };
}
