import { createContext } from "react";
export interface CustomerSession {
  access_token: string;
  customer: {
    googleId: string;
    name: string;
    email: string;
    phone?: string;
    contactName?: string;
  };
}
export interface CustomerSessionState {
  session: CustomerSession | null;
  restoring: boolean;
  sessionError: string | null;
  signIn: (credential: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<CustomerSession | null>;
  getSession: () => Promise<CustomerSession | null>;
}
export const CustomerSessionContext =
  createContext<CustomerSessionState | null>(null);
