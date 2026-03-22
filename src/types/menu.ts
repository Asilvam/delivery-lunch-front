// src/types/menu.ts

export interface Dish {
    id: string;
    name: string;
    price: number; // Ya lo teníamos, pero asegúrate de usarlo
    imageUrl?: string; // Nuevo campo para la imagen del plato
    options?: string[];
    hasSides?: boolean;
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

// Contrato esperado desde backend (DTO)
export interface BackendDishDto {
    id: string;
    nombre: string;
    precio: number;
    imagen_url?: string | null;
    opciones?: string[] | null;
    es_hipo?: boolean;
}

export interface BackendDailyMenuDto {
    fecha: string; // ISO: yyyy-mm-dd
    ensalada: string;
    pan: string;
    postre: string;
    platos: BackendDishDto[];
}

export interface BackendMenuResponseDto {
    data: BackendDailyMenuDto[];
}
