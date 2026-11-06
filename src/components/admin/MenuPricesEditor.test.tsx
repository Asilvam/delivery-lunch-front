import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import MenuPricesEditor from './MenuPricesEditor';
import type { BackendDailyMenuDto } from '../../types/menu';
const menu: BackendDailyMenuDto = { _id: 'menu', fecha: '2026-11-05', precioBase: 5500, updatedAt: '2026-11-05T12:00:00.000Z', ensalada: [], pan: '', postre: [], platos: [
  { _id: 'one', nombre: 'Pollo', precio: 5500 },
  { _id: 'two', nombre: 'Hipo', precio: 6000 },
] };
afterEach(cleanup);
it('updates general prices while preserving special prices and saves both', () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<MenuPricesEditor menu={menu} saving={false} onSave={save} onDirtyChange={vi.fn()} />);
  expect(screen.getByRole('button', {name:'Guardar precios'})).toHaveProperty('disabled', true);
  fireEvent.change(screen.getByLabelText('Precio general del menú'), {target:{value:'6500'}});
  expect(screen.getByText('Usa el precio general · $6.500')).toBeDefined();
  expect(screen.getByLabelText('Precio de Hipo')).toHaveProperty('value','6000');
  fireEvent.click(screen.getByRole('button', {name:'Guardar precios'}));
  expect(save).toHaveBeenCalledWith({precioBase:6500, expectedUpdatedAt:menu.updatedAt, platos:[{id:'one',precio:6500},{id:'two',precio:6000}]});
});
it('allows returning a dish to the general price', () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<MenuPricesEditor menu={menu} saving={false} onSave={save} onDirtyChange={vi.fn()} />);
  fireEvent.click(screen.getByRole('switch',{name:'Precio especial de Hipo'}));
  fireEvent.click(screen.getByRole('button', {name:'Guardar precios'}));
  expect(save.mock.calls[0][0].platos[1].precio).toBe(5500);
});
it('rejects invalid prices and can undo the draft', () => {
  render(<MenuPricesEditor menu={menu} saving={false} onSave={vi.fn()} onDirtyChange={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Precio general del menú'), {target:{value:'-10'}});
  expect(screen.getByRole('button', {name:'Guardar precios'})).toHaveProperty('disabled',true);
  fireEvent.click(screen.getByRole('button', {name:'Deshacer cambios'}));
  expect(screen.getByLabelText('Precio general del menú')).toHaveProperty('value','5500');
});
