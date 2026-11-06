import axios from 'axios';
// src/context/AuthContext.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AuthContext, type UserRole } from './auth-context';

const TOKEN_KEY = "admin_token";

/** Decode the JWT payload (base64url) and extract the role claim. */
function decodeRole(token: string): UserRole | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json) as { role?: UserRole };
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    if (!exp || exp * 1000 <= Date.now()) return null;
    return parsed.role === 'admin' || parsed.role === 'kitchen' ? parsed.role : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    (() => { const stored = localStorage.getItem(TOKEN_KEY); return stored && decodeRole(stored) ? stored : null; })(),
  );
  const [role, setRole] = useState<UserRole | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? decodeRole(stored) : null;
  });

  const login = useCallback((newToken: string) => {
    if (!decodeRole(newToken)) throw new Error('Sesión de personal inválida');
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setRole(decodeRole(newToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setRole(null);
  }, []);

  useEffect(() => {
    if (!token) return;
    const expire = () => { sessionStorage.setItem('staff-session-expired', '1'); logout(); };
    const exp = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp as number;
    const timer = window.setTimeout(expire, Math.min(exp * 1000 - Date.now(), 2147483647));
    const interceptor = axios.interceptors.response.use(r => r, error => {
      if (error.response?.status === 401 && error.config?.headers?.Authorization === `Bearer ${token}`) expire();
      return Promise.reject(error);
    });
    window.addEventListener('staff-session-expired', expire);
    return () => { window.clearTimeout(timer); axios.interceptors.response.eject(interceptor); window.removeEventListener('staff-session-expired', expire); };
  }, [token, logout]);

  const value = useMemo(
    () => ({ token, role, login, logout, isAuthenticated: token !== null }),
    [token, role, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
