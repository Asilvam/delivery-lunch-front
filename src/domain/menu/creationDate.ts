import { hasOrderingClosed } from "../orders/orderingHours";
export function earliestMenuDate(now = new Date()): string {
  const today = now.toLocaleDateString("en-CA", {
    timeZone: "America/Santiago",
  });
  const date = new Date(`${today}T12:00:00Z`);
  if (hasOrderingClosed(now)) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
