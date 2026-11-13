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
    description?: string;
    price: number;
    imageUrl?: string;
    isHipo?: boolean;
    proteinOptions?: string[];
    stock?: number;
}

export interface DailyMenu {
    id: string;
    date: string;     // UI format: DD/MM/YY
    basePrice?: number;
    isoDate: string;  // ISO format: YYYY-MM-DD (for API payloads)
    expiresAt?: string;
    includes: DailyMenuIncludes;
    dishes: Dish[];
}

export type BackendSelectableText = string | string[] | null | undefined;

export interface BackendDishDto {
    _id: string;
    retirado?: boolean;
    tienePedidos?: boolean;
    imagenPublicId?: string;
    nombre: string;
    descripcion?: string;
    catalogoId?: string;
    precioEspecial?: number | null;
    stockInicial?: number;
    precio: number;
    imagen_url?: string | null;
    opciones?: string[] | null;
    es_hipo?: boolean;
    stock?: number | null;
}

export interface BackendDailyMenuDto {
    _id: string;
    fecha: string;
    venceEn?: string;
    estado?: "borrador" | "publicado";
    precioBase?: number;
    updatedAt?: string;
    ensalada: BackendSelectableText;
    pan: string;
    postre: BackendSelectableText;
    platos: BackendDishDto[];
}

export type BackendMenuResponseDto = BackendDailyMenuDto[];
