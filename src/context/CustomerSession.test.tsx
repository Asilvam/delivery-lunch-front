import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { CustomerSessionProvider } from "./CustomerSession";
import { useCustomerSession } from "../hooks/useCustomerSession";
import {
  loginCustomer,
  logoutCustomer,
  restoreCustomerSession,
} from "../data/services/customerSessionApi.service";
import type { CustomerSession } from "./customer-session";
vi.mock("../data/services/customerSessionApi.service", () => ({
  loginCustomer: vi.fn(),
  logoutCustomer: vi.fn(),
  restoreCustomerSession: vi.fn(),
}));
function remembered(name = "Cliente", expiresIn = 900): CustomerSession {
  const claims = btoa(
    JSON.stringify({
      role: "customer",
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    }),
  );
  return {
    access_token: `header.${claims}.signature`,
    customer: {
      googleId: "customer",
      name,
      email: "c@example.test",
      phone: "+56911111111",
    },
  };
}
function Consumer() {
  const { session, restoring, sessionError, getSession, signIn, signOut } =
    useCustomerSession();
  return (
    <>
      <span>
        {restoring ? "Recuperando" : session?.customer.name || "Sin sesión"}
      </span>
      <span>{sessionError}</span>
      <button onClick={() => void getSession().catch(() => {})}>
        Comprobar
      </button>
      <button onClick={() => void signIn("google").catch(() => {})}>
        Google
      </button>
      <button onClick={() => void signOut().catch(() => {})}>Cerrar</button>
    </>
  );
}
const app = () =>
  render(
    <CustomerSessionProvider>
      <Consumer />
    </CustomerSessionProvider>,
  );
beforeEach(() => {
  vi.mocked(restoreCustomerSession).mockResolvedValue(remembered());
  vi.mocked(logoutCustomer).mockResolvedValue();
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.useRealTimers();
  vi.resetAllMocks();
});
it("recovers a customer after reopening without another Google login and keeps tokens out of browser storage", async () => {
  sessionStorage.setItem("customer_session", "legacy-token");
  const first = app();
  await screen.findByText("Cliente");
  expect(sessionStorage.getItem("customer_session")).toBeNull();
  expect(sessionStorage.length).toBe(0);
  first.unmount();
  app();
  await screen.findByText("Cliente");
  expect(restoreCustomerSession).toHaveBeenCalledTimes(2);
  expect(loginCustomer).not.toHaveBeenCalled();
});
it("renews the short access token while keeping the remembered identity", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-13T15:00:00Z"));
  vi.mocked(restoreCustomerSession)
    .mockResolvedValueOnce(remembered())
    .mockImplementation(async () => remembered("Renovado"));
  app();
  await act(async () => {});
  expect(screen.getByText("Cliente")).toBeDefined();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(870000);
  });
  expect(screen.getByText("Renovado")).toBeDefined();
  expect(loginCustomer).not.toHaveBeenCalled();
});
it("shares one renewal across simultaneous checkout attempts", async () => {
  vi.mocked(restoreCustomerSession).mockResolvedValueOnce(null);
  app();
  await screen.findByText("Sin sesión");
  let complete!: (value: CustomerSession) => void;
  vi.mocked(restoreCustomerSession).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  fireEvent.click(screen.getByText("Comprobar"));
  fireEvent.click(screen.getByText("Comprobar"));
  expect(restoreCustomerSession).toHaveBeenCalledTimes(2);
  await act(async () => complete(remembered()));
  expect(screen.getByText("Cliente")).toBeDefined();
});
it("clears a blocked identity without deleting the cart or uncertain order attempt", async () => {
  sessionStorage.setItem("lunch_cart", "saved-cart");
  sessionStorage.setItem("pending_order_attempt", "saved-attempt");
  const error = new AxiosError(
    "blocked",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status: 403,
      statusText: "Forbidden",
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { code: "CUSTOMER_BLOCKED", message: "Tu cuenta está bloqueada." },
    },
  );
  vi.mocked(restoreCustomerSession).mockRejectedValueOnce(error);
  app();
  await screen.findByText("Tu cuenta está bloqueada.");
  expect(screen.getByText("Sin sesión")).toBeDefined();
  expect(sessionStorage.getItem("lunch_cart")).toBe("saved-cart");
  expect(sessionStorage.getItem("pending_order_attempt")).toBe("saved-attempt");
});
it("does not restore a late identity after logout and waits for server revocation", async () => {
  let complete!: (value: CustomerSession) => void;
  vi.mocked(restoreCustomerSession).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  app();
  fireEvent.click(screen.getByText("Cerrar"));
  await act(async () => complete(remembered()));
  await waitFor(() => expect(logoutCustomer).toHaveBeenCalledOnce());
  expect(screen.getByText("Sin sesión")).toBeDefined();
  expect(screen.queryByText("Cliente")).toBeNull();
});

it("keeps popup focus events from overwriting a Google login still in flight", async () => {
  vi.mocked(restoreCustomerSession).mockResolvedValueOnce(null);
  app();
  await screen.findByText("Sin sesión");
  let complete!: (value: CustomerSession) => void;
  vi.mocked(loginCustomer).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  fireEvent.click(screen.getByText("Google"));
  await act(async () => {});
  fireEvent(window, new Event("focus"));
  expect(restoreCustomerSession).toHaveBeenCalledTimes(1);
  await act(async () => complete(remembered("Cuenta elegida")));
  expect(screen.getByText("Cuenta elegida")).toBeDefined();
});
