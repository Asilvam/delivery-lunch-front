let returnTarget: HTMLElement | null = null;
const listeners = new Set<() => void>();
const publish = () => listeners.forEach((listener) => listener());
export const subscribeToAlerts = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const isAlertOpen = () =>
  typeof document !== "undefined" &&
  document.querySelector(".swal2-popup") !== null;
export function openingAlert(popup: HTMLElement) {
  returnTarget =
    popup.classList.contains("brand-timed-alert") &&
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  // Release focus before SweetAlert hides the surrounding MUI dialog.
  if (document.activeElement instanceof HTMLElement)
    document.activeElement.blur();
  publish();
  queueMicrotask(() => {
    if (popup.isConnected && !popup.contains(document.activeElement))
      popup.focus();
  });
}
export function closedAlert() {
  publish();
  if (isAlertOpen()) return;
  const target = returnTarget;
  returnTarget = null;
  queueMicrotask(() => {
    if (
      !isAlertOpen() &&
      target?.isConnected &&
      !target.closest('[aria-hidden="true"]')
    )
      target.focus({ preventScroll: true });
  });
}
