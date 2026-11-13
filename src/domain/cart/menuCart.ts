import type { CartItem, MenuCart } from "../../types/cart";
import type { DailyMenu } from "../../types/menu";
import { normalizeMenuCart } from "./cartHelpers";

export const CART_STORAGE_KEY = "lunch_cart";
export const emptyMenuCart = (): MenuCart => ({
  menuId: null,
  fecha: null,
  venceEn: null,
  items: [],
});
export const chileToday = (now = new Date()) =>
  now.toLocaleDateString("en-CA", { timeZone: "America/Santiago" });

export function cartForMenu(menu: DailyMenu, items: CartItem[] = []): MenuCart {
  return {
    menuId: menu.id,
    fecha: menu.isoDate,
    venceEn: menu.expiresAt ?? null,
    items,
  };
}

export function readMenuCart(normalize = true): MenuCart {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(CART_STORAGE_KEY) || "null",
    ) as MenuCart | CartItem[] | null;
    const cart = Array.isArray(stored)
      ? { ...emptyMenuCart(), items: stored }
      : stored;
    if (!cart || !Array.isArray(cart.items)) return emptyMenuCart();
    return {
      menuId: typeof cart.menuId === "string" ? cart.menuId : null,
      fecha: typeof cart.fecha === "string" ? cart.fecha : null,
      venceEn: typeof cart.venceEn === "string" ? cart.venceEn : null,
      items: normalize ? normalizeMenuCart(cart.items) : cart.items,
    };
  } catch {
    return emptyMenuCart();
  }
}

// Unbound legacy carts are associated only when every dish belongs to one fetched menu.
export function reconcileMenuCart(
  cart: MenuCart,
  menus: DailyMenu[],
): MenuCart {
  if (!cart.items.length) return emptyMenuCart();
  const menu = cart.menuId
    ? menus.find((m) => m.id === cart.menuId && m.isoDate === cart.fecha)
    : menus.find((m) =>
        cart.items.every((item) =>
          m.dishes.some((dish) => dish.id === item.dish.id),
        ),
      );
  if (!menu) return cart;
  const dishes = new Map(menu.dishes.map((dish) => [dish.id, dish]));
  return cartForMenu(
    menu,
    cart.items.map((item) => ({
      ...item,
      dish: dishes.get(item.dish.id) ?? item.dish,
    })),
  );
}

export type MenuCartStatus =
  "empty" | "checking" | "unverified" | "expired" | "unavailable" | "ready";
export function menuCartStatus(
  cart: MenuCart,
  menus: DailyMenu[],
  loading: boolean,
  now = new Date(),
): MenuCartStatus {
  if (!cart.items.length) return "empty";
  if (cart.fecha && cart.fecha !== chileToday(now)) return "expired";
  if (
    cart.venceEn &&
    Number.isFinite(Date.parse(cart.venceEn)) &&
    now.getTime() >= Date.parse(cart.venceEn)
  )
    return "expired";
  if (loading) return "checking";
  if (
    !cart.menuId ||
    !cart.fecha ||
    !cart.venceEn ||
    !Number.isFinite(Date.parse(cart.venceEn))
  )
    return "unverified";
  const menu = menus.find(
    (m) => m.id === cart.menuId && m.isoDate === cart.fecha,
  );
  if (
    !menu ||
    !cart.items.every((item) =>
      menu.dishes.some((dish) => dish.id === item.dish.id),
    )
  )
    return "unavailable";
  return "ready";
}

export const cartStatusMessage: Record<MenuCartStatus, string | undefined> = {
  empty: undefined,
  ready: undefined,
  checking: "Estamos comprobando la vigencia de tu carrito.",
  unverified:
    "No pudimos verificar el menú de este carrito. Revisa el menú del día antes de comenzar un pedido nuevo.",
  expired:
    "Tu carrito venció. Solo puedes confirmar pedidos del menú de hoy hasta las 16:00.",
  unavailable:
    "El menú o alguno de los platos de este carrito ya no está disponible. Revisa el menú del día.",
};
