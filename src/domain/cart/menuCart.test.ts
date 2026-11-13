import { afterEach, describe, expect, it } from "vitest";
import type { CartItem } from "../../types/cart";
import type { DailyMenu } from "../../types/menu";
import {
  CART_STORAGE_KEY,
  cartForMenu,
  emptyMenuCart,
  menuCartStatus,
  readMenuCart,
  reconcileMenuCart,
} from "./menuCart";
const item: CartItem = {
  key: "dish",
  dish: { id: "dish", name: "Plato", price: 5500 },
  quantity: 2,
  selections: { dessert: "Postre del día" },
  visibility: { protein: false, salad: false, dessert: false },
};
const menu: DailyMenu = {
  id: "menu",
  isoDate: "2026-11-13",
  date: "13/11/26",
  expiresAt: "2026-11-13T19:00:00.000Z",
  dishes: [item.dish],
  includes: { salad: { options: [] }, bread: "", dessert: { options: [] } },
};
const noon = new Date("2026-11-13T15:00:00Z");
afterEach(() => sessionStorage.clear());
describe("Menu-bound cart", () => {
  it("preserves menu identity, expiration and quantities after reloading", () => {
    sessionStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cartForMenu(menu, [item])),
    );
    const restored = readMenuCart();
    expect(restored).toMatchObject({
      menuId: menu.id,
      fecha: menu.isoDate,
      venceEn: menu.expiresAt,
      items: [{ quantity: 2 }],
    });
    expect(menuCartStatus(restored, [menu], false, noon)).toBe("ready");
  });
  it("blocks at exactly 16:00, retaining the items", () => {
    const cart = cartForMenu(menu, [item]);
    expect(
      menuCartStatus(cart, [menu], false, new Date("2026-11-13T18:59:59Z")),
    ).toBe("ready");
    expect(menuCartStatus(cart, [menu], false, new Date(menu.expiresAt!))).toBe(
      "expired",
    );
    expect(cart.items).toEqual([item]);
    expect(
      menuCartStatus(cart, [menu], false, new Date("2026-11-14T11:00:00Z")),
    ).toBe("expired");
  });
  it("never transfers old items to another date, even with matching names and catalog photos", () => {
    const cart = cartForMenu(menu, [item]);
    const tomorrow = {
      ...menu,
      id: "next-menu",
      isoDate: "2026-11-14",
      expiresAt: "2026-11-14T19:00:00Z",
      dishes: [{ ...item.dish, id: "next-dish" }],
    };
    expect(reconcileMenuCart(cart, [tomorrow])).toBe(cart);
    expect(
      menuCartStatus(cart, [tomorrow], false, new Date("2026-11-14T11:00:00Z")),
    ).toBe("expired");
  });
  it("binds a legacy cart only if every dish ID belongs to the same menu", () => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify([item]));
    const legacy = readMenuCart();
    expect(menuCartStatus(legacy, [menu], false, noon)).toBe("unverified");
    expect(reconcileMenuCart(legacy, [menu]).menuId).toBe(menu.id);
    const other = { ...menu, dishes: [{ ...item.dish, id: "other-id" }] };
    expect(reconcileMenuCart(legacy, [other])).toBe(legacy);
    expect(
      reconcileMenuCart(
        {
          ...legacy,
          items: [item, { ...item, dish: { ...item.dish, id: "missing" } }],
        },
        [menu],
      ).menuId,
    ).toBeNull();
  });
  it("refreshes current prices and stock only within the original menu", () => {
    const cart = cartForMenu(menu, [item]);
    const fresh = {
      ...menu,
      dishes: [{ ...item.dish, price: 6500, stock: 4 }],
    };
    expect(reconcileMenuCart(cart, [fresh]).items[0]).toMatchObject({
      quantity: 2,
      dish: { price: 6500, stock: 4 },
    });
    expect(menuCartStatus(cart, [{ ...menu, dishes: [] }], false, noon)).toBe(
      "unavailable",
    );
    expect(menuCartStatus(cart, [], false, noon)).toBe("unavailable");
  });
  it("fails closed for missing or invalid expiry, and keeps pending attempt snapshots untouched", () => {
    const cart = cartForMenu(menu, [item]);
    expect(
      menuCartStatus({ ...cart, venceEn: null }, [menu], false, noon),
    ).toBe("unverified");
    expect(
      menuCartStatus({ ...cart, venceEn: "invalid" }, [menu], false, noon),
    ).toBe("unverified");
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    expect(readMenuCart(false)).toEqual(cart);
    sessionStorage.setItem(CART_STORAGE_KEY, "invalid-json");
    expect(readMenuCart()).toEqual(emptyMenuCart());
  });
});
