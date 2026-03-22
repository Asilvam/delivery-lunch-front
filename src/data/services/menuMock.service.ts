import type { DailyMenu } from '../../types/menu';
import { backendMenuResponseMock } from '../mocks/menuResponse.mock';
import { mapBackendResponseToDailyMenus } from '../mappers/menu.mapper';
import { fetchDailyMenusFromApi } from './menuApi.service';

const hasApiBaseUrl = () => Boolean(import.meta.env.VITE_API_BASE_URL);

const fetchDailyMenusFromMock = async (delayMs = 300): Promise<DailyMenu[]> => {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return mapBackendResponseToDailyMenus(backendMenuResponseMock);
};

// Conserva el nombre para compatibilidad, pero usa API real si hay VITE_API_BASE_URL.
export const fetchDailyMenusMock = async (delayMs = 300): Promise<DailyMenu[]> => {
  if (!hasApiBaseUrl()) {
    return fetchDailyMenusFromMock(delayMs);
  }

  try {
    return await fetchDailyMenusFromApi();
  } catch (error) {
    console.warn('[menu] Error consultando backend, usando mock local.', error);
    return fetchDailyMenusFromMock(delayMs);
  }
};

