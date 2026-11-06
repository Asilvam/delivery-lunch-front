import { createContext } from 'react';
export interface CustomerSession {
  access_token: string;
  customer: { googleId: string; name: string; email: string };
}
export const CustomerSessionContext = createContext<{session: CustomerSession | null; signIn: (credential: string) => Promise<void>; signOut: () => void} | null>(null);
