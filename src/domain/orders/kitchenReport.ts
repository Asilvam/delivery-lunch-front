import { OrderStatus, type Order } from "../../types/order";
const chileDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
});
export const getChileDate = (date = new Date()): string =>
  chileDate.format(date);

/** Misma selección del historial de cocina: entregados/cancelados actualizados hoy en Chile. */
export function getKitchenCompletedOrders(
  orders: Order[],
  now = new Date(),
): Order[] {
  const today = getChileDate(now);
  return orders.filter((order) => {
    if (
      order.estado !== OrderStatus.ENTREGADO &&
      order.estado !== OrderStatus.CANCELADO
    )
      return false;
    const updated = new Date(order.updatedAt);
    return !Number.isNaN(updated.getTime()) && getChileDate(updated) === today;
  });
}
