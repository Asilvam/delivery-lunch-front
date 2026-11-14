import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { Order } from "../../types/order";
import StaffNavigation from "./StaffNavigation";
let mobile = false;
let role = "admin";
let connected = true;
const orders = [
  { _id: "pending", estado: "pendiente", validadoPorAdmin: false },
  { _id: "approved", estado: "pendiente", validadoPorAdmin: true },
  { _id: "done", estado: "entregado", validadoPorAdmin: false },
] as Order[];
vi.mock("@mui/material", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mui/material")>()),
  useMediaQuery: () => mobile,
}));
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ role, logout: vi.fn() }),
}));
vi.mock("../../hooks/usePendingOrders", () => ({
  usePendingOrders: () => ({ orders, connected, error: null }),
}));
beforeEach(() => {
  mobile = false;
  role = "admin";
  connected = true;
});
afterEach(cleanup);
it("orders the five sections by daily work and highlights only the active route", () => {
  render(
    <MemoryRouter initialEntries={["/admin/menus"]}>
      <StaffNavigation />
    </MemoryRouter>,
  );
  const links = within(
    screen.getByRole("navigation", { name: "Navegación del personal" }),
  ).getAllByRole("link");
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "/admin",
    "/cocina",
    "/admin/menus",
    "/admin/clientes",
    "/dashboard",
  ]);
  expect(
    links
      .filter((link) => link.getAttribute("aria-current") === "page")
      .map((link) => link.textContent),
  ).toEqual(["Menús"]);
  expect(
    screen.getByRole("link", { name: "Pedidos, 1 pendiente de aprobación" }),
  ).toBeDefined();
});
it("uses the same five accessible destinations in the mobile bottom bar", () => {
  mobile = true;
  render(
    <MemoryRouter initialEntries={["/cocina"]}>
      <StaffNavigation />
    </MemoryRouter>,
  );
  expect(
    screen.queryByRole("navigation", { name: "Navegación del personal" }),
  ).toBeNull();
  const links = within(
    screen.getByRole("navigation", { name: "Navegación móvil del personal" }),
  ).getAllByRole("link");
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "/admin",
    "/cocina",
    "/admin/menus",
    "/admin/clientes",
    "/dashboard",
  ]);
  expect(
    screen.getByRole("link", { name: "Cocina" }).getAttribute("aria-current"),
  ).toBe("page");
});
it("does not present an unchecked count while reconnecting", () => {
  connected = false;
  render(
    <MemoryRouter>
      <StaffNavigation />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "Pedidos" })).toBeDefined();
  expect(
    screen.queryByRole("link", { name: /pendiente de aprobación/ }),
  ).toBeNull();
});
it("keeps kitchen accounts limited to their existing destination", () => {
  role = "kitchen";
  mobile = true;
  render(
    <MemoryRouter initialEntries={["/cocina"]}>
      <StaffNavigation />
    </MemoryRouter>,
  );
  expect(
    within(
      screen.getByRole("navigation", { name: "Navegación del personal" }),
    ).getAllByRole("link"),
  ).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Cocina" })).toBeDefined();
  expect(screen.queryByRole("link", { name: /Pedidos/ })).toBeNull();
});
