import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import DailyMenuManager from "./DailyMenuManager";
vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({ token: "admin" }),
}));
vi.mock("../../../data/services/dishLibraryApi.service", () => ({
  fetchAdminMenu: vi.fn().mockResolvedValue(null),
  fetchLibrary: vi.fn().mockResolvedValue([]),
  fetchAdminMenus: vi.fn().mockResolvedValue([]),
}));
vi.mock("./MenuCompositionEditor", () => ({
  default: ({ date }: { date: string }) => <div>Editor para {date}</div>,
}));
vi.mock("./PublishedMenuEditor", () => ({ default: () => null }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("opens creation on tomorrow after closing and advances an already open date chooser at 16:00", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-13T18:59:59Z"));
  render(<DailyMenuManager onDirtyChange={vi.fn()} onOpenLibrary={vi.fn()} />);
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Crear nuevo menú" }));
  expect(
    screen.getByLabelText("Fecha del nuevo menú", { exact: false }),
  ).toHaveProperty("value", "2026-11-13");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  const field = screen.getByLabelText("Fecha del nuevo menú", { exact: false });
  expect(field).toHaveProperty("value", "2026-11-14");
  expect(field.getAttribute("min")).toBe("2026-11-14");
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(300); });
  fireEvent.click(screen.getByRole("button", { name: "Crear nuevo menú" }));
  expect(
    screen.getByLabelText("Fecha del nuevo menú", { exact: false }),
  ).toHaveProperty("value", "2026-11-14");
});
