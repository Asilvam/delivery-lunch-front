import type { BackendDishDto, BackendMenuResponseDto } from '../../types/menu';
import { addDays, formatIsoDate } from '../../shared/utils/date/menuDate';

const FIXED_MENU_PRICE = 5500;
const BASE_INCLUDES = {
  ensalada: 'Ensalada surtida',
  pan: 'Pan amasado',
  postre: 'Postre del dia',
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
      ensalada: ['Ensalada surtida', 'Ensalada chilena', 'Repollo con zanahoria'],
      pan: BASE_INCLUDES.pan,
      postre: ['Flan de vainilla', 'Jalea light'],
      platos: [
        createBackendDish('today-1', 'Pollo asado con arroz y papas fritas', { imagen_url: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=400&auto=format&fit=crop', stock: 12 }),
        createBackendDish('today-2', 'Pollo asado con fideos con salsa o crema', { imagen_url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=400&auto=format&fit=crop', stock: 5 }),
        createBackendDish('today-3', 'Cerdo mongoliano con arroz', { imagen_url: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?q=80&w=400&auto=format&fit=crop', stock: 0 }),
        createBackendDish('today-4', 'Cerdo mongoliano con fideos', { imagen_url: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?q=80&w=400&auto=format&fit=crop', stock: 3 }),
        createBackendDish('today-5', 'Porotos con riendas', { imagen_url: 'https://images.unsplash.com/photo-1625943555403-8c4a5f5cfb89?q=80&w=400&auto=format&fit=crop', stock: 8 }),
        createBackendDish('today-6', 'Hipo (elige proteina)', {
          opciones: ['Pollo asado', 'Cerdo mongoliano', 'Atun'],
          es_hipo: true,
          imagen_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=400&auto=format&fit=crop',
          stock: 2,
        }),
      ],
    },
    {
      fecha: tomorrowIso,
      ensalada: ['Ensalada surtida', 'Apio con palta'],
      pan: BASE_INCLUDES.pan,
      postre: BASE_INCLUDES.postre,
      platos: [
        createBackendDish('other-1-1', 'Pollo asado con arroz y papas fritas', { stock: 9 }),
        createBackendDish('other-1-2', 'Pollo asado con fideos con salsa o crema', { stock: 4 }),
        createBackendDish('other-1-3', 'Bife de cerdo con arroz y papas fritas', { stock: 6 }),
        createBackendDish('other-1-4', 'Bife de cerdo con fideos con salsa o crema', { stock: 0 }),
        createBackendDish('other-1-5', 'Pantrucas', { stock: 7 }),
        createBackendDish('other-1-6', 'Hipo (elige proteina)', {
          opciones: ['Pechuga asada', 'Bife de cerdo', 'Atun'],
          es_hipo: true,
          stock: 5,
        }),
      ],
    },
    {
      fecha: afterTomorrowIso,
      ensalada: BASE_INCLUDES.ensalada,
      pan: BASE_INCLUDES.pan,
      postre: ['Leche asada', 'Fruta de la estacion'],
      platos: [
        createBackendDish('other-2-1', 'Cazuela de pollo', { imagen_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=400&auto=format&fit=crop', stock: 10 }),
        createBackendDish('other-2-2', 'Zapallo italiano', { imagen_url: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=80&w=400&auto=format&fit=crop', stock: 1 }),
        createBackendDish('other-2-3', 'Cerdo mongoliano con fideos', { stock: 5 }),
        createBackendDish('other-2-4', 'Cerdo mongoliano con arroz', { stock: 0 }),
        createBackendDish('other-2-5', 'Hipo (elige proteina)', {
          opciones: ['Pollo de cazuela', 'Zapallo italiano', 'Cerdo mongoliano'],
          es_hipo: true,
          stock: 4,
        }),
      ],
    },
    {
      fecha: thirdDayIso,
      ensalada: BASE_INCLUDES.ensalada,
      pan: BASE_INCLUDES.pan,
      postre: BASE_INCLUDES.postre,
      platos: [
        createBackendDish('other-3-1', 'Pollo asado con arroz y papas fritas', { stock: 11 }),
        createBackendDish('other-3-2', 'Cerdo mongoliano con arroz', { stock: 2 }),
        createBackendDish('other-3-3', 'Pantrucas', { stock: 5 }),
        createBackendDish('other-3-4', 'Hipo (elige proteina)', {
          opciones: ['Pollo asado', 'Bife de cerdo', 'Atun'],
          es_hipo: true,
          stock: 0,
        }),
      ],
    },
  ],
};

