import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DishCard } from "./DishCard";
import type { Dish } from "../types/menu";
const dish: Dish = {
  id: "dish",
  name: "Pollo asado con arroz y papas fritas",
  price: 5500,
  stock: 10,
  proteinOptions: ["Pollo", "Cerdo"],
};
afterEach(cleanup);
describe("Menu prices", () => {
  it("shows only the button when the dish matches the general price", () => {
    const add = vi.fn();
    render(<DishCard dish={dish} onAddToCart={add} />);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText("$5.500")).toBeNull();
    expect(screen.queryByText("Ensalada surtida")).toBeNull();
    expect(screen.queryByText("Pan fresco del día")).toBeNull();
    expect(screen.queryByText("Postre del día")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Agregar / }));
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ price: 5500 }),
      { salad: "Ensalada surtida", dessert: "Postre del día" },
      { protein: false, salad: false, dessert: false },
    );
  });
  it("shows the actual special price and preserves it in the cart", () => {
    const add = vi.fn();
    render(<DishCard dish={{ ...dish, price: 6500 }} basePrice={5500} onAddToCart={add} />);
    expect(screen.getByText("$6.500")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /^Agregar / }));
    expect(add.mock.calls[0][0].price).toBe(6500);
  });
  it("hides the price when it matches a different configured general price", () => {
    render(<DishCard dish={{ ...dish, price: 6500 }} basePrice={6500} onAddToCart={vi.fn()} />);
    expect(screen.queryByText("$6.500")).toBeNull();
    expect(screen.queryByText("$5.500")).toBeNull();
  });
  it("requires a protein only on the hypocaloric menu", () => {
    const add = vi.fn();
    render(
      <DishCard
        dish={{ ...dish, name: "Hipo", isHipo: true }}
        onAddToCart={add}
      />,
    );
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Elige tu proteína" }),
    ).toHaveProperty("disabled", true);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /Proteína/ }));
    fireEvent.click(screen.getByRole("option", { name: "Pollo" }));
    fireEvent.click(screen.getByRole("button", { name: /^Agregar / }));
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ price: 5500 }),
      {
        protein: "Pollo",
        salad: "Ensalada surtida",
        dessert: "Postre del día",
      },
      { protein: true, salad: false, dessert: false },
    );
  });
  it("does not allow adding a sold-out menu", () => {
    render(<DishCard dish={{ ...dish, stock: 0 }} onAddToCart={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Agotado" })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
