import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { GoogleCustomerAccess } from "./GoogleCustomerAccess";
import { useCustomerSession } from "../hooks/useCustomerSession";
import { userToast } from "../utils/notifications";
vi.mock("../utils/notifications", () => ({ userToast: { fire: vi.fn() } }));
vi.mock("../hooks/useCustomerSession", () => ({ useCustomerSession: vi.fn() }));
vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: ReactNode }) => children,
  GoogleLogin: ({
    onSuccess,
  }: {
    onSuccess: (response: { credential: string }) => Promise<void>;
  }) => (
    <button onClick={() => void onSuccess({ credential: "test-id-token" })}>
      Continuar con Google
    </button>
  ),
}));
const signIn = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "public-test-client");
  vi.mocked(useCustomerSession).mockReturnValue({
    session: null,
    signIn,
    signOut: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});
it("shows a verification failure through the client toast while the checkout is open", async () => {
  signIn.mockRejectedValueOnce(new Error("verification"));
  render(<GoogleCustomerAccess />);
  fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }));
  await waitFor(() =>
    expect(userToast.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "error",
        title: expect.stringContaining("No pudimos verificar tu cuenta"),
      }),
    ),
  );
  expect(
    screen.getByRole("button", { name: "Continuar con Google" }),
  ).toBeDefined();
});
it("does not show a late error after closing checkout", async () => {
  let reject!: (error: unknown) => void;
  signIn.mockImplementationOnce(
    () =>
      new Promise((_resolve, no) => {
        reject = no;
      }),
  );
  const view = render(<GoogleCustomerAccess />);
  fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }));
  expect(screen.getByText("Verificando tu cuenta…")).toBeDefined();
  view.unmount();
  await act(async () => {
    reject(new Error("late verification failure"));
  });
  expect(userToast.fire).not.toHaveBeenCalled();
});
