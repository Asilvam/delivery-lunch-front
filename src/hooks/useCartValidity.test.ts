import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useCartValidity } from "./useCartValidity";
import { emptyMenuCart } from "../domain/cart/menuCart";
import type { MenuCart } from "../types/cart";
import type { DailyMenu } from "../types/menu";
const menu: DailyMenu = {
  id: "menu",
  isoDate: "2026-11-13",
  date: "13/11/26",
  dishes: [{ id: "dish", name: "Plato", price: 5500 }],
  includes: { salad: { options: [] }, bread: "", dessert: { options: [] } },
};
const cart: MenuCart = {
  menuId: menu.id,
  fecha: menu.isoDate,
  venceEn: "2026-11-13T19:00:00Z",
  items: [
    {
      key: "dish",
      dish: menu.dishes[0],
      quantity: 1,
      selections: { dessert: "Postre" },
      visibility: { protein: false, salad: false, dessert: false },
    },
  ],
};
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("expires an open cart at closing time and never reactivates it the next morning", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-13T18:59:59Z"));
  const hook = renderHook(() => useCartValidity(cart, [menu], false));
  expect(hook.result.current.status).toBe("ready");
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(hook.result.current.status).toBe("expired");
  act(() => {
    vi.setSystemTime(new Date("2026-11-14T11:00:00Z"));
    window.dispatchEvent(new Event("focus"));
  });
  expect(hook.result.current).toEqual({
    today: "2026-11-14",
    status: "expired",
  });
});
it("rechecks immediately when returning to a background tab", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-13T18:00:00Z"));
  const hook = renderHook(() => useCartValidity(cart, [menu], false));
  act(() => {
    vi.setSystemTime(new Date("2026-11-13T20:00:00Z"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(hook.result.current.status).toBe("expired");
});
it("updates the menu date at Santiago midnight even with an empty cart", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-14T02:59:59Z"));
  const hook = renderHook(() => useCartValidity(emptyMenuCart(), [], false));
  expect(hook.result.current.today).toBe("2026-11-13");
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(hook.result.current.today).toBe("2026-11-14");
});
