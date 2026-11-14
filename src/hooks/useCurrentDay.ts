import { useSyncExternalStore } from "react";

const currentDay = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });

function subscribe(refresh: () => void) {
  const timer = window.setInterval(refresh, 1000);
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
}

export function useCurrentDay() {
  return useSyncExternalStore(subscribe, currentDay, currentDay);
}
