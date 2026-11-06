import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { appAlert } from "../utils/notifications";
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
beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
});
afterEach(() => {
  cleanup();
  appAlert.close();
  vi.unstubAllGlobals();
});
it("shows the receipt directly in SweetAlert with the verified total and next step", async () => {
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
  expect(document.querySelector(".swal2-popup")?.textContent).toContain(
    "Comprobante del pedido",
  );
  expect(screen.getByText("order-123")).toBeDefined();
  expect(screen.getByText("Pendiente de aprobación")).toBeDefined();
  expect(
    screen.getByText("El local revisará tu pedido antes de enviarlo a cocina."),
  ).toBeDefined();
  expect(screen.getByText("1 × Menú hipocalórico")).toBeDefined();
  expect(screen.getByText("Proteína: Atún")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Volver al menú" }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
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

it("renders customer text safely inside the receipt", () => {
  const cliente = '<img src=x onerror="alert(1)">';
  render(
    <OrderReceiptDialog
      open
      order={{ _id: "order-safe", total: 5500 }}
      payload={{ ...payload, cliente }}
      onClose={vi.fn()}
    />,
  );
  expect(screen.getByText(`${cliente} · ${payload.telefono}`)).toBeDefined();
  expect(document.querySelector(".swal2-html-container img")).toBeNull();
});
