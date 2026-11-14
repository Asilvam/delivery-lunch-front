import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { fetchKitchenOrders } from "../data/services/kitchenApi.service";
import { useKitchenOrdersStream } from "./useKitchenOrdersStream";
import type { Order } from "../types/order";

vi.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: vi.fn().mockImplementation(() => new Promise(() => {})),
}));
vi.mock("../data/services/kitchenApi.service", () => ({
  fetchKitchenOrders: vi.fn(),
}));
const order = {
  _id: "first",
  validadoPorAdmin: true,
  estado: "pendiente",
} as Order;
const callbacks = () => vi.mocked(fetchEventSource).mock.calls.at(-1)![1]!;
const send = (event: string, data: unknown = {}) =>
  callbacks().onmessage!({ event, data: JSON.stringify(data), id: "" });
beforeEach(() => {
  vi.mocked(fetchKitchenOrders).mockResolvedValue([order]);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("keeps the initial orders silent and rings only once per live approval", async () => {
  const ring = vi.fn();
  const hook = renderHook(() => useKitchenOrdersStream("token", ring));
  await act(async () => {
    await callbacks().onopen!(new Response());
  });
  act(() => {
    send("order_validated", order);
    send("kitchen_snapshot_complete");
    send("order_validated", order);
  });
  expect(ring).not.toHaveBeenCalled();
  act(() => {
    send("order_validated", { ...order, _id: "second" });
    send("order_validated", { ...order, _id: "second" });
    send("status_update", {
      ...order,
      _id: "second",
      estado: "en_preparacion",
    });
  });
  expect(ring).toHaveBeenCalledTimes(1);
  expect(hook.result.current.orders).toHaveLength(2);
});

it("does not ring for missed approvals replayed on reconnect, but rings for the next new one", async () => {
  const ring = vi.fn();
  renderHook(() => useKitchenOrdersStream("token", ring));
  await act(async () => {
    await callbacks().onopen!(new Response());
  });
  act(() => {
    send("kitchen_snapshot_complete");
    send("order_validated", order);
  });
  expect(ring).toHaveBeenCalledTimes(1);
  act(() => {
    callbacks().onerror!(new Error("offline"));
  });
  await act(async () => {
    await callbacks().onopen!(new Response());
  });
  act(() => {
    send("order_validated", order);
    send("order_validated", { ...order, _id: "missed" });
    send("kitchen_snapshot_complete");
    send("order_validated", { ...order, _id: "next" });
  });
  expect(ring).toHaveBeenCalledTimes(2);
});

it("does not ring for unapproved, preparing or malformed events, or after leaving kitchen", async () => {
  const ring = vi.fn();
  const hook = renderHook(() => useKitchenOrdersStream("token", ring));
  await act(async () => {
    await callbacks().onopen!(new Response());
  });
  act(() => {
    send("kitchen_snapshot_complete");
    send("order_validated", { ...order, validadoPorAdmin: false });
    send("order_validated", {
      ...order,
      _id: "preparing",
      estado: "en_preparacion",
    });
    send("order_validated", {});
    callbacks().onmessage!({
      event: "order_validated",
      data: "invalid",
      id: "",
    });
  });
  const options = callbacks();
  hook.unmount();
  options.onmessage!({
    event: "order_validated",
    data: JSON.stringify({ ...order, _id: "late" }),
    id: "",
  });
  expect(options.signal?.aborted).toBe(true);
  expect(ring).not.toHaveBeenCalled();
});
