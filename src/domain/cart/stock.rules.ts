import type { Dish } from '../../types/menu';

export interface CartItemBase {
  dish: Dish;
  quantity: number;
}

/**
 * Suma todas las unidades del carrito que corresponden al mismo plato (dish.id),
 * independientemente de la variante (proteína, ensalada, postre).
 * El stock es TOTAL por plato, no por variante.
 */
export const getDishQuantityInCart = <T extends CartItemBase>(items: T[], dishId: string): number =>
  items
    .filter((item) => item.dish.id === dishId)
    .reduce((total, item) => total + item.quantity, 0);

/**
 * Retorna cuántas unidades quedan disponibles para agregar de un plato.
 * Retorna `undefined` si el plato no tiene stock definido (sin límite).
 * Nunca retorna un valor negativo.
 */
export const getRemainingDishStock = <T extends CartItemBase>(items: T[], dish: Dish): number | undefined => {
  if (typeof dish.stock !== 'number') return undefined;
  return Math.max(dish.stock - getDishQuantityInCart(items, dish.id), 0);
};

/**
 * Determina si se puede agregar una unidad más del plato.
 * - Si dish.stock no está definido → siempre se puede agregar.
 * - Si dish.stock === 0 → agotado, no se puede agregar.
 * - Si remaining === 0 → se alcanzó el límite, no se puede agregar.
 */
export const canAddDish = <T extends CartItemBase>(items: T[], dish: Dish): boolean => {
  if (dish.stock === 0) return false;
  const remaining = getRemainingDishStock(items, dish);
  if (remaining === undefined) return true;
  return remaining > 0;
};

/**
 * Retorna el label descriptivo del stock para mostrar en UI.
 * `null` si no hay stock definido (no se muestra nada).
 */
export const getStockLabel = (dish: Dish, remaining: number | undefined): string | null => {
  if (typeof dish.stock !== 'number') return null;
  if (dish.stock === 0) return 'Agotado';
  if (remaining === 0) return 'Límite alcanzado en tu pedido';
  if (remaining === undefined) return null;
  if (remaining <= 3) return `Solo ${remaining} ${remaining === 1 ? 'unidad disponible' : 'unidades disponibles'}`;
  return `${remaining} disponibles`;
};

