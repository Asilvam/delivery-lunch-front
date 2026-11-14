import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { fetchOrders } from "../data/services/adminApi.service";
import { useAdminOrdersStream } from "./useAdminOrdersStream";
import type { Order } from "../types/order";
vi.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: vi.fn().mockImplementation(() => new Promise(() => {})),
}));
vi.mock("../data/services/adminApi.service", () => ({ fetchOrders: vi.fn() }));
const pending = {
  _id: "first",
  estado: "pendiente",
  validadoPorAdmin: false,
} as Order;
const callbacks = () => vi.mocked(fetchEventSource).mock.calls.at(-1)![1]!;
const message = (event: string, order: Order) => ({
  event,
  data: JSON.stringify(order),
  id: "id",
});
beforeEach(() => {
  vi.mocked(fetchOrders).mockResolvedValue([pending]);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("initializes from a pending-only snapshot and updates the same queue for new, approved and cancelled events", async () => {
  const hook = renderHook(() => useAdminOrdersStream("admin-token"));
  await act(async () => {
    await callbacks().onopen!(new Response("", { status: 200 }));
  });
  expect(fetchOrders).toHaveBeenCalledWith(
    "admin-token",
    "pendiente",
    expect.any(AbortSignal),
  );
  expect(hook.result.current.orders).toEqual([pending]);
  act(() => {
    callbacks().onmessage!(message("new_order", { ...pending, _id: "second" }));
    callbacks().onmessage!(message("new_order", { ...pending, _id: "second" }));
  });
  expect(hook.result.current.orders).toHaveLength(2);
  act(() => {
    callbacks().onmessage!(
      message("order_validated", { ...pending, validadoPorAdmin: true }),
    );
  });
  expect(hook.result.current.orders.map((order) => order._id)).toEqual([
    "second",
  ]);
  act(() => {
    callbacks().onmessage!(
      message("order_cancelled", {
        ...pending,
        _id: "second",
        estado: "cancelado",
      }),
    );
  });
  expect(hook.result.current.orders).toEqual([]);
});
it("reconciles missed approvals on reconnect rather than retaining a stale badge", async () => {
  const hook = renderHook(() => useAdminOrdersStream("admin-token"));
  await act(async () => {
    await callbacks().onopen!(new Response("", { status: 200 }));
  });
  act(() => {
    callbacks().onerror!(new Error("offline"));
  });
  expect(hook.result.current.connected).toBe(false);
  vi.mocked(fetchOrders).mockResolvedValueOnce([
    { ...pending, validadoPorAdmin: true },
  ]);
  await act(async () => {
    await callbacks().onopen!(new Response("", { status: 200 }));
  });
  expect(hook.result.current.connected).toBe(true);
  expect(hook.result.current.orders).toHaveLength(0);
});
it("ignores an old snapshot after logout and aborts its stream", async () => {
  let finish!: (orders: Order[]) => void;
  vi.mocked(fetchOrders).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const hook = renderHook(() => useAdminOrdersStream("admin-token"));
  const options = callbacks();
  let opening!: Promise<void>;
  act(() => {
    opening = options.onopen!(new Response("", { status: 200 }));
  });
  hook.unmount();
  expect(options.signal?.aborted).toBe(true);
  await act(async () => {
    finish([pending]);
    await opening;
  });
});
it("does not open an administrator stream for a kitchen account or an anonymous visitor", () => {
  renderHook(() => useAdminOrdersStream(null));
  expect(fetchEventSource).not.toHaveBeenCalled();
  expect(fetchOrders).not.toHaveBeenCalled();
});
