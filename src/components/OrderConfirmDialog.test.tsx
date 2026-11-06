import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CustomerSessionContext,
  type CustomerSession,
} from "../context/customer-session";
import { OrderConfirmDialog } from "./OrderConfirmDialog";
import type { OrderPayload } from "../types/order";
import type { DailyMenu } from "../types/menu";
import type { CartItem } from "../types/cart";
vi.mock("./GoogleCustomerAccess", () => ({
  GoogleCustomerAccess: () => <div>Continuar con Google</div>,
}));
const pending: OrderPayload = {
  menuId: "menu",
  fecha: "2026-11-05",
  cliente: "Cliente",
  telefono: "+56900000000",
  total: 5500,
  items: [],
};
const session: CustomerSession = {
  access_token: "token",
  customer: {
    googleId: "user",
    name: "Cliente Google",
    email: "c@example.test",
  },
};
const menu: DailyMenu = {
  id: "menu",
  date: "05/11/26",
  isoDate: "2026-11-05",
  dishes: [],
  includes: { salad: { options: [] }, bread: "", dessert: { options: [] } },
};
const item: CartItem = {
  key: "one",
  dish: { id: "dish", name: "Plato", price: 5500 },
  quantity: 1,
  selections: { dessert: "Postre del día" },
  visibility: { protein: false, salad: false, dessert: false },
};
function checkout(
  customer: CustomerSession | null = session,
  submit = vi.fn().mockResolvedValue(undefined),
) {
  return (
    <CustomerSessionContext.Provider
      value={{ session: customer, signIn: vi.fn(), signOut: vi.fn() }}
    >
      <OrderConfirmDialog
        open
        menu={menu}
        cartItems={[item]}
        totalPrice={5500}
        onClose={vi.fn()}
        onSubmit={submit}
      />
    </CustomerSessionContext.Provider>
  );
}
afterEach(() => {
  cleanup();
  sessionStorage.clear();
});
describe("Progressive Google checkout", () => {
  it("shows Google before contact fields and prevents anonymous sending", () => {
    const { rerender } = render(checkout(null));
    expect(
      screen.getByRole("button", { name: "Enviar pedido · $5.500" }),
    ).toHaveProperty("disabled", true);
    expect(screen.getByText("Continuar con Google")).toBeDefined();
    expect(screen.queryByRole("textbox", { name: /Nombre/ })).toBeNull();
    expect(screen.queryByRole("textbox", { name: /Teléfono/ })).toBeNull();
    rerender(checkout());
    expect(screen.getByRole("textbox", { name: /Nombre/ })).toHaveProperty(
      "value",
      "Cliente Google",
    );
    expect(screen.getByRole("textbox", { name: /Teléfono/ })).toBeDefined();
  });
  it("focuses invalid phone and preserves the order until contact is valid", () => {
    const submit = vi.fn();
    render(checkout(session, submit));
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar pedido · $5.500" }),
    );
    expect(screen.getByText(/Ingresa un teléfono válido/)).toBeDefined();
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: /Teléfono/ }),
    );
    expect(submit).not.toHaveBeenCalled();
  });
  it("normalizes phone, submits once and prevents closing while sending", async () => {
    let complete!: () => void;
    const submit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    render(checkout(session, submit));
    fireEvent.change(screen.getByRole("textbox", { name: /Teléfono/ }), {
      target: { value: "9 1234 5678" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar pedido · $5.500" }),
    );
    expect(
      screen.getByRole("button", { name: "Enviando pedido…" }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("button", { name: "Cerrar confirmación del pedido" }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("button", { name: "Volver al pedido" }),
    ).toHaveProperty("disabled", true);
    expect(submit).toHaveBeenCalledOnce();
    expect(submit.mock.calls[0]).toEqual([
      expect.objectContaining({
        cliente: "Cliente Google",
        telefono: "+56912345678",
        total: 5500,
      }),
    ]);
    complete();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Enviar pedido · $5.500" }),
      ).toHaveProperty("disabled", false),
    );
  });
  it("keeps contact data when closing and reopening the dialog", () => {
    const view = render(checkout());
    fireEvent.change(screen.getByRole("textbox", { name: /Teléfono/ }), {
      target: { value: "+56912345678" },
    });
    view.unmount();
    render(checkout());
    expect(screen.getByRole("textbox", { name: /Teléfono/ })).toHaveProperty(
      "value",
      "+56912345678",
    );
  });
  it("keeps a pending order immutable and allows recovery without a menu", () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(
      <CustomerSessionContext.Provider
        value={{ session, signIn: vi.fn(), signOut: vi.fn() }}
      >
        <OrderConfirmDialog
          open
          pendingPayload={pending}
          cartItems={[]}
          totalPrice={5500}
          onClose={vi.fn()}
          onSubmit={submit}
        />
      </CustomerSessionContext.Provider>,
    );
    expect(screen.getByRole("textbox", { name: /Nombre/ })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("textbox", { name: /Teléfono/ })).toHaveProperty(
      "disabled",
      true,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar el mismo envío" }),
    );
    expect(submit).toHaveBeenCalledWith(pending);
  });
});
