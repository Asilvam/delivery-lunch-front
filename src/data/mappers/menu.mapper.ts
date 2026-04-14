import type {
  BackendDailyMenuDto,
  BackendDishDto,
  BackendMenuResponseDto,
  BackendSelectableText,
  DailyMenu,
  Dish,
  SelectableMenuOption,
} from '../../types/menu';
import { formatUiDate, getMenuDateTimestamp, parseIsoDate } from '../../shared/utils/date/menuDate';
import { logger } from '../../shared/utils/logger';

const BASE_INCLUDES = {
  ensalada: 'Ensalada surtida',
  postre: 'Postre del dia',
};

const normalizeSelectableValues = (value: BackendSelectableText, fallback: string): string[] => {
  if (Array.isArray(value)) {
    const sanitized = value
      .map((option) => option?.trim())
      .filter((option): option is string => Boolean(option));

    return sanitized.length > 0 ? sanitized : [fallback];
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [fallback];
};

const toSelectableMenuOption = (value: BackendSelectableText, fallback: string): SelectableMenuOption => {
  const options = normalizeSelectableValues(value, fallback);
  return { options };
};

const normalizeStock = (stock: number | null | undefined): number | undefined => {
  if (stock === null || stock === undefined || Number.isNaN(stock)) {
    return undefined;
  }

  if (!Number.isFinite(stock)) {
    return 0;
  }

  return Math.max(0, Math.floor(stock));
};

export const mapBackendDishToDish = (dto: BackendDishDto): Dish => ({
  id: dto._id,
  name: dto.nombre,
  price: dto.precio,
  imageUrl: dto.imagen_url ?? undefined,
  isHipo: dto.es_hipo ?? false,
  proteinOptions: dto.opciones && dto.opciones.length > 0 ? dto.opciones : undefined,
  stock: normalizeStock(dto.stock),
});

export const mapBackendMenuToDailyMenu = (dto: BackendDailyMenuDto): DailyMenu | null => {
  const parsedDate = parseIsoDate(dto.fecha);
  if (!parsedDate) {
    logger.warn(`[menu.mapper] Fecha backend invalida ignorada: ${dto.fecha}`);
    return null;
  }

  return {
    id: dto._id,
    date: formatUiDate(parsedDate),
    isoDate: dto.fecha,
    includes: {
      salad: toSelectableMenuOption(dto.ensalada, BASE_INCLUDES.ensalada),
      bread: dto.pan,
      dessert: toSelectableMenuOption(dto.postre, BASE_INCLUDES.postre),
    },
    dishes: dto.platos.map(mapBackendDishToDish),
  };
};

const normalizeMenus = (menus: DailyMenu[]): DailyMenu[] => {
  const uniqueByDate = new Map<string, DailyMenu>();

  menus.forEach((menu) => {
    if (getMenuDateTimestamp(menu.date) === null) {
      logger.warn(`[menu.mapper] Fecha invalida ignorada en normalizacion: ${menu.date}`);
      return;
    }

    if (!uniqueByDate.has(menu.date)) {
      uniqueByDate.set(menu.date, menu);
      return;
    }

    logger.warn(`[menu.mapper] Fecha duplicada ignorada en normalizacion: ${menu.date}`);
  });

  return [...uniqueByDate.values()].sort((a, b) => {
    const aTimestamp = getMenuDateTimestamp(a.date) ?? Number.MAX_SAFE_INTEGER;
    const bTimestamp = getMenuDateTimestamp(b.date) ?? Number.MAX_SAFE_INTEGER;
    return aTimestamp - bTimestamp;
  });
};

export const mapBackendResponseToDailyMenus = (response: BackendMenuResponseDto): DailyMenu[] => {
  const mappedMenus = response
    .map(mapBackendMenuToDailyMenu)
    .filter((menu): menu is DailyMenu => menu !== null);

  return normalizeMenus(mappedMenus);
};

