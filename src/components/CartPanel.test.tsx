import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CartPanel } from "./CartPanel";
import type { CartItem } from "../types/cart";
const hipo: CartItem = {
  key: "hipo-pollo",
  dish: { id: "hipo", name: "Hipo", price: 5500, isHipo: true, stock: 3 },
  quantity: 1,
  selections: { protein: "Pollo asado", dessert: "Postre del día" },
  visibility: { protein: true, salad: false, dessert: false },
};
const porotos: CartItem = {
  ...hipo,
  key: "porotos",
  dish: { id: "porotos", name: "Porotos con riendas", price: 5500, stock: 5 },
  quantity: 2,
  selections: { dessert: "Postre del día" },
  visibility: { protein: false, salad: false, dessert: false },
};
afterEach(cleanup);
describe("Cart review", () => {
  it("shows clear quantities, protein, line subtotals and the complete total", () => {
    render(
      <CartPanel
        cartItems={[hipo, porotos]}
        totalItems={3}
        totalPrice={16500}
        isMobile={false}
        onClose={vi.fn()}
        onRemove={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onConfirmOrder={vi.fn()}
      />,
    );
    expect(screen.getByText("Menú hipocalórico")).toBeDefined();
    expect(screen.getByText("Proteína: Pollo asado")).toBeDefined();
    expect(
      screen.getByLabelText("Subtotal de Porotos con riendas").textContent,
    ).toBe("$11.000");
    expect(screen.getByLabelText("Total del pedido").textContent).toBe(
      "$16.500",
    );
    expect(screen.getByText("3 menús completos")).toBeDefined();
    expect(screen.getAllByText("Cada menú incluye")).toHaveLength(1);
  });
  it("updates the correct protein variant and continues to the contact step", () => {
    const update = vi.fn(),
      next = vi.fn(),
      remove = vi.fn();
    render(
      <CartPanel
        cartItems={[hipo]}
        totalItems={1}
        totalPrice={5500}
        isMobile
        onClose={vi.fn()}
        onRemove={remove}
        onUpdateQuantity={update}
        onConfirmOrder={next}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Agregar una porción de Menú hipocalórico",
      }),
    );
    expect(update).toHaveBeenCalledWith("hipo-pollo", 1);
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar a confirmar" }),
    );
    expect(next).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar Menú hipocalórico" }),
    );
    expect(remove).toHaveBeenCalledWith("hipo-pollo");
  });
  it("disables increasing the quantity when the shared dish stock is reached", () => {
    render(
      <CartPanel
        cartItems={[{ ...hipo, dish: { ...hipo.dish, stock: 1 } }]}
        totalItems={1}
        totalPrice={5500}
        isMobile
        onClose={vi.fn()}
        onRemove={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onConfirmOrder={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Agregar una porción de Menú hipocalórico",
      }),
    ).toHaveProperty("disabled", true);
  });
});
