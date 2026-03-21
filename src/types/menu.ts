// src/types/menu.ts

export interface Dish {
    id: string;
    name: string;
    price: number; // Ya lo teníamos, pero asegúrate de usarlo
    imageUrl?: string; // Nuevo campo para la imagen del plato
    options?: string[];
}

// DailyMenu permanece igual
export interface DailyMenu {
    date: string;
    includes: {
        salad: string;
        bread: string;
        dessert: string;
    };
    dishes: Dish[];
}