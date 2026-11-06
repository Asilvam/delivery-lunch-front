import type { CartItem } from "../../types/cart";
import { MENU_SALAD, MENU_DESSERT } from "../menu/menuOffer";
import type { DishSelections } from "../../types/menu";

export const buildCartItemKey = (
  dishId: string,
  selections: DishSelections,
): string =>
  `${dishId}::${selections.protein ?? ""}::${selections.salad ?? ""}::${selections.dessert}`;

/** Actualiza carritos anteriores sin conservar elecciones que ya no ofrece el menú. */
export function normalizeMenuCart(items: CartItem[]): CartItem[] {
  const grouped = new Map<string, CartItem>();
  for (const item of items) {
    const selections: DishSelections = {
      ...(item.dish.isHipo && item.selections.protein
        ? { protein: item.selections.protein }
        : {}),
      salad: MENU_SALAD,
      dessert: MENU_DESSERT,
    };
    const key = buildCartItemKey(item.dish.id, selections);
    const existing = grouped.get(key);
    if (existing) existing.quantity += item.quantity;
    else
      grouped.set(key, {
        ...item,
        key,
        dish: item.dish,
        selections,
        visibility: {
          protein: item.dish.isHipo === true,
          salad: false,
          dessert: false,
        },
      });
  }
  return [...grouped.values()];
}
