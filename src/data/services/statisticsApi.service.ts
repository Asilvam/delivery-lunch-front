// src/data/services/statisticsApi.service.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface DashboardSummary {
  pedidosTotales: number;
  pedidosCompletados: number;
  pedidosCancelados: number;
  tasaCompletacion: number;
  ingresosTotales: number;
  ticketPromedio: number;
  periodo: {
    startDate: string;
    endDate: string;
  };
}

export interface TopDish {
  platoId: string;
  nombre: string;
  cantidadVendida: number;
  ingresosTotales: number;
  porcentajeVentas: number;
}

export interface PeakHour {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  hourLabel: string;
  count: number;
}

export interface RevenueByDay {
  date: string;
  total: number;
  pedidosCount: number;
}

export interface CancellationStats {
  estado: string;
  count: number;
  porcentaje: number;
}

export async function fetchDashboardSummary(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<DashboardSummary> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await axios.get<DashboardSummary>(
    `${BASE_URL}/statistics/summary`,
    { headers: authHeaders(token), params, timeout: 10000 },
  );
  return res.data;
}

export async function fetchTopDishes(
  token: string,
  startDate?: string,
  endDate?: string,
  limit?: number,
): Promise<TopDish[]> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (limit) params.limit = String(limit);

  const res = await axios.get<TopDish[]>(`${BASE_URL}/statistics/top-dishes`, {
    headers: authHeaders(token),
    params,
    timeout: 10000,
  });
  return res.data;
}

export async function fetchPeakHours(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<PeakHour[]> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await axios.get<PeakHour[]>(`${BASE_URL}/statistics/peak-hours`, {
    headers: authHeaders(token),
    params,
    timeout: 10000,
  });
  return res.data;
}

export async function fetchRevenue(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<RevenueByDay[]> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await axios.get<RevenueByDay[]>(`${BASE_URL}/statistics/revenue`, {
    headers: authHeaders(token),
    params,
    timeout: 10000,
  });
  return res.data;
}

export async function fetchCancellations(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<CancellationStats[]> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await axios.get<CancellationStats[]>(
    `${BASE_URL}/statistics/cancellations`,
    { headers: authHeaders(token), params, timeout: 10000 },
  );
  return res.data;
}
