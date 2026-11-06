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
it('uses a managed Cloudinary photo instead of the legacy image for a known dish', () => {
  const result = mapBackendMenuToDailyMenu({...menu, platos:[{_id:'one',nombre:'Pollo asado con arroz y papas fritas',precio:5500,imagen_url:'https://res.cloudinary.com/dsbpineil/image/upload/v123/new-photo.png'}]});
  expect(result?.dishes[0].imageUrl).toBe('https://res.cloudinary.com/dsbpineil/image/upload/f_auto,q_auto,c_limit,w_800/v123/new-photo.png');
});
