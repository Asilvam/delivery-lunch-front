import type { BackendDailyMenuDto, BackendDishDto, BackendMenuResponseDto, DailyMenu, Dish } from '../types/menu';

const FIXED_MENU_PRICE = 5500;
const BASE_INCLUDES = {
  ensalada: 'Ensalada surtida',
  pan: 'Pan amasado',
  postre: 'Postre del dia',
};

const addDays = (base: Date, days: number) => {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
};

const formatIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatUiDate = (date: Date) => {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = `${date.getFullYear()}`.slice(-2);
  return `${day}/${month}/${year}`;
};

const parseIsoDate = (isoDate: string): Date | null => {
  const [yearText, monthText, dayText] = isoDate.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  parsedDate.setHours(0, 0, 0, 0);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
};

const today = new Date();
today.setHours(0, 0, 0, 0);

const todayIso = formatIsoDate(today);
const tomorrowIso = formatIsoDate(addDays(today, 1));
const afterTomorrowIso = formatIsoDate(addDays(today, 2));
const thirdDayIso = formatIsoDate(addDays(today, 3));

const createBackendDish = (id: string, nombre: string, overrides: Partial<BackendDishDto> = {}): BackendDishDto => ({
  id,
  nombre,
  precio: FIXED_MENU_PRICE,
  ...overrides,
});

