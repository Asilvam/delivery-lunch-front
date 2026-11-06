import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import LoginPage from "./LoginPage";
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ role: null, login: vi.fn() }),
}));
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    isAxiosError: (error: { isAxiosError?: boolean }) =>
      Boolean(error?.isAxiosError),
  },
}));
function setup() {
  render(
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
    await screen.findByText(
      "No pudimos conectar con el servidor. Intenta nuevamente.",
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
