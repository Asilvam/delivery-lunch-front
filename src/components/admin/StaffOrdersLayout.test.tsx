import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import StaffOrdersLayout from "./StaffOrdersLayout";
import StaffNavigation from "./StaffNavigation";
import { fetchOrders } from "../../data/services/adminApi.service";
import { usePendingOrders } from "../../hooks/usePendingOrders";
import type { Order } from "../../types/order";
vi.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: vi.fn().mockImplementation(() => new Promise(() => {})),
}));
vi.mock("../../data/services/adminApi.service", () => ({
  fetchOrders: vi.fn(),
}));
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ token: "admin", role: "admin", logout: vi.fn() }),
}));
function Queue() {
  const { orders, removeOrder } = usePendingOrders();
  return (
    <>
      {orders.map((order) => (
        <button key={order._id} onClick={() => removeOrder(order._id)}>
          Resolver {order._id}
        </button>
      ))}
    </>
  );
}
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("shares one stream between the pending list and navigation and retains it across staff sections", async () => {
  vi.mocked(fetchOrders).mockResolvedValue([
    { _id: "one", estado: "pendiente", validadoPorAdmin: false },
  ] as Order[]);
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route element={<StaffOrdersLayout />}>
          <Route
            path="/admin"
            element={
              <>
                <StaffNavigation />
                <Queue />
              </>
            }
          />
          <Route path="/cocina" element={<StaffNavigation />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  expect(fetchEventSource).toHaveBeenCalledTimes(1);
  const options = vi.mocked(fetchEventSource).mock.calls[0][1]!;
  await act(async () => {
    await options.onopen!(new Response("", { status: 200 }));
  });
  expect(
    screen.getByRole("link", { name: "Pedidos, 1 pendiente de aprobación" }),
  ).toBeDefined();
  fireEvent.click(
    within(screen.getByRole("navigation")).getByRole("link", {
      name: "Cocina",
    }),
  );
  expect(
    screen.getByRole("link", { name: "Pedidos, 1 pendiente de aprobación" }),
  ).toBeDefined();
  expect(fetchEventSource).toHaveBeenCalledTimes(1);
  fireEvent.click(
    screen.getByRole("link", { name: "Pedidos, 1 pendiente de aprobación" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Resolver one" }));
  expect(screen.getByRole("link", { name: "Pedidos" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "Resolver one" })).toBeNull();
});
