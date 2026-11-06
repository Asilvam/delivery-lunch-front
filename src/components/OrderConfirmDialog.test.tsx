import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomerSessionContext } from '../context/customer-session';
import { OrderConfirmDialog } from './OrderConfirmDialog';
import type { OrderPayload } from '../types/order';
vi.mock('./GoogleCustomerAccess', () => ({GoogleCustomerAccess: () => <div>Continuar con Google</div>}));
const pending: OrderPayload = {menuId:'menu',fecha:'2026-11-05',cliente:'Cliente',telefono:'+56900000000',total:5000,items:[]};
afterEach(() => {cleanup();sessionStorage.clear();});
describe('Google required checkout UI', () => {
 it('does not enable sending an order for an anonymous visitor', () => {
  render(<CustomerSessionContext.Provider value={{session:null,signIn:vi.fn(),signOut:vi.fn()}}><OrderConfirmDialog open cartItems={[]} totalPrice={5000} onClose={vi.fn()} onSubmit={vi.fn()} /></CustomerSessionContext.Provider>);
  expect(screen.getByRole('button',{name:'Enviar pedido'})).toHaveProperty('disabled',true);
  expect(screen.getByText('Continuar con Google')).toBeDefined();
 });
 it('keeps a pending order immutable and allows recovering it without an available menu', async () => {
  const submit=vi.fn().mockResolvedValue(undefined);
  render(<CustomerSessionContext.Provider value={{session:{access_token:'token',customer:{googleId:'user',name:'Cliente',email:'c@example.test'}},signIn:vi.fn(),signOut:vi.fn()}}><OrderConfirmDialog open pendingPayload={pending} cartItems={[]} totalPrice={5000} onClose={vi.fn()} onSubmit={submit} /></CustomerSessionContext.Provider>);
  expect(screen.getByLabelText('Nombre')).toHaveProperty('disabled',true);
  expect(screen.getByLabelText('Teléfono')).toHaveProperty('disabled',true);
  fireEvent.click(screen.getByRole('button',{name:'Reintentar el mismo envío'}));
  expect(submit).toHaveBeenCalledWith(pending);
 });
});
