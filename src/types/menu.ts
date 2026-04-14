// src/types/menu.ts

export interface SelectableMenuOption {
    options: string[];
}

export interface DailyMenuIncludes {
    salad: SelectableMenuOption;
    bread: string;
    dessert: SelectableMenuOption;
}

export interface DishSelections {
    protein?: string;
    salad?: string;
    dessert: string;
}

export interface DishSelectionVisibility {
    protein: boolean;
    salad: boolean;
    dessert: boolean;
}

export interface Dish {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    isHipo?: boolean;
    proteinOptions?: string[];
    stock?: number;
}

export interface DailyMenu {
    id: string;
    date: string;     // UI format: DD/MM/YY
    isoDate: string;  // ISO format: YYYY-MM-DD (for API payloads)
    includes: DailyMenuIncludes;
    dishes: Dish[];
}

export type BackendSelectableText = string | string[] | null | undefined;

export interface BackendDishDto {
    _id: string;
    nombre: string;
    precio: number;
    imagen_url?: string | null;
    opciones?: string[] | null;
    es_hipo?: boolean;
    stock?: number | null;
}

export interface BackendDailyMenuDto {
    _id: string;
    fecha: string;
    ensalada: BackendSelectableText;
    pan: string;
    postre: BackendSelectableText;
    platos: BackendDishDto[];
}

export type BackendMenuResponseDto = BackendDailyMenuDto[];
