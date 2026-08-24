import { createContext } from "react";

export type UserRole = "admin" | "kitchen";

export interface AuthContextValue {
  token: string | null;
  role: UserRole | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
