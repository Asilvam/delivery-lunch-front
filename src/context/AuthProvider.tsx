import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AuthContext,
  type AuthContextValue,
  type UserRole,
} from "./auth-context";

const TOKEN_KEY = "admin_token";

function decodeRole(token: string): UserRole | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json) as { role?: UserRole };
    return parsed.role ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [role, setRole] = useState<UserRole | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? decodeRole(stored) : null;
  });

  const login = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setRole(decodeRole(newToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, role, login, logout, isAuthenticated: token !== null }),
    [token, role, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
