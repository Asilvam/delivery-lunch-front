import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import CustomersPage from "./CustomersPage";
import {
  blockCustomer,
  fetchCustomers,
} from "../data/services/customersApi.service";
import { appAlert, staffAlert } from "../utils/notifications";
vi.mock("../components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../components/admin/StaffNavigation", () => ({ default: () => null }));
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ token: "admin-token" }),
}));
vi.mock("../data/services/customersApi.service", () => ({
  fetchCustomers: vi.fn(),
  blockCustomer: vi.fn(),
}));
vi.mock("../utils/notifications", () => ({
  appAlert: { fire: vi.fn() },
  staffAlert: { fire: vi.fn() },
  STAFF_ACTION_DURATION_MS: 1000,
}));
const customer = {
  googleId: "user",
  name: "Cliente",
  email: "c@example.test",
  phone: "+56911111111",
  blocked: false,
  blockReason: "",
  totalOrders: 3,
  approvedOrders: 2,
  lastOrderAt: "2026-11-13T15:00:00Z",
};
beforeEach(() => {
  vi.mocked(fetchCustomers).mockResolvedValue({
    items: [customer],
    total: 1,
    page: 1,
    pageSize: 25,
  });
  vi.mocked(blockCustomer).mockResolvedValue();
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("shows the verified customer contact and order counts, with live search", async () => {
  render(<CustomersPage />);
  await screen.findByText("c@example.test");
  expect(screen.getByText("3 pedidos · 2 aprobados")).toBeDefined();
  fireEvent.change(screen.getByLabelText("Buscar nombre, correo o teléfono"), {
    target: { value: "Cliente" },
  });
  await waitFor(() =>
    expect(fetchCustomers).toHaveBeenLastCalledWith(
      "admin-token",
      { q: "Cliente", status: "all", page: 1 },
      expect.any(AbortSignal),
    ),
  );
});
it("requires explicit confirmation and sends the internal block reason only after confirming", async () => {
  vi.mocked(appAlert.fire)
    .mockResolvedValueOnce({ isConfirmed: false } as never)
    .mockResolvedValueOnce({
      isConfirmed: true,
      value: "Revisar con el local",
    } as never);
  render(<CustomersPage />);
  await screen.findByText("c@example.test");
  fireEvent.click(screen.getByRole("button", { name: "Bloquear a Cliente" }));
  await waitFor(() => expect(appAlert.fire).toHaveBeenCalledOnce());
  expect(blockCustomer).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Bloquear a Cliente" }));
  await waitFor(() =>
    expect(blockCustomer).toHaveBeenCalledWith(
      "admin-token",
      "user",
      true,
      "Revisar con el local",
    ),
  );
  expect(staffAlert.fire).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Cliente bloqueado", timer: 1000 }),
  );
});
