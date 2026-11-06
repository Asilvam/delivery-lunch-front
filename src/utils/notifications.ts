import Swal from "sweetalert2";
import { brandColors } from "../theme/brandColors";
import "./notifications.css";

export const TOAST_DURATION_MS = 3000;
export const STAFF_TOAST_DURATION_MS = 2000;
export const STAFF_ACTION_DURATION_MS = 1000;
const shared = {
  background: brandColors.surface,
  color: brandColors.ink,
  confirmButtonColor: brandColors.raspberry,
  cancelButtonColor: brandColors.muted,
  customClass: {
    container: "brand-alert-container",
    popup: "brand-alert-popup",
    confirmButton: "brand-alert-button",
    cancelButton: "brand-alert-button",
    closeButton: "brand-alert-close",
  },
};
const toast = {
  ...shared,
  toast: true,
  position: "top-end" as const,
  showConfirmButton: false,
  showCloseButton: true,
  closeButtonAriaLabel: "Cerrar aviso",
  timerProgressBar: true,
};
/** Avisos del cliente: máximo tres segundos. */
export const userToast = Swal.mixin({ ...toast, timer: TOAST_DURATION_MS });
/** Avisos del personal: máximo dos segundos. */
export const staffToast = Swal.mixin({
  ...toast,
  timer: STAFF_TOAST_DURATION_MS,
});
/** Las decisiones y los comprobantes esperan al usuario; no expiran. */
export const appAlert = Swal.mixin({
  ...shared,
  confirmButtonText: "Entendido",
  cancelButtonText: "Volver",
  reverseButtons: true,
  focusCancel: true,
  returnFocus: false,
});
