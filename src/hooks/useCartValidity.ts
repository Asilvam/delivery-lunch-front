import { useCallback, useSyncExternalStore } from "react";
import type { MenuCart } from "../types/cart";
import type { DailyMenu } from "../types/menu";
import {
  chileToday,
  menuCartStatus,
  type MenuCartStatus,
} from "../domain/cart/menuCart";

function subscribe(refresh: () => void) {
  const timer = window.setInterval(refresh, 1000);
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
}

export function useCartValidity(
  cart: MenuCart,
  menus: DailyMenu[],
  loading: boolean,
) {
  const snapshot = useCallback(() => {
    const now = new Date();
    return `${chileToday(now)}:${menuCartStatus(cart, menus, loading, now)}`;
  }, [cart, menus, loading]);
  const current = useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    today: current.slice(0, 10),
    status: current.slice(11) as MenuCartStatus,
  };
}
