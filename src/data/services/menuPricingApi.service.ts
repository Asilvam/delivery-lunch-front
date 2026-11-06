import axios from "axios";
import type { BackendDailyMenuDto } from "../../types/menu";

export interface MenuPricesInput {
  precioBase: number;
  expectedUpdatedAt?: string;
  platos: { id: string; precio: number }[];
}
export async function fetchMenuForPricing(
  date: string,
  signal?: AbortSignal,
): Promise<BackendDailyMenuDto | null> {
  try {
    const { data } = await axios.get<BackendDailyMenuDto[]>(
      `${import.meta.env.VITE_API_BASE_URL}/menu/${date}`,
      { signal, timeout: 10000 },
    );
    return data[0] ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404)
      return null;
    throw error;
  }
}
export async function saveMenuPrices(
  id: string,
  input: MenuPricesInput,
  token: string,
): Promise<BackendDailyMenuDto> {
  const { data } = await axios.patch<BackendDailyMenuDto>(
    `${import.meta.env.VITE_API_BASE_URL}/menu/${id}/prices`,
    input,
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    },
  );
  return data;
}
