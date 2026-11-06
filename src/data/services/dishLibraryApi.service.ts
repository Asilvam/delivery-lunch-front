import axios from "axios";
import type { BackendDailyMenuDto } from "../../types/menu";

export interface LibraryDish {
  _id: string;
  clave: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  imagenUrl: string;
  imagenPublicId: string;
  esHipo: boolean;
  opciones: string[];
  activo: boolean;
  notaInterna: string;
  updatedAt?: string;
}
export type LibraryDishInput = Omit<LibraryDish, "_id" | "clave" | "updatedAt">;
export interface MenuCompositionInput {
  fecha: string;
  precioBase: number;
  estado: "borrador" | "publicado";
  ensalada: string[];
  pan: string;
  postre: string[];
  platos: {
    catalogoId: string;
    stock: number;
    precioEspecial: number | null;
    opcionesProteina: string[];
  }[];
  expectedUpdatedAt?: string;
}
export interface AdminMenuSummary {
  _id: string;
  fecha: string;
  estado?: "borrador" | "publicado";
  precioBase: number;
  updatedAt?: string;
}
const base = import.meta.env.VITE_API_BASE_URL as string;
const options = (token: string, signal?: AbortSignal) => ({
  headers: { Authorization: `Bearer ${token}` },
  signal,
  timeout: 20000,
});
export const fetchLibrary = async (token: string, signal?: AbortSignal) =>
  (
    await axios.get<LibraryDish[]>(
      `${base}/dish-library`,
      options(token, signal),
    )
  ).data;
export const importInitialLibrary = async (token: string) =>
  (
    await axios.post<{ agregados: number; existentes: number }>(
      `${base}/dish-library/import-initial`,
      {},
      options(token),
    )
  ).data;
export const saveLibraryDish = async (
  token: string,
  input: LibraryDishInput,
  id?: string,
) =>
  (id
    ? await axios.patch<LibraryDish>(
        `${base}/dish-library/${id}`,
        input,
        options(token),
      )
    : await axios.post<LibraryDish>(
        `${base}/dish-library`,
        input,
        options(token),
      )
  ).data;
export const archiveLibraryDish = async (
  token: string,
  id: string,
  activo: boolean,
) =>
  (
    await axios.patch<LibraryDish>(
      `${base}/dish-library/${id}`,
      { activo },
      options(token),
    )
  ).data;
export async function uploadDishPhoto(token: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return (
    await axios.post<{ url: string; public_id: string }>(
      `${base}/upload/image`,
      form,
      { ...options(token), timeout: 60000 },
    )
  ).data;
}
export const fetchAdminMenus = async (token: string, signal?: AbortSignal) =>
  (
    await axios.get<AdminMenuSummary[]>(
      `${base}/menu/admin`,
      options(token, signal),
    )
  ).data;
export const fetchAdminMenu = async (
  token: string,
  fecha: string,
  signal?: AbortSignal,
) =>
  (
    await axios.get<BackendDailyMenuDto[]>(`${base}/menu/admin`, {
      ...options(token, signal),
      params: { fecha },
    })
  ).data[0] ?? null;
export const saveComposition = async (
  token: string,
  input: MenuCompositionInput,
  id?: string,
) =>
  (id
    ? await axios.patch<BackendDailyMenuDto>(
        `${base}/menu/${id}/composition`,
        input,
        options(token),
      )
    : await axios.post<BackendDailyMenuDto>(
        `${base}/menu/composition`,
        input,
        options(token),
      )
  ).data;
export function libraryError(error: unknown, fallback: string): string {
  const message: unknown = axios.isAxiosError(error)
    ? error.response?.data?.message
    : null;
  return typeof message === "string"
    ? message
    : Array.isArray(message)
      ? message.join(". ")
      : fallback;
}
