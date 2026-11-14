import { openingAlert, closedAlert } from "./alertFocus";
import Swal from "sweetalert2";
import { brandColors } from "../theme/brandColors";
import "./notifications.css";

export const USER_ALERT_DURATION_MS = 3000;
export const STAFF_ALERT_DURATION_MS = 2000;
export const STAFF_ACTION_DURATION_MS = 1000;
const shared = {
  willOpen: openingAlert,
  didDestroy: closedAlert,
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
const timedAlert = {
  ...shared,
  returnFocus: false,
  toast: false,
  backdrop: true,
  position: "center" as const,
  customClass: {
    ...shared.customClass,
    popup: "brand-alert-popup brand-timed-alert",
  },
  showConfirmButton: false,
  showCloseButton: true,
  closeButtonAriaLabel: "Cerrar aviso",
  timerProgressBar: true,
};
/** Avisos del cliente: máximo tres segundos. */
export const userAlert = Swal.mixin({
  ...timedAlert,
  timer: USER_ALERT_DURATION_MS,
});
/** Avisos del personal: máximo dos segundos. */
export const staffAlert = Swal.mixin({
  ...timedAlert,
  timer: STAFF_ALERT_DURATION_MS,
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
