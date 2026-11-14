import { useContext } from "react";
import { PendingOrdersContext } from "../context/pending-orders";
export function usePendingOrders() {
  const context = useContext(PendingOrdersContext);
  if (!context) throw new Error("Falta StaffOrdersLayout");
  return context;
}
