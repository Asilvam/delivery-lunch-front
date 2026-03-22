// src/types/menu.ts

export interface SelectableMenuOption {
    defaultValue: string;
    options: string[];
}

export interface DailyMenuIncludes {
    salad: SelectableMenuOption;
    bread: string;
    dessert: SelectableMenuOption;
}

export interface DishSelections {
    protein?: string;
    salad: string;
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
}

export interface DailyMenu {
    date: string;
    includes: DailyMenuIncludes;
    dishes: Dish[];
}

export type BackendSelectableText = string | string[] | null | undefined;

export interface BackendDishDto {
    id: string;
    nombre: string;
    precio: number;
    imagen_url?: string | null;
    opciones?: string[] | null;
    es_hipo?: boolean;
}

export interface BackendDailyMenuDto {
    fecha: string;
    ensalada: BackendSelectableText;
    pan: string;
    postre: BackendSelectableText;
    platos: BackendDishDto[];
}

export interface BackendMenuResponseDto {
    data: BackendDailyMenuDto[];
}
