import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "./DashboardPage";
import { fetchDashboardSummary } from "../data/services/statisticsApi.service";
import { staffToast } from "../utils/notifications";
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ token: "test-token", role: "admin", logout: vi.fn() }),
}));
vi.mock("../utils/notifications", () => ({ staffToast: { fire: vi.fn() } }));
vi.mock("../data/services/statisticsApi.service", () => ({
  fetchDashboardSummary: vi.fn(),
  fetchTopDishes: vi.fn().mockResolvedValue([]),
  fetchPeakHours: vi.fn().mockResolvedValue([]),
  fetchRevenue: vi.fn().mockResolvedValue([]),
  fetchCancellations: vi.fn().mockResolvedValue([]),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  sessionStorage.clear();
});
it("ignores a metrics request failure after navigating away", async () => {
  let reject!: (error: unknown) => void;
  vi.mocked(fetchDashboardSummary).mockImplementationOnce(
    () =>
      new Promise((_resolve, no) => {
        reject = no;
      }),
  );
  const view = render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
  expect(fetchDashboardSummary).toHaveBeenCalledOnce();
  view.unmount();
  await act(async () => {
    reject(new Error("late metrics failure"));
  });
  expect(staffToast.fire).not.toHaveBeenCalled();
});

it("refreshes the selected period without leaving loading stuck and replaces ticket with menu units", async () => {
  vi.mocked(fetchDashboardSummary).mockResolvedValue({
    pedidosTotales: 3,
    pedidosCompletados: 1,
    pedidosCancelados: 1,
    pedidosPendientes: 1,
    pedidosEnPreparacion: 0,
    menusVendidos: 2,
    ingresosTotales: 11000,
    tasaCompletacion: 33.33,
    periodo: { startDate: "2026-11-06", endDate: "2026-11-06" },
  });
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
  await screen.findByText("Menús vendidos");
  expect(screen.queryByText(/ticket promedio/i)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
  await waitFor(() => expect(fetchDashboardSummary).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(screen.queryByLabelText("Actualizando métricas")).toBeNull(),
  );
  expect(screen.queryByRole("button", { name: "Actualizar" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Últimos 7 días" }));
  await waitFor(() => expect(fetchDashboardSummary).toHaveBeenCalledTimes(3));
});
