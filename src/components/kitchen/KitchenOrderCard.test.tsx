import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import KitchenOrderCard from "./KitchenOrderCard";
import type { Order } from "../../types/order";
import { appAlert } from "../../utils/notifications";
vi.mock("../admin/OrderPayment", () => ({ default: () => null }));
vi.mock("../../utils/notifications", () => ({ appAlert: { fire: vi.fn() } }));
vi.mock("../../utils/actionFeedback", () => ({
  showActionError: vi.fn(),
  showActionSuccess: vi.fn(),
}));
const previous: Order = {
  _id: "previous",
  menuId: "menu",
  fecha: "2026-11-12",
  cliente: "Cliente anterior",
  telefono: "+56911111111",
  total: 5500,
  estado: "pendiente",
  validadoPorAdmin: true,
  createdAt: "2026-11-12T14:00:00Z",
  updatedAt: "2026-11-12T14:00:00Z",
  items: [
    {
      platoId: "dish",
      nombre: "Pollo asado",
      cantidad: 1,
      precio: 5500,
      selecciones: { postre: "Postre del día" },
    },
  ],
};
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("shows the original menu date and preserves manual preparation and delivery actions", async () => {
  const update = vi.fn().mockResolvedValue(undefined);
  const view = render(
    <KitchenOrderCard
      order={previous}
      showMenuDate
      onStatusChange={update}
      isAdmin={false}
    />,
  );
  expect(screen.getByText("Menú del 12/11/2026")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Iniciar preparación" }));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith("previous", "en_preparacion"),
  );
  view.rerender(
    <KitchenOrderCard
      order={{ ...previous, estado: "en_preparacion" }}
      showMenuDate
      onStatusChange={update}
      isAdmin={false}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Marcar listo" }));
  await waitFor(() => expect(update).toHaveBeenCalledWith("previous", "listo"));
  view.rerender(
    <KitchenOrderCard
      order={{ ...previous, estado: "listo", listoEn: "2026-11-12T15:00:00Z" }}
      showMenuDate
      onStatusChange={update}
      isAdmin={false}
    />,
  );
  expect(screen.getByText("Listo para entregar")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Marcar entregado" }));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith("previous", "entregado"),
  );
});
it("keeps cancellation with admin and requires confirmation for previous-day work", async () => {
  const update = vi.fn().mockResolvedValue(undefined);
  vi.mocked(appAlert.fire)
    .mockResolvedValueOnce({ isConfirmed: false } as never)
    .mockResolvedValueOnce({ isConfirmed: true } as never);
  render(
    <KitchenOrderCard
      order={previous}
      showMenuDate
      onStatusChange={update}
      isAdmin
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  await waitFor(() => expect(appAlert.fire).toHaveBeenCalledOnce());
  expect(update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith("previous", "cancelado"),
  );
});
