import { useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';

import { CustomerSessionContext, type CustomerSession } from './customer-session';
const KEY = 'customer_session';
function expiresAt(token: string): number {
  try { const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return p.role === 'customer' ? p.exp * 1000 : 0; } catch { return 0; }
}
function readSession(): CustomerSession | null {
  try { const s = JSON.parse(sessionStorage.getItem(KEY) || 'null') as CustomerSession | null; return s && expiresAt(s.access_token) > Date.now() ? s : null; } catch { return null; }
}

export function CustomerSessionProvider({ children }: {children: ReactNode}) {
  const [session, setSession] = useState<CustomerSession | null>(readSession);
  const signOut = () => { sessionStorage.removeItem(KEY); setSession(null); };
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => { sessionStorage.removeItem(KEY); setSession(null); }, Math.max(0, expiresAt(session.access_token) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [session]);
  const signIn = async (credential: string) => {
    const res = await axios.post<CustomerSession>(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {credential}, {timeout: 15000});
    if (!res.data.customer?.googleId || expiresAt(res.data.access_token) <= Date.now()) throw new Error('No se pudo validar la sesión');
    sessionStorage.setItem(KEY, JSON.stringify(res.data)); setSession(res.data);
  };
  return <CustomerSessionContext.Provider value={{session, signIn, signOut}}>{children}</CustomerSessionContext.Provider>;
}