import { act, cleanup, render } from "@testing-library/react";
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
