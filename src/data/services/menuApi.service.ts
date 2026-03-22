import axios from 'axios';
import type { BackendMenuResponseDto, DailyMenu } from '../../types/menu';
import { mapBackendResponseToDailyMenus } from '../mappers/menu.mapper';

const normalizePath = (path: string) => {
  if (!path) return '/menus';
  return path.startsWith('/') ? path : `/${path}`;
};

const buildMenuUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!baseUrl) return null;

  const menusPath = normalizePath((import.meta.env.VITE_MENUS_PATH as string | undefined) ?? '/menus');
  return `${baseUrl.replace(/\/$/, '')}${menusPath}`;
};

export const fetchDailyMenusFromApi = async (): Promise<DailyMenu[]> => {
  const url = buildMenuUrl();
  if (!url) {
    throw new Error('VITE_API_BASE_URL no configurado');
  }

  const response = await axios.get<BackendMenuResponseDto>(url, {
    timeout: 10000,
  });

  return mapBackendResponseToDailyMenus(response.data);
};

