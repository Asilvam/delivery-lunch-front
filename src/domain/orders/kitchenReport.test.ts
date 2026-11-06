import { expect, it } from "vitest";
import type { Order } from "../../types/order";
import { getChileDate, getKitchenCompletedOrders } from "./kitchenReport";
const now = new Date("2026-11-06T03:05:00Z"); // 00:05 in Chile.
const order: Order = {
  _id: "done",
  menuId: "menu",
  fecha: "2026-11-05",
  cliente: "Cliente",
  telefono: "+56900000000",
  total: 5500,
  estado: "entregado",
  validadoPorAdmin: true,
  items: [],
  createdAt: "2026-11-05T15:00:00Z",
  updatedAt: now.toISOString(),
};
it("exports exactly the completed/cancelled list from today in Chile", () => {
  const cancelled = { ...order, _id: "cancel", estado: "cancelado" as const };
  const active = { ...order, _id: "active", estado: "en_preparacion" as const };
  const previousDay = {
    ...order,
    _id: "old",
    updatedAt: "2026-11-06T02:59:59Z",
  };
  expect(
    getKitchenCompletedOrders([order, cancelled, active, previousDay], now),
  ).toEqual([order, cancelled]);
});
it("uses completion/update day rather than menu day", () => {
  expect(getKitchenCompletedOrders([order], now)).toEqual([order]);
});
it("ignores invalid update timestamps", () => {
  expect(
    getKitchenCompletedOrders([{ ...order, updatedAt: "invalid" }], now),
  ).toEqual([]);
});
it("formats Chile dates correctly across UTC midnight", () => {
  expect(getChileDate(new Date("2026-11-06T02:59:59Z"))).toBe("2026-11-05");
  expect(getChileDate(now)).toBe("2026-11-06");
});
