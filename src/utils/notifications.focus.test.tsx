import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Button, Dialog } from "@mui/material";
import { useSweetAlertOpen } from "../hooks/useSweetAlertOpen";
import { userAlert } from "./notifications";
afterEach(async () => {
  userAlert.close();
  cleanup();
  await vi.runOnlyPendingTimersAsync();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("keeps keyboard focus in a timed SweetAlert while checkout is open", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("scrollTo", vi.fn());
  function Checkout() {
    const alertOpen = useSweetAlertOpen();
    return (
      <Dialog open disableEnforceFocus={alertOpen}>
        <Button
          onClick={() =>
            void userAlert.fire({ title: "Aviso de pedido", animation: false })
          }
        >
          Avisar
        </Button>
      </Dialog>
    );
  }
  render(<Checkout />);
  fireEvent.click(screen.getByText("Avisar"));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  expect(userAlert.getPopup()?.contains(document.activeElement)).toBe(true);
});

it("returns focus to the triggering control when the timed alert closes", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("scrollTo", vi.fn());
  render(
    <Button
      onClick={() =>
        void userAlert.fire({ title: "Agregado", animation: false })
      }
    >
      Agregar
    </Button>,
  );
  const button = screen.getByText("Agregar");
  button.focus();
  fireEvent.click(button);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3100);
  });
  expect(document.activeElement).toBe(button);
});
