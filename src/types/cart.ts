// src/types/cart.ts
import type { Dish, DishSelections, DishSelectionVisibility } from './menu';

export interface CartItem {
    key: string;
    dish: Dish;
    quantity: number;
    selections: DishSelections;
    visibility: DishSelectionVisibility;
}
