import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import KitchenOrdersPanel from "./KitchenOrdersPanel";
import type { Order } from "../../types/order";
vi.mock("./KitchenOrderCard", () => ({
  default: ({ order }: { order: Order }) => <div>{order.cliente}</div>,
}));
afterEach(cleanup);
const order = {
  _id: "order",
  cliente: "En cocina",
  validadoPorAdmin: true,
  estado: "en_preparacion",
  createdAt: "2026-11-06T12:00:00Z",
} as Order;
it("keeps only approved active orders in kitchen and removes the completed report and export", () => {
  render(
    <KitchenOrdersPanel
      orders={[
        order,
        { ...order, _id: "done", cliente: "Ya entregado", estado: "entregado" },
        {
          ...order,
          _id: "pending",
          cliente: "Sin aprobar",
          validadoPorAdmin: false,
          estado: "pendiente",
        },
      ]}
      connected
      error={null}
      onStatusChange={vi.fn()}
      isAdmin
    />,
  );
  expect(screen.getByText("En cocina")).toBeTruthy();
  expect(screen.queryByText("Ya entregado")).toBeNull();
  expect(screen.queryByText("Sin aprobar")).toBeNull();
  expect(screen.queryByRole("button", { name: "Exportar a Excel" })).toBeNull();
  expect(screen.queryByText(/Completados/)).toBeNull();
});
it("shows the empty active queue even when there are completed orders", () => {
  render(
    <KitchenOrdersPanel
      orders={[{ ...order, estado: "entregado" }]}
      connected
      error={null}
      onStatusChange={vi.fn()}
      isAdmin={false}
    />,
  );
  expect(screen.getByText("Sin comandas activas")).toBeTruthy();
});
