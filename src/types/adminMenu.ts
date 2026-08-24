export type AdminMenuStatus = "draft" | "published" | "archived";

export interface AdminMenuDish {
  _id: string;
  nombre: string;
  precio: number;
  imagen_url?: string;
  opciones: string[];
  es_hipo: boolean;
  stock: number;
  orden?: number;
}

export interface AdminMenu {
  _id: string;
  fecha: string;
  ensalada: string[];
  pan: string;
  postre: string[];
  status?: AdminMenuStatus;
  platos: AdminMenuDish[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminMenuDishInput {
  id?: string;
  nombre: string;
  precio: number;
  imagen_url?: string;
  opciones: string[];
  es_hipo: boolean;
  stock: number;
}

export interface AdminMenuInput {
  fecha: string;
  ensalada: string[];
  pan: string;
  postre: string[];
  status?: AdminMenuStatus;
  platos: AdminMenuDishInput[];
}

export type AdminMenuUpdateInput = Omit<AdminMenuInput, "fecha">;
