// src/hooks/useAdminOrdersStream.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { Order } from "../types/order";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

interface UseAdminOrdersStreamResult {
  orders: Order[];
  /** Reemplaza un pedido existente en la lista (por _id) o lo ignora si no existe */
  updateOrder: (updated: Order) => void;
  /** Elimina un pedido de la lista (útil tras validación: sale del panel admin) */
  removeOrder: (id: string) => void;
  connected: boolean;
  error: string | null;
}

export function useAdminOrdersStream(
  token: string | null,
): UseAdminOrdersStreamResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const updateOrder = useCallback((updated: Order) => {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
  }, []);

  const removeOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o._id !== id));
  }, []);

  useEffect(() => {
    if (!token) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    void fetchEventSource(`${BASE_URL}/orders/stream/admin`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,

      onopen: async (res) => {
        if (res.ok) {
          setConnected(true);
          setError(null);
        } else {
          if (res.status === 401) { window.dispatchEvent(new Event('staff-session-expired')); ctrl.abort(); }
          setConnected(false);
          setError('No pudimos actualizar los pedidos. Revisando conexión…');
          throw new Error('No se pudo establecer la conexión');
        }
      },

      onmessage: (ev) => {
        if (ev.event === 'order_cancelled' || ev.event === 'order_validated') {
          try { const order = JSON.parse(ev.data) as Order; setOrders(prev => prev.filter(o => o._id !== order._id)); } catch { /* mensaje inválido */ }
          return;
        }
        if (ev.event === "new_order") {
          try {
            const order = JSON.parse(ev.data) as Order;
            setOrders((prev) => {
              // Evitar duplicados (replay puede re-enviar pedidos ya en lista)
              if (prev.some((o) => o._id === order._id)) return prev;
              return [order, ...prev];
            });
          } catch {
            /* noop */
          }
        }
      },

      onerror: () => {
        setConnected(false);
        setError("Conexión interrumpida. Estamos intentando recuperar los pedidos.");
        // fetchEventSource reintenta automáticamente; no relanzamos
      },

      onclose: () => {
        setConnected(false);
        if (!ctrl.signal.aborted) throw new Error('Conexión cerrada; reintentando');
      },
    });

    return () => {
      ctrl.abort();
      abortRef.current = null;
      setConnected(false);
    };
  }, [token]);

  return { orders, updateOrder, removeOrder, connected, error };
}
