import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useOrderingHours } from "./useOrderingHours";
import { isOrderingOpen } from "../domain/orders/orderingHours";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("closes at 16:00 and reopens at 08:00 without reloading the page", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-06T18:59:59Z"));
  const hook = renderHook(useOrderingHours);
  expect(hook.result.current).toBe(true);
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(hook.result.current).toBe(false);
  vi.setSystemTime(new Date("2026-11-07T11:00:00Z"));
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(hook.result.current).toBe(true);
});
it("uses Chilean winter hours independently of the browser timezone", () => {
  expect(isOrderingOpen(new Date("2026-07-06T11:59:59Z"))).toBe(false);
  expect(isOrderingOpen(new Date("2026-07-06T12:00:00Z"))).toBe(true);
  expect(isOrderingOpen(new Date("2026-07-06T20:00:00Z"))).toBe(false);
});
