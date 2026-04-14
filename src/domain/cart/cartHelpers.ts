import type { DishSelections } from '../../types/menu';

export const buildCartItemKey = (
  dishId: string,
  selections: DishSelections,
): string =>
  `${dishId}::${selections.protein ?? ''}::${selections.salad ?? ''}::${selections.dessert}`;
