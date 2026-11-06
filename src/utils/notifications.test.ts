import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { appAlert, userToast, staffToast } from "./notifications";
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => ({
      matches: false,
      media,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});
afterEach(async () => {
  appAlert.close();
  await vi.runOnlyPendingTimersAsync();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("automatically removes the shared toast after three seconds", async () => {
  void userToast.fire({
    icon: "info",
    title: "Descarga solicitada",
    animation: false,
  });
  await vi.advanceTimersByTimeAsync(0);
  expect(document.querySelector(".swal2-toast")?.textContent).toContain(
    "Descarga solicitada",
  );
  await vi.advanceTimersByTimeAsync(2900);
  expect(document.querySelector(".swal2-toast")).not.toBeNull();
  await vi.advanceTimersByTimeAsync(200);
  expect(document.querySelector(".swal2-toast")).toBeNull();
});
it("requires an explicit decision for confirmation instead of expiring", async () => {
  const decision = appAlert.fire({
    title: "¿Cancelar pedido?",
    showCancelButton: true,
    animation: false,
  });
  await vi.advanceTimersByTimeAsync(10000);
  expect(appAlert.getPopup()?.textContent).toContain("¿Cancelar pedido?");
  appAlert.getCancelButton()?.click();
  expect((await decision).isDismissed).toBe(true);
});

it("removes staff notifications within two seconds", async () => {
  void staffToast.fire({
    icon: "info",
    title: "Descarga solicitada",
    animation: false,
  });
  await vi.advanceTimersByTimeAsync(1900);
  expect(document.querySelector(".swal2-toast")).not.toBeNull();
  await vi.advanceTimersByTimeAsync(200);
  expect(document.querySelector(".swal2-toast")).toBeNull();
});
