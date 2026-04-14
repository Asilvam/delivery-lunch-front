import axios from 'axios';
import type { OrderPayload, OrderResponse } from '../../types/order';
import { logger } from '../../shared/utils/logger';

export const sendOrder = async (payload: OrderPayload): Promise<OrderResponse> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (!baseUrl) throw new Error('VITE_API_BASE_URL no configurado');

    const url = `${baseUrl}/orders`;

    logger.info('[order.service] Enviando pedido', payload);

    const response = await axios.post<OrderResponse>(url, payload, {
        timeout: 15000,
    });

    logger.info('[order.service] Pedido enviado exitosamente', response.data);

    return response.data;
};
