import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import KitchenOrdersPanel from "./KitchenOrdersPanel";
import type { Order } from "../../types/order";
vi.mock("./KitchenOrderCard", () => ({
  default: ({
    order,
    showMenuDate,
  }: {
    order: Order;
    showMenuDate?: boolean;
  }) => (
    <div
      data-testid={`card-${order._id}`}
      data-date={showMenuDate ? order.fecha : undefined}
    >
      {order.cliente}
    </div>
  ),
}));
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-13T15:00:00Z"));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const order = {
  _id: "order",
  cliente: "En cocina",
  validadoPorAdmin: true,
  estado: "en_preparacion",
  createdAt: "2026-11-13T12:00:00Z",
  fecha: "2026-11-13",
  items: [
    {
      platoId: "hipo",
      nombre: "Hipo",
      cantidad: 2,
      precio: 5500,
      selecciones: { proteina: "Atún", postre: "Fruta" },
    },
  ],
} as Order;
it("totals dishes and proteins by stage without counting unapproved or finished work", () => {
  render(
    <KitchenOrdersPanel
      orders={[
        order,
        { ...order, _id: "preparing2" },
        { ...order, _id: "queued", estado: "pendiente" },
        {
          ...order,
          _id: "ready",
          estado: "listo",
          items: [
            {
              ...order.items[0],
              selecciones: { proteina: "Pollo", postre: "Fruta" },
            },
          ],
        },
        { ...order, _id: "unapproved", validadoPorAdmin: false },
        { ...order, _id: "done", estado: "entregado" },
      ]}
      connected
      error={null}
      onStatusChange={vi.fn()}
      isAdmin
    />,
  );
  const summary = screen.getByLabelText("Resumen de producción de hoy");
  expect(within(summary).getByText("4× Hipo · Atún")).toBeDefined();
  expect(within(summary).getByText("2× Hipo · Atún")).toBeDefined();
  expect(within(summary).getByText("2× Hipo · Pollo")).toBeDefined();
  expect(within(summary).getByText("Listos para entregar")).toBeDefined();
  expect(screen.getByTestId("card-ready")).toBeDefined();
});
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

it("separates earlier menu dates from new orders and keeps FIFO in each group", () => {
  const older = {
    ...order,
    _id: "older",
    cliente: "Anterior primero",
    fecha: "2026-11-11",
    createdAt: "2026-11-11T14:00:00Z",
    estado: "pendiente",
  } as Order;
  const yesterday = {
    ...order,
    _id: "yesterday",
    cliente: "Anterior segundo",
    fecha: "2026-11-12",
    createdAt: "2026-11-12T14:00:00Z",
  };
  const todayLater = {
    ...order,
    _id: "later",
    cliente: "Hoy segundo",
    createdAt: "2026-11-13T14:00:00Z",
  };
  render(
    <KitchenOrdersPanel
      orders={[todayLater, yesterday, older, order]}
      connected
      error={null}
      onStatusChange={vi.fn()}
      isAdmin
    />,
  );
  const current = screen.getByRole("region", { name: "En curso (2)" });
  const previous = screen.getByRole("region", {
    name: "Pendientes de días anteriores (2)",
  });
  expect(
    within(current)
      .getAllByTestId(/^card-/)
      .map((node) => node.textContent),
  ).toEqual(["En cocina", "Hoy segundo"]);
  expect(
    within(previous)
      .getAllByTestId(/^card-/)
      .map((node) => node.textContent),
  ).toEqual(["Anterior primero", "Anterior segundo"]);
  expect(
    within(previous).getByTestId("card-older").getAttribute("data-date"),
  ).toBe("2026-11-11");
  expect(
    within(current).getByTestId("card-order").hasAttribute("data-date"),
  ).toBe(false);
});
it("keeps older work until manually delivered or cancelled, excluding unapproved orders", () => {
  const previous = { ...order, fecha: "2026-11-12" };
  const onStatusChange = vi.fn();
  const view = render(
    <KitchenOrdersPanel
      orders={[
        previous,
        {
          ...previous,
          _id: "unapproved",
          cliente: "Sin aprobar",
          validadoPorAdmin: false,
        },
      ]}
      connected
      error={null}
      onStatusChange={onStatusChange}
      isAdmin
    />,
  );
  expect(screen.getByText("Sin comandas de hoy")).toBeDefined();
  expect(screen.queryByText("Sin aprobar")).toBeNull();
  expect(
    screen.getByRole("region", { name: "Pendientes de días anteriores (1)" }),
  ).toBeDefined();
  expect(onStatusChange).not.toHaveBeenCalled();
  view.rerender(
    <KitchenOrdersPanel
      orders={[
        { ...previous, estado: "entregado" },
        { ...previous, _id: "cancelled", estado: "cancelado" },
      ]}
      connected
      error={null}
      onStatusChange={onStatusChange}
      isAdmin
    />,
  );
  expect(
    screen.queryByRole("region", { name: /Pendientes de días anteriores/ }),
  ).toBeNull();
  expect(screen.getByText("Sin comandas activas")).toBeDefined();
});
it("moves active work into the previous-days section at midnight without changing its status", () => {
  vi.setSystemTime(new Date("2026-11-14T02:59:59Z"));
  const onStatusChange = vi.fn();
  render(
    <KitchenOrdersPanel
      orders={[order]}
      connected
      error={null}
      onStatusChange={onStatusChange}
      isAdmin
    />,
  );
  expect(
    screen.queryByRole("region", { name: /Pendientes de días anteriores/ }),
  ).toBeNull();
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(
    screen.getByRole("region", { name: "Pendientes de días anteriores (1)" }),
  ).toBeDefined();
  expect(onStatusChange).not.toHaveBeenCalled();
});
it("rechecks the day when returning to a background tab", () => {
  render(
    <KitchenOrdersPanel
      orders={[order]}
      connected
      error={null}
      onStatusChange={vi.fn()}
      isAdmin
    />,
  );
  act(() => {
    vi.setSystemTime(new Date("2026-11-14T11:00:00Z"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(
    screen.getByRole("region", { name: "Pendientes de días anteriores (1)" }),
  ).toBeDefined();
});
