import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import OrderPayment from "./OrderPayment";
import { registerOrderPayment } from "../../data/services/adminApi.service";
import { appAlert } from "../../utils/notifications";
import type { Order } from "../../types/order";
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ token: "admin", role: "admin" }),
}));
vi.mock("../../data/services/adminApi.service", () => ({
  registerOrderPayment: vi.fn(),
}));
vi.mock("../../utils/notifications", () => ({ appAlert: { fire: vi.fn() } }));
vi.mock("../../utils/actionFeedback", () => ({
  showActionSuccess: vi.fn(),
  showActionError: vi.fn(),
}));
const order = {
  _id: "order",
  cliente: "Cliente",
  total: 5500,
  estado: "entregado",
} as Order;
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("distinguishes historical unregistered payments from pending and paid orders", () => {
  const view = render(<OrderPayment order={order} />);
  expect(screen.getByText("Pago sin registrar")).toBeDefined();
  view.rerender(<OrderPayment order={{ ...order, pagado: false }} />);
  expect(screen.getByText("Pago pendiente")).toBeDefined();
  view.rerender(
    <OrderPayment order={{ ...order, pagado: true, medioPago: "efectivo" }} />,
  );
  expect(screen.getByText("Pagado · Efectivo")).toBeDefined();
  expect(screen.queryByRole("button")).toBeNull();
});
it("records the full payment only after confirmation and refreshes the metrics callback", async () => {
  const refresh = vi.fn();
  vi.mocked(appAlert.fire)
    .mockResolvedValueOnce({ isConfirmed: false } as never)
    .mockResolvedValueOnce({
      isConfirmed: true,
      value: "transferencia",
    } as never);
  vi.mocked(registerOrderPayment).mockResolvedValue({
    ...order,
    pagado: true,
    medioPago: "transferencia",
  });
  render(<OrderPayment order={order} onRecorded={refresh} />);
  fireEvent.click(screen.getByRole("button"));
  await waitFor(() => expect(appAlert.fire).toHaveBeenCalledOnce());
  expect(registerOrderPayment).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button"));
  expect(await screen.findByText("Pagado · Transferencia")).toBeDefined();
  expect(registerOrderPayment).toHaveBeenCalledWith(
    "admin",
    "order",
    "transferencia",
  );
  expect(refresh).toHaveBeenCalledOnce();
});
it("does not offer to charge a cancelled order", () => {
  render(<OrderPayment order={{ ...order, estado: "cancelado" }} />);
  expect(screen.queryByRole("button")).toBeNull();
});
