import axios from 'axios';
import type { BackendMenuResponseDto, DailyMenu } from '../../types/menu';
import { mapBackendResponseToDailyMenus } from '../mappers/menu.mapper';

export const fetchDailyMenusFromApi = async (): Promise<DailyMenu[]> => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!baseUrl) throw new Error('VITE_API_BASE_URL no configurado');

  const url = `${baseUrl}/menu/today`;

  const response = await axios.get<BackendMenuResponseDto>(url, {
    timeout: 10000,
  });

  return mapBackendResponseToDailyMenus(response.data);
};
