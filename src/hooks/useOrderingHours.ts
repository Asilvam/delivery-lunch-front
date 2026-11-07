import { useEffect, useState } from "react";
import { isOrderingOpen } from "../domain/orders/orderingHours";

export function useOrderingHours() {
  const [open, setOpen] = useState(isOrderingOpen);
  useEffect(() => {
    const refresh = () => setOpen(isOrderingOpen());
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return open;
}
