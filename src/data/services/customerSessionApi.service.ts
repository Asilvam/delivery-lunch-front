import axios from "axios";
import type { CustomerSession } from "../../context/customer-session";
import { sessionExpiresAt } from "../../domain/auth/customerSession";
const options = {
  timeout: 30000,
  withCredentials: true,
  headers: { "X-Customer-Request": "1" },
};
const path = "/api/auth";
function verify(
  data: CustomerSession | null | undefined,
): CustomerSession | null {
  if (!data) return null;
  if (!data.customer?.googleId || sessionExpiresAt(data) <= Date.now())
    throw new Error("No se pudo validar la sesión.");
  return data;
}
// Shared by StrictMode mounts and simultaneous checkout requests in this tab.
let refreshing: Promise<CustomerSession | null> | null = null;
export function restoreCustomerSession(): Promise<CustomerSession | null> {
  if (!refreshing)
    refreshing = axios
      .post<CustomerSession | null>(`${path}/refresh`, {}, options)
      .then((res) => (res.status === 204 ? null : verify(res.data)))
      .finally(() => {
        refreshing = null;
      });
  return refreshing;
}
export async function loginCustomer(credential: string) {
  if (refreshing) await refreshing.catch(() => null);
  const res = await axios.post<CustomerSession>(
    `${path}/google`,
    { credential },
    options,
  );
  const session = verify(res.data);
  if (!session) throw new Error("Google no devolvió una sesión válida.");
  return session;
}
export async function logoutCustomer() {
  if (refreshing) await refreshing.catch(() => null);
  await axios.post(`${path}/logout`, {}, options);
}
