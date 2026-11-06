import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import CompletedOrdersReport from "./CompletedOrdersReport";
import { staffToast } from "../../utils/notifications";
vi.mock("../../utils/notifications", () => ({ staffToast: { fire: vi.fn() } }));
import {
  createOrdersExcel,
  downloadOrdersExcel,
} from "../../utils/ordersExcel";
import type { Order } from "../../types/order";
vi.mock("../../utils/ordersExcel", () => ({
  createOrdersExcel: vi.fn(),
  downloadOrdersExcel: vi.fn(),
}));
const order: Order = {
  _id: "done",
  menuId: "menu",
  fecha: "2026-11-06",
  cliente: "Cliente",
  telefono: "+56900000000",
  total: 5500,
  estado: "entregado",
  validadoPorAdmin: true,
  items: [
    {
      platoId: "dish",
      nombre: "Pollo",
      cantidad: 1,
      precio: 5500,
      selecciones: { postre: "Fruta" },
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const file = { blob: new Blob(["test"]), filename: "Report-day-061126.xlsx" };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createOrdersExcel).mockResolvedValue(file);
});
afterEach(cleanup);
function panel(orders = [order]) {
  return (
    <CompletedOrdersReport
      orders={orders}
      startDate="2026-11-01"
      endDate="2026-11-06"
      loading={false}
    />
  );
}
it("exports the completed orders for the selected metrics period", async () => {
  const cancelled = {
    ...order,
    _id: "cancelled",
    estado: "cancelado" as const,
  };
  const active = { ...order, _id: "active", estado: "en_preparacion" as const };
  render(panel([order, cancelled, active]));
  expect(screen.queryByRole("button", { name: "Exportar CSV" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Exportar a Excel" }));
  await waitFor(() => expect(downloadOrdersExcel).toHaveBeenCalledWith(file));
  expect(createOrdersExcel).toHaveBeenCalledWith(
    [order, cancelled],
    "2026-11-01",
    "2026-11-06",
  );
  expect(staffToast.fire).toHaveBeenCalledWith({
    icon: "info",
    title:
      "Descarga solicitada para 2 pedidos. Si la cancelaste, puedes volver a exportar.",
  });
  expect(screen.queryByRole("alert")).toBeNull();
});
it("does not show an export when there are no completed rows", () => {
  render(panel([{ ...order, estado: "en_preparacion" }]));
  expect(
    screen.getByRole("button", { name: "Exportar a Excel" }),
  ).toHaveProperty("disabled", true);
});
it("blocks repeated clicks while generating the file", async () => {
  let complete!: (file: { blob: Blob; filename: string }) => void;
  vi.mocked(createOrdersExcel).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  render(panel());
  fireEvent.click(screen.getByRole("button", { name: "Exportar a Excel" }));
  await waitFor(() => expect(createOrdersExcel).toHaveBeenCalledOnce());
  expect(
    screen.getByRole("button", { name: "Preparando Excel…" }),
  ).toHaveProperty("disabled", true);
  complete(file);
  await waitFor(() => expect(downloadOrdersExcel).toHaveBeenCalledOnce());
});
it("lets an administrator retry a failed export without changing any orders", async () => {
  vi.mocked(createOrdersExcel)
    .mockRejectedValueOnce(new Error("zip"))
    .mockResolvedValueOnce(file);
  render(panel([order]));
  fireEvent.click(screen.getByRole("button", { name: "Exportar a Excel" }));
  await waitFor(() =>
    expect(staffToast.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "error",
        title: expect.stringContaining("No pudimos generar el Excel"),
      }),
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Exportar a Excel" }));
  await waitFor(() => expect(downloadOrdersExcel).toHaveBeenCalledOnce());
});