// Simula respuesta backend para adaptar y probar el mapper UI.
export const backendMenuResponseMock: BackendMenuResponseDto = {
  data: [
    {
      fecha: todayIso,
      ensalada: BASE_INCLUDES.ensalada,
      pan: BASE_INCLUDES.pan,
      postre: BASE_INCLUDES.postre,
      platos: [
        createBackendDish('today-1', 'Pollo asado con arroz y papas fritas', { imagen_url: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=400&auto=format&fit=crop' }),
        createBackendDish('today-2', 'Pollo asado con fideos con salsa o crema', { imagen_url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=400&auto=format&fit=crop' }),
        createBackendDish('today-3', 'Cerdo mongoliano con arroz', { imagen_url: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?q=80&w=400&auto=format&fit=crop' }),
        createBackendDish('today-4', 'Cerdo mongoliano con fideos', { imagen_url: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?q=80&w=400&auto=format&fit=crop' }),
        createBackendDish('today-5', 'Porotos con riendas', { imagen_url: 'https://images.unsplash.com/photo-1625943555403-8c4a5f5cfb89?q=80&w=400&auto=format&fit=crop' }),
        createBackendDish('today-6', 'Hipo (elige proteina)', {
          opciones: ['Pollo asado', 'Cerdo mongoliano', 'Atun'],
          es_hipo: true,
          imagen_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=400&auto=format&fit=crop',
        }),
      ],
    },
    {
      fecha: tomorrowIso,
      ensalada: BASE_INCLUDES.ensalada,
      pan: BASE_INCLUDES.pan,
      postre: BASE_INCLUDES.postre,
      platos: [
        createBackendDish('other-1-1', 'Pollo asado con arroz y papas fritas'),
        createBackendDish('other-1-2', 'Pollo asado con fideos con salsa o crema'),
        createBackendDish('other-1-3', 'Bife de cerdo con arroz y papas fritas'),
        createBackendDish('other-1-4', 'Bife de cerdo con fideos con salsa o crema'),
        createBackendDish('other-1-5', 'Pantrucas'),
        createBackendDish('other-1-6', 'Hipo (elige proteina)', {
          opciones: ['Pechuga asada', 'Bife de cerdo', 'Atun'],
          es_hipo: true,
        }),
      ],
    },
    {
      fecha: afterTomorrowIso,
      ensalada: BASE_INCLUDES.ensalada,
      pan: BASE_INCLUDES.pan,
      postre: BASE_INCLUDES.postre,
      platos: [
        createBackendDish('other-2-1', 'Cazuela de pollo', { imagen_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=400&auto=format&fit=crop' }),
        createBackendDish('other-2-2', 'Zapallo italiano', { imagen_url: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=80&w=400&auto=format&fit=crop' }),
        createBackendDish('other-2-3', 'Cerdo mongoliano con fideos'),
        createBackendDish('other-2-4', 'Cerdo mongoliano con arroz'),
        createBackendDish('other-2-5', 'Hipo (elige proteina)', {
          opciones: ['Pollo de cazuela', 'Zapallo italiano', 'Cerdo mongoliano'],
          es_hipo: true,
        }),
      ],
    },
    {
      fecha: thirdDayIso,
      ensalada: BASE_INCLUDES.ensalada,
      pan: BASE_INCLUDES.pan,
      postre: BASE_INCLUDES.postre,
      platos: [
        createBackendDish('other-3-1', 'Pollo asado con arroz y papas fritas'),
        createBackendDish('other-3-2', 'Cerdo mongoliano con arroz'),
        createBackendDish('other-3-3', 'Pantrucas'),
        createBackendDish('other-3-4', 'Hipo (elige proteina)', {
          opciones: ['Pollo asado', 'Bife de cerdo', 'Atun'],
          es_hipo: true,
        }),
      ],
    },
  ],
};

const mapBackendDishToDish = (dto: BackendDishDto): Dish => ({
  id: dto.id,
  name: dto.nombre,
  price: dto.precio,
  imageUrl: dto.imagen_url ?? undefined,
  options: dto.opciones ?? undefined,
  hasSides: dto.es_hipo ? false : undefined,
});

const mapBackendMenuToDailyMenu = (dto: BackendDailyMenuDto): DailyMenu | null => {
  const parsedDate = parseIsoDate(dto.fecha);
  if (!parsedDate) {
    console.warn(`[menuMocks] Fecha backend invalida ignorada: ${dto.fecha}`);
    return null;
  }

  return {
    date: formatUiDate(parsedDate),
    includes: {
      salad: dto.ensalada,
      bread: dto.pan,
      dessert: dto.postre,
    },
    dishes: dto.platos.map(mapBackendDishToDish),
  };
};

export const getMenuDateTimestamp = (menuDate: string): number | null => {
  const [dayText, monthText, yearText] = menuDate.split('/');
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return null;
  }

  const fullYear = year >= 70 ? 1900 + year : 2000 + year;
  const parsedDate = new Date(fullYear, month - 1, day);
  parsedDate.setHours(0, 0, 0, 0);

  if (
    parsedDate.getFullYear() !== fullYear ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate.getTime();
};

const normalizeMenus = (menus: DailyMenu[]): DailyMenu[] => {
  const uniqueByDate = new Map<string, DailyMenu>();

  menus.forEach((menu) => {
    if (getMenuDateTimestamp(menu.date) === null) {
      console.warn(`[menuMocks] Fecha invalida ignorada en normalizacion: ${menu.date}`);
      return;
    }

    if (!uniqueByDate.has(menu.date)) {
      uniqueByDate.set(menu.date, menu);
      return;
    }

    console.warn(`[menuMocks] Fecha duplicada ignorada en normalizacion: ${menu.date}`);
  });

  return [...uniqueByDate.values()].sort((a, b) => {
    const aTimestamp = getMenuDateTimestamp(a.date) ?? Number.MAX_SAFE_INTEGER;
    const bTimestamp = getMenuDateTimestamp(b.date) ?? Number.MAX_SAFE_INTEGER;
    return aTimestamp - bTimestamp;
  });
};

const mapBackendResponseToDailyMenus = (response: BackendMenuResponseDto): DailyMenu[] => {
  const mappedMenus = response.data
    .map(mapBackendMenuToDailyMenu)
    .filter((menu): menu is DailyMenu => menu !== null);

  return normalizeMenus(mappedMenus);
};

// Simula una llamada unica al backend que retorna todos los menus disponibles.
export const fetchDailyMenusMock = async (): Promise<DailyMenu[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mapBackendResponseToDailyMenus(backendMenuResponseMock);
};


