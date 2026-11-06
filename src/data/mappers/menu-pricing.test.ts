import { expect, it } from 'vitest';
import { mapBackendMenuToDailyMenu } from './menu.mapper';
const menu = { _id: 'menu', fecha: '2026-11-05', precioBase: 6500, ensalada: [], pan: '', postre: [], platos: [{_id:'one',nombre:'Plato',precio:7200}] };
it('preserves configured general and special prices from the API', () => {
  const result = mapBackendMenuToDailyMenu(menu);
  expect(result?.basePrice).toBe(6500);
  expect(result?.dishes[0].price).toBe(7200);
});
it('uses 5500 only as the legacy general price fallback', () => {
  const result = mapBackendMenuToDailyMenu({...menu,precioBase:undefined});
  expect(result?.basePrice).toBe(5500);
  expect(result?.dishes[0].price).toBe(7200);
});
