import axios from "axios";
import type { CustomerPage } from "../../types/customer";
export type CustomerFilter = "all" | "active" | "blocked";
export async function fetchCustomers(
  token: string,
  query: { q: string; status: CustomerFilter; page: number },
  signal?: AbortSignal,
) {
  const response = await axios.get<CustomerPage>(
    `${import.meta.env.VITE_API_BASE_URL}/customers`,
    {
      params: query,
      signal,
      timeout: 30000,
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
}
export async function blockCustomer(
  token: string,
  googleId: string,
  blocked: boolean,
  reason?: string,
) {
  await axios.patch(
    `${import.meta.env.VITE_API_BASE_URL}/customers/${encodeURIComponent(googleId)}/block`,
    { blocked, reason },
    { timeout: 15000, headers: { Authorization: `Bearer ${token}` } },
  );
}
export async function deleteCustomer(token: string, googleId: string) {
  await axios.delete(
    `${import.meta.env.VITE_API_BASE_URL}/customers/${encodeURIComponent(googleId)}`,
    { timeout: 15000, headers: { Authorization: `Bearer ${token}` } },
  );
}
