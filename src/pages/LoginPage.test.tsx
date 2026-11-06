import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import LoginPage from "./LoginPage";
import { staffToast } from "../utils/notifications";
vi.mock("../utils/notifications", () => ({ staffToast: { fire: vi.fn() } }));
const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ role: null, login: loginMock }),
}));
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    isAxiosError: (error: { isAxiosError?: boolean }) =>
      Boolean(error?.isAxiosError),
  },
}));
function setup() {
  const view = render(
    <MemoryRouter
      initialEntries={[{ pathname: "/login", state: { from: "/cocina" } }]}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cocina" element={<p>Panel de cocina</p>} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText("Usuario", { exact: false }), {
    target: { value: " admin " },
  });
  fireEvent.change(screen.getByLabelText(/^Contraseña/), {
    target: { value: "clave-prueba" },
  });
  return view;
}
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.clearAllMocks();
});
describe("Staff login experience", () => {
  it("allows revealing and hiding the password without changing it", () => {
    setup();
    const field = screen.getByLabelText(/^Contraseña/);
    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(field).toHaveProperty("type", "text");
    expect(field).toHaveProperty("value", "clave-prueba");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(field).toHaveProperty("type", "password");
  });
  it("keeps credentials and explains a connection failure", async () => {
    vi.mocked(axios.post).mockRejectedValueOnce({ isAxiosError: true });
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Entrar a mi panel" }));
    await waitFor(() =>
      expect(staffToast.fire).toHaveBeenCalledWith({
        icon: "error",
        title: "No pudimos conectar con el servidor. Intenta nuevamente.",
      }),
    );
    expect(screen.getByLabelText(/^Contraseña/)).toHaveProperty(
      "value",
      "clave-prueba",
    );
    expect(
      screen.getByRole("button", { name: "Entrar a mi panel" }),
    ).toHaveProperty("disabled", false);
  });
  it("prevents repeated submits while loading and returns to the requested panel", async () => {
    let finish!: (value: unknown) => void;
    vi.mocked(axios.post).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }) as never,
    );
    setup();
    const form = screen
      .getByRole("button", { name: "Entrar a mi panel" })
      .closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Ingresando…" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(vi.mocked(axios.post).mock.calls[0][1]).toEqual({
      username: "admin",
      password: "clave-prueba",
    });
    finish({
      data: {
        access_token: `header.${btoa(JSON.stringify({ role: "admin" }))}.signature`,
      },
    });
    await waitFor(() =>
      expect(screen.getByText("Panel de cocina")).toBeDefined(),
    );
  });
});

it("keeps empty-field validation next to each login input", () => {
  setup();
  fireEvent.change(screen.getByLabelText("Usuario", { exact: false }), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText(/^Contraseña/), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Entrar a mi panel" }));
  expect(screen.getByText("Ingresa tu usuario.")).toBeDefined();
  expect(screen.getByText("Ingresa tu contraseña.")).toBeDefined();
  expect(axios.post).not.toHaveBeenCalled();
  expect(staffToast.fire).not.toHaveBeenCalled();
});
it("shows session expiry through the shared toast once", () => {
  sessionStorage.setItem("staff-session-expired", "1");
  setup();
  expect(staffToast.fire).toHaveBeenCalledWith({
    icon: "info",
    title: "Tu sesión venció",
    text: "Ingresa nuevamente para continuar.",
  });
  expect(sessionStorage.getItem("staff-session-expired")).toBeNull();
});

it.each(["failure", "success"])(
  "ignores a late login %s after leaving the page",
  async (result) => {
    let resolve!: (value: unknown) => void;
    let reject!: (error: unknown) => void;
    vi.mocked(axios.post).mockImplementationOnce(
      () =>
        new Promise((yes, no) => {
          resolve = yes;
          reject = no;
        }),
    );
    const view = setup();
    fireEvent.click(screen.getByRole("button", { name: "Entrar a mi panel" }));
    const signal = vi.mocked(axios.post).mock.calls[0][2]?.signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      if (result === "failure") reject(new Error("late failure"));
      else
        resolve({
          data: {
            access_token: `header.${btoa(JSON.stringify({ role: "admin" }))}.signature`,
          },
        });
    });
    expect(loginMock).not.toHaveBeenCalled();
    expect(staffToast.fire).not.toHaveBeenCalled();
  },
);
