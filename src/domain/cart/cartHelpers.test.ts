import { describe, expect, it } from "vitest";
import { normalizeMenuCart } from "./cartHelpers";
import type { CartItem } from "../../types/cart";
it("merges old salad and dessert variants without losing quantities", () => {
  const item: CartItem = {
    key: "old",
    dish: { id: "dish", name: "Plato", price: 5000 },
    quantity: 2,
    selections: { salad: "Chilena", dessert: "Flan" },
    visibility: { salad: true, dessert: true, protein: false },
  };
  const result = normalizeMenuCart([
    item,
    {
      ...item,
      key: "other",
      quantity: 1,
      selections: { salad: "Repollo", dessert: "Fruta" },
    },
  ]);
  expect(result).toHaveLength(1);
  expect(result[0].quantity).toBe(3);
  expect(result[0].dish.price).toBe(5000);
});
describe("Hypocaloric protein variants", () => {
  it("preserves separate variants sharing the same dish stock", () => {
    const item: CartItem = {
      key: "old",
      dish: { id: "hipo", name: "Hipo", price: 5500, isHipo: true },
      quantity: 1,
      selections: { protein: "Pollo", dessert: "Flan" },
      visibility: { salad: false, dessert: false, protein: true },
    };
    const result = normalizeMenuCart([
      item,
      {
        ...item,
        key: "other",
        selections: { protein: "Atún", dessert: "Fruta" },
      },
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.selections.protein)).toEqual(["Pollo", "Atún"]);
  });
});
