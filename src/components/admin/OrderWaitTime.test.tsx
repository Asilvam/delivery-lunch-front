import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import OrderWaitTime from "./OrderWaitTime";
import type { Order } from "../../types/order";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-14T15:00:00Z"));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const order = {
  estado: "pendiente",
  createdAt: "2026-11-14T14:50:00Z",
} as Order;
it("updates waiting time every minute and on returning to the tab", () => {
  render(<OrderWaitTime order={order} />);
  expect(screen.getByText("Esperando hace 10 minutos")).toBeDefined();
  act(() => {
    vi.advanceTimersByTime(60_000);
  });
  expect(screen.getByText("Esperando hace 11 minutos")).toBeDefined();
  act(() => {
    vi.setSystemTime(new Date("2026-11-14T16:00:00Z"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(screen.getByText("Esperando hace 70 minutos")).toBeDefined();
});
it("uses the preparation and ready dates and hides completed or unknown times", () => {
  const view = render(
    <OrderWaitTime
      order={{
        ...order,
        estado: "en_preparacion",
        aceptadoEn: "2026-11-14T14:59:00Z",
      }}
    />,
  );
  expect(screen.getByText("En preparación hace 1 minuto")).toBeDefined();
  view.rerender(
    <OrderWaitTime
      order={{ ...order, estado: "listo", listoEn: "2026-11-14T15:00:00Z" }}
    />,
  );
  expect(screen.getByText("Listo hace 0 minutos")).toBeDefined();
  for (const update of [
    { estado: "entregado" },
    { estado: "cancelado" },
    { estado: "listo" },
  ]) {
    view.rerender(<OrderWaitTime order={{ ...order, ...update } as Order} />);
    expect(view.container.textContent).toBe("");
  }
});
