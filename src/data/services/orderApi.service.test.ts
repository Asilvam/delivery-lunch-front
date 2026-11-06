import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { getPendingOrder, sendOrder } from './orderApi.service';
import type { OrderPayload } from '../../types/order';
vi.mock('axios', () => ({default: {post: vi.fn(), isAxiosError: (e: {isAxiosError?: boolean}) => Boolean(e?.isAxiosError)}}));
const payload: OrderPayload = {menuId:'menu', fecha:'2026-11-05', cliente:'Cliente', telefono:'+56900000000', total:5000, items:[]};
beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });
describe('Checkout retry recovery', () => {
 it('keeps the original key and payload after a network error, even if the form changes', async () => {
  vi.mocked(axios.post).mockRejectedValueOnce({isAxiosError:true});
  await expect(sendOrder(payload,'token','customer')).rejects.toBeDefined();
  const pending = getPendingOrder(); expect(pending?.payload).toEqual(payload);
  vi.mocked(axios.post).mockResolvedValueOnce({data:{_id:'order',total:5000}});
  await sendOrder({...payload,cliente:'Cambio accidental'},'new-token','customer');
  expect(vi.mocked(axios.post).mock.calls[1][1]).toEqual(payload);
  expect(vi.mocked(axios.post).mock.calls[1][2]?.headers).toMatchObject({'Idempotency-Key':pending?.key,Authorization:'Bearer new-token'});
  expect(getPendingOrder()).toBeNull();
 });
 it('unlocks editing after an explicit validation rejection', async () => {
  vi.mocked(axios.post).mockRejectedValueOnce({isAxiosError:true,response:{status:400}});
  await expect(sendOrder(payload,'token','customer')).rejects.toBeDefined();
  expect(getPendingOrder()).toBeNull();
 });
 it('preserves the attempt after a server error with an uncertain result', async () => {
  vi.mocked(axios.post).mockRejectedValueOnce({isAxiosError:true,response:{status:500}});
  await expect(sendOrder(payload,'token','customer')).rejects.toBeDefined(); expect(getPendingOrder()).not.toBeNull();
 });
 it('does not replay a pending order as a different customer', async () => {
  vi.mocked(axios.post).mockRejectedValueOnce({isAxiosError:true});
  await expect(sendOrder(payload,'token','customer')).rejects.toBeDefined();
  await expect(sendOrder(payload,'other-token','other-customer')).rejects.toThrow('Vuelve a la cuenta');
  expect(axios.post).toHaveBeenCalledTimes(1);
 });
});

it('unlocks an explicitly rejected price change so the customer can review the new total', async () => {
  vi.mocked(axios.post).mockRejectedValueOnce({isAxiosError:true,response:{status:409,data:{code:'PRICE_CHANGED'}}});
  await expect(sendOrder(payload,'token','customer')).rejects.toBeDefined();
  expect(getPendingOrder()).toBeNull();
});
it('keeps an ambiguous conflict pending', async () => {
  vi.mocked(axios.post).mockRejectedValueOnce({isAxiosError:true,response:{status:409,data:{}}});
  await expect(sendOrder(payload,'token','customer')).rejects.toBeDefined();
  expect(getPendingOrder()).not.toBeNull();
});
