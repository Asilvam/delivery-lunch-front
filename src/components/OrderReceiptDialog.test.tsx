import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { OrderReceiptDialog } from "./OrderReceiptDialog";
import { OrderStatus, type OrderPayload } from "../types/order";
const payload: OrderPayload = {
  menuId: "menu",
  fecha: "2026-11-05",
  cliente: "Cliente",
  telefono: "+56912345678",
  total: 5500,
  items: [
    {
      platoId: "hipo",
      nombre: "Hipo",
      cantidad: 1,
      precio: 5500,
      selecciones: { proteina: "Atún", postre: "Postre" },
    },
  ],
};
afterEach(cleanup);
it("shows the receipt number, verified total and next step", () => {
  const close = vi.fn();
  render(
    <OrderReceiptDialog
      open
      order={{
        _id: "order-123",
        total: 5500,
        estado: OrderStatus.PENDIENTE,
        validadoPorAdmin: false,
      }}
      payload={payload}
      onClose={close}
    />,
  );
  expect(screen.getByText("order-123")).toBeDefined();
  expect(screen.getByText("Pendiente de aprobación")).toBeDefined();
  expect(
    screen.getByText("El local revisará tu pedido antes de enviarlo a cocina."),
  ).toBeDefined();
  expect(screen.getByText("1 × Menú hipocalórico")).toBeDefined();
  expect(screen.getByText("Proteína: Atún")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Volver al menú" }));
  expect(close).toHaveBeenCalledOnce();
});
it("uses the server state when a recovered order has already advanced", () => {
  render(
    <OrderReceiptDialog
      open
      order={{
        _id: "order-123",
        total: 5500,
        estado: OrderStatus.EN_PREPARACION,
        validadoPorAdmin: true,
      }}
      payload={payload}
      onClose={vi.fn()}
    />,
  );
  expect(screen.getByText("En preparación")).toBeDefined();
  expect(screen.queryByText("Pendiente de aprobación")).toBeNull();
});
