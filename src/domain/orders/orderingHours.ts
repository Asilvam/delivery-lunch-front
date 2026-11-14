export const ORDERING_HOURS_MESSAGE = "Pedidos disponibles de 08:00 a 16:00";
const chileHour = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/Santiago",
  hour: "2-digit",
  hourCycle: "h23",
});
export function isOrderingOpen(now = new Date()): boolean {
  const hour = Number(chileHour.format(now));
  return hour >= 8 && hour < 16;
}

export function hasOrderingClosed(now = new Date()): boolean {
  return Number(chileHour.format(now)) >= 16;
}
