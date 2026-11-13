// src/types/cart.ts
import type { Dish, DishSelections, DishSelectionVisibility } from './menu';

export interface CartItem {
    key: string;
    dish: Dish;
    quantity: number;
    selections: DishSelections;
    visibility: DishSelectionVisibility;
}

export interface MenuCart {
    menuId: string | null;
    fecha: string | null;
    venceEn: string | null;
    items: CartItem[];
}
