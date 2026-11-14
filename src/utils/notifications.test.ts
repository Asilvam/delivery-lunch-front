import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { appAlert, userAlert, staffAlert } from "./notifications";
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
it("shows a centered SweetAlert and removes it after the same three seconds", async () => {
  void userAlert.fire({
    icon: "info",
    title: "Descarga solicitada",
    animation: false,
  });
  await vi.advanceTimersByTimeAsync(0);
  expect(document.querySelector(".swal2-popup")?.textContent).toContain(
    "Descarga solicitada",
  );
  expect(document.querySelector(".swal2-toast")).toBeNull();
  expect(
    document.querySelector(".swal2-container.swal2-center"),
  ).not.toBeNull();
  await vi.advanceTimersByTimeAsync(2900);
  expect(document.querySelector(".swal2-popup")).not.toBeNull();
  await vi.advanceTimersByTimeAsync(200);
  expect(document.querySelector(".swal2-popup")).toBeNull();
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
  void staffAlert.fire({
    icon: "info",
    title: "Descarga solicitada",
    animation: false,
  });
  await vi.advanceTimersByTimeAsync(1900);
  expect(document.querySelector(".swal2-popup")).not.toBeNull();
  await vi.advanceTimersByTimeAsync(200);
  expect(document.querySelector(".swal2-popup")).toBeNull();
});

it("preserves the one-second duration of quick staff actions", async () => {
  void staffAlert.fire({
    title: "Pedido aprobado",
    timer: 1000,
    animation: false,
  });
  await vi.advanceTimersByTimeAsync(900);
  expect(staffAlert.getPopup()?.textContent).toContain("Pedido aprobado");
  await vi.advanceTimersByTimeAsync(200);
  expect(document.querySelector(".swal2-popup")).toBeNull();
});
