import { useSyncExternalStore } from "react";
import { isAlertOpen, subscribeToAlerts } from "../utils/alertFocus";
/** Let the top SweetAlert own keyboard focus while a MUI modal remains underneath. */
export function useSweetAlertOpen() {
  return useSyncExternalStore(subscribeToAlerts, isAlertOpen, () => false);
}
