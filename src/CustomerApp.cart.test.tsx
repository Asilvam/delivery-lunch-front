import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  MemoryRouter,
  Route,
  Routes,
  useOutletContext,
} from "react-router-dom";
import CustomerApp from "./CustomerApp";
import { CustomerSessionContext } from "./context/customer-session";
import type { CartItem } from "./types/cart";
import type { DailyMenu, Dish } from "./types/menu";
import type { OrderPayload } from "./types/order";
import { cartForMenu, CART_STORAGE_KEY } from "./domain/cart/menuCart";
import { fetchDailyMenus } from "./api/menu";
import { sendOrder } from "./api/order";
vi.mock("./api/menu", () => ({ fetchDailyMenus: vi.fn() }));
vi.mock("./api/order", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api/order")>()),
  sendOrder: vi.fn(),
}));
vi.mock("./components/GoogleCustomerAccess", () => ({
  GoogleCustomerAccess: () => <span>Google</span>,
}));
vi.mock("./components/OrderReceiptDialog", () => ({
  OrderReceiptDialog: () => <div>Comprobante</div>,
}));
vi.mock("./utils/notifications", () => ({ appAlert: { close: vi.fn() } }));
vi.mock("./utils/feedback", () => ({
  userAlert: { fire: vi.fn() },
  showAddToCartFeedback: vi.fn(),
  showStockLimitFeedback: vi.fn(),
  triggerCompletionFeedback: vi.fn(),
}));
const item: CartItem = {
  key: "dish",
  dish: { id: "dish", name: "Plato", price: 5500, stock: 20 },
  quantity: 1,
  selections: { dessert: "Postre del día" },
  visibility: { protein: false, salad: false, dessert: false },
};
const menu: DailyMenu = {
  id: "menu",
  date: "13/11/26",
  isoDate: "2026-11-13",
  expiresAt: "2026-11-13T19:00:00Z",
  dishes: [item.dish],
  includes: { salad: { options: [] }, bread: "", dessert: { options: [] } },
};
const session = {
  access_token: "token",
  customer: {
    googleId: "customer",
    name: "Cliente",
    email: "cliente@example.test",
  },
};
function MenuHarness() {
  const { selectedMenu, cartItems, handleAddToCart } = useOutletContext<{
    selectedMenu?: DailyMenu;
    cartItems: CartItem[];
    handleAddToCart: (
      dish: Dish,
      selections: CartItem["selections"],
      visibility: CartItem["visibility"],
    ) => void;
  }>();
  return (
    <>
      <span data-testid="menu-id">{selectedMenu?.id}</span>
      <span data-testid="cart-size">{cartItems.length}</span>
      <button
        onClick={() =>
          handleAddToCart(
            selectedMenu!.dishes[0],
            item.selections,
            item.visibility,
          )
        }
      >
        Elegir plato
      </button>
    </>
  );
}
function app() {
  return render(
    <CustomerSessionContext.Provider
      value={{
        session,
        signIn: vi.fn(),
        signOut: vi.fn(),
        restoring: false,
        sessionError: null,
        refreshSession: vi.fn().mockResolvedValue(session),
        getSession: vi.fn().mockResolvedValue(session),
      }}
    >
      <MemoryRouter initialEntries={["/menu"]}>
        <Routes>
          <Route element={<CustomerApp />}>
            <Route path="/menu" element={<MenuHarness />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </CustomerSessionContext.Provider>,
  );
}
async function load() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-13T18:59:57Z"));
  vi.mocked(fetchDailyMenus).mockResolvedValue([menu]);
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.useRealTimers();
});
it("binds a new selection, then blocks the open checkout at its deadline", async () => {
  app();
  await load();
  fireEvent.click(screen.getByText("Elegir plato"));
  expect(JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY)!)).toMatchObject({
    menuId: "menu",
    fecha: menu.isoDate,
    venceEn: menu.expiresAt,
    items: [{ quantity: 1 }],
  });
  fireEvent.click(screen.getByLabelText("Abrir mi pedido"));
  fireEvent.click(screen.getByText("Continuar a confirmar"));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  fireEvent.change(screen.getByRole("textbox", { name: /Teléfono/ }), {
    target: { value: "+56912345678" },
  });
  // No interval tick: the submit handler must independently check the current time.
  vi.setSystemTime(new Date(menu.expiresAt!));
  fireEvent.click(
    screen.getByRole("button", { name: "Enviar pedido · $5.500" }),
  );
  expect(sendOrder).not.toHaveBeenCalled();
  await load();
  expect(screen.getByText(/Tu carrito venció/)).toBeDefined();
  expect(
    screen.getByRole("button", { name: "Enviar pedido · $5.500" }),
  ).toHaveProperty("disabled", true);
});
it("retains yesterday's cart after reload and clears it only on explicit restart", async () => {
  sessionStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(cartForMenu(menu, [item])),
  );
  vi.setSystemTime(new Date("2026-11-14T11:00:00Z"));
  const tomorrow = {
    ...menu,
    id: "next-menu",
    isoDate: "2026-11-14",
    expiresAt: "2026-11-14T19:00:00Z",
    dishes: [{ ...item.dish, id: "next-dish" }],
  };
  vi.mocked(fetchDailyMenus).mockResolvedValue([tomorrow]);
  app();
  await load();
  fireEvent.click(screen.getByLabelText("Abrir mi pedido"));
  expect(screen.getByText(/Tu carrito venció/)).toBeDefined();
  expect(screen.getByText("Continuar a confirmar")).toHaveProperty(
    "disabled",
    true,
  );
  expect(JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY)!).menuId).toBe(
    "menu",
  );
  fireEvent.click(screen.getByText("Empezar un nuevo pedido"));
  await load();
  expect(screen.getByTestId("cart-size").textContent).toBe("0");
  fireEvent.click(screen.getByText("Elegir plato"));
  expect(JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY)!)).toMatchObject({
    menuId: "next-menu",
    items: [{ dish: { id: "next-dish" } }],
  });
});
it("recovers an uncertain original attempt after expiry without changing its payload", async () => {
  const payload: OrderPayload = {
    menuId: menu.id,
    fecha: menu.isoDate,
    cliente: "Cliente",
    telefono: "+56912345678",
    total: 5500,
    items: [
      {
        platoId: "dish",
        nombre: "Plato",
        cantidad: 1,
        precio: 5500,
        selecciones: { postre: "Postre del día" },
      },
    ],
  };
  const attempt = {
    key: "original-key",
    googleId: session.customer.googleId,
    payload,
  };
  sessionStorage.setItem("pending_order_attempt", JSON.stringify(attempt));
  sessionStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(cartForMenu(menu, [item])),
  );
  vi.setSystemTime(new Date("2026-11-14T01:00:00Z"));
  vi.mocked(sendOrder).mockRejectedValueOnce(
    new Error("Network still unavailable"),
  );
  app();
  await load();
  fireEvent.click(screen.getByText("Confirmar resultado"));
  fireEvent.click(
    screen.getByRole("button", { name: "Reintentar el mismo envío" }),
  );
  await act(async () => {});
  expect(sendOrder).toHaveBeenCalledWith(
    payload,
    session.access_token,
    session.customer.googleId,
  );
  expect(JSON.parse(sessionStorage.getItem("pending_order_attempt")!)).toEqual(
    attempt,
  );
  expect(JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY)!)).toEqual(
    cartForMenu(menu, [item]),
  );
});
