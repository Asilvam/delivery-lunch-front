import { useContext } from 'react';
import { CustomerSessionContext } from '../context/customer-session';
export function useCustomerSession() { const value = useContext(CustomerSessionContext); if (!value) throw new Error('Falta CustomerSessionProvider'); return value; }
