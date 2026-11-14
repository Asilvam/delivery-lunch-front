import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ManualOrderDialog from "./ManualOrderDialog";
import { fetchDailyMenusFromApi } from "../../data/services/menuApi.service";
import {
  getPendingManualOrder,
  sendManualOrder,
} from "../../data/services/orderApi.service";
import { useOrderingHours } from "../../hooks/useOrderingHours";
import type { DailyMenu } from "../../types/menu";
import type { Order } from "../../types/order";
vi.mock("../../hooks/useAuth", () => ({ useAuth: () => ({ token: "admin" }) }));
vi.mock("../../hooks/useSweetAlertOpen", () => ({
  useSweetAlertOpen: () => false,
}));
vi.mock("../../hooks/useOrderingHours", () => ({ useOrderingHours: vi.fn() }));
vi.mock("../../data/services/menuApi.service", () => ({
  fetchDailyMenusFromApi: vi.fn(),
}));
vi.mock("../../data/services/orderApi.service", () => ({
  getPendingManualOrder: vi.fn(),
  sendManualOrder: vi.fn(),
}));
vi.mock("../../utils/notifications", () => ({ staffAlert: { fire: vi.fn() } }));
const menu = {
  id: "menu",
  isoDate: "2026-11-14",
  dishes: [
    { id: "chicken", name: "Pollo", price: 5500, stock: 3 },
    {
      id: "hipo",
      name: "Hipocalórico",
      price: 5900,
      stock: 1,
      isHipo: true,
      proteinOptions: ["Atún"],
    },
  ],
} as DailyMenu;
beforeEach(() => {
  vi.mocked(useOrderingHours).mockReturnValue(true);
  vi.mocked(getPendingManualOrder).mockReturnValue(null);
  vi.mocked(fetchDailyMenusFromApi).mockResolvedValue([menu]);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("creates a manual order with selected quantities and calculated prices and leaves approval to admin", async () => {
  const created = vi.fn();
  vi.mocked(sendManualOrder).mockResolvedValue({
    _id: "manual",
    validadoPorAdmin: false,
  } as Order);
  render(<ManualOrderDialog onClose={vi.fn()} onCreated={created} />);
  fireEvent.change(screen.getByRole("textbox", { name: /Nombre/ }), {
    target: { value: "Cliente presencial" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /Teléfono/ }), {
    target: { value: "+56912345678" },
  });
  fireEvent.mouseDown(await screen.findByRole("combobox", { name: "Plato 1" }));
  fireEvent.click(screen.getByRole("option", { name: "Pollo" }));
  fireEvent.change(screen.getByRole("spinbutton", { name: "Cantidad 1" }), {
    target: { value: "2" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Crear pedido" }));
  await waitFor(() =>
    expect(sendManualOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        menuId: "menu",
        cliente: "Cliente presencial",
        telefono: "+56912345678",
        total: 11000,
        items: [
          expect.objectContaining({
            platoId: "chicken",
            cantidad: 2,
            precio: 5500,
          }),
        ],
      }),
      "admin",
    ),
  );
  expect(created).toHaveBeenCalledWith(
    expect.objectContaining({ validadoPorAdmin: false }),
  );
});
it("requires a protein for hipo and respects the available stock", async () => {
  render(<ManualOrderDialog onClose={vi.fn()} onCreated={vi.fn()} />);
  fireEvent.change(screen.getByRole("textbox", { name: /Nombre/ }), {
    target: { value: "Cliente" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /Teléfono/ }), {
    target: { value: "+56912345678" },
  });
  fireEvent.mouseDown(await screen.findByRole("combobox", { name: "Plato 1" }));
  fireEvent.click(screen.getByRole("option", { name: "Hipocalórico" }));
  expect(screen.getByRole("button", { name: "Crear pedido" })).toHaveProperty(
    "disabled",
    true,
  );
  fireEvent.mouseDown(screen.getByRole("combobox", { name: /Proteína 1/ }));
  fireEvent.click(screen.getByRole("option", { name: "Atún" }));
  expect(screen.getByRole("button", { name: "Crear pedido" })).toHaveProperty(
    "disabled",
    false,
  );
  fireEvent.change(screen.getByRole("spinbutton", { name: "Cantidad 1" }), {
    target: { value: "2" },
  });
  expect(screen.getByRole("button", { name: "Crear pedido" })).toHaveProperty(
    "disabled",
    true,
  );
});
it("allows recovering an uncertain attempt after closing time with the original payload", async () => {
  const payload = {
    menuId: "old",
    fecha: "2026-11-13",
    cliente: "Pendiente",
    telefono: "+56912345678",
    total: 5500,
    items: [
      {
        platoId: "old-dish",
        nombre: "Pollo",
        cantidad: 1,
        precio: 5500,
        selecciones: { postre: "Postre" },
      },
    ],
  };
  vi.mocked(getPendingManualOrder).mockReturnValue({ key: "attempt", payload });
  vi.mocked(useOrderingHours).mockReturnValue(false);
  vi.mocked(sendManualOrder).mockResolvedValue({ _id: "recovered" } as Order);
  render(<ManualOrderDialog onClose={vi.fn()} onCreated={vi.fn()} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmar envío pendiente" }),
  );
  await waitFor(() =>
    expect(sendManualOrder).toHaveBeenCalledWith(payload, "admin"),
  );
  expect(fetchDailyMenusFromApi).not.toHaveBeenCalled();
});
