// src/types/order.ts

export interface OrderItemSelections {
  proteina?: string;
  ensalada?: string;
  postre: string;
}

export interface OrderItem {
  platoId: string;
  nombre: string;
  cantidad: number;
  precio: number;
  selecciones: OrderItemSelections;
}

export interface OrderPayload {
  menuId: string;
  fecha: string;
  cliente: string;
  telefono: string;
  total: number;
  items: OrderItem[];
}

export interface OrderResponse {
  id: string;
}

// ─── Tipos para paneles admin / cocina ────────────────────────────────────────

export const OrderStatus = {
  PENDIENTE: "pendiente",
  EN_PREPARACION: "en_preparacion",
  ENTREGADO: "entregado",
  CANCELADO: "cancelado",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/** Representa un pedido completo tal como lo devuelve el backend */
export interface Order {
  _id: string;
  menuId: string;
  fecha: string;
  cliente: string;
  telefono: string;
  total: number;
  estado: OrderStatus;
  items: OrderItem[];
  validadoPorAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  aceptadoEn?: string;
  entregadoEn?: string;
  canceladoEn?: string;
}
