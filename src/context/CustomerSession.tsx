import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import {
  CustomerSessionContext,
  type CustomerSession,
} from "./customer-session";
import {
  loginCustomer,
  logoutCustomer,
  restoreCustomerSession,
} from "../data/services/customerSessionApi.service";
import {
  customerAuthMessage,
  sessionExpiresAt,
} from "../domain/auth/customerSession";

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const current = useRef<CustomerSession | null>(null);
  const revision = useRef(0);
  const mounted = useRef(true);
  const inFlight = useRef<Promise<CustomerSession | null> | null>(null);
  const authOperation = useRef<Promise<void> | null>(null);
  const commit = useCallback((next: CustomerSession | null) => {
    current.current = next;
    if (mounted.current) setSession(next);
  }, []);
  const refreshSession = useCallback(() => {
    if (authOperation.current)
      return authOperation.current.then(() => current.current);
    if (inFlight.current) return inFlight.current;
    const version = revision.current;
    const request = restoreCustomerSession()
      .then((next) => {
        if (version !== revision.current) return current.current;
        commit(next);
        if (mounted.current) setSessionError(null);
        return next;
      })
      .catch((error: unknown) => {
        if (version !== revision.current) return current.current;
        const status = axios.isAxiosError(error)
          ? error.response?.status
          : undefined;
        if (
          status === 401 ||
          status === 403 ||
          sessionExpiresAt(current.current) <= Date.now()
        )
          commit(null);
        if (mounted.current)
          setSessionError(status === 401 ? null : customerAuthMessage(error));
        if (status === 401 || status === 403) return null;
        throw error;
      })
      .finally(() => {
        if (inFlight.current === request) inFlight.current = null;
        if (mounted.current) setRestoring(false);
      });
    inFlight.current = request;
    return request;
  }, [commit]);
  const getSession = useCallback(async () => {
    if (authOperation.current) await authOperation.current;
    if (sessionExpiresAt(current.current) > Date.now() + 30000)
      return current.current;
    return refreshSession();
  }, [refreshSession]);
  const signIn = useCallback(
    (credential: string) => {
      if (authOperation.current) return authOperation.current;
      revision.current++;
      const request = (async () => {
        await inFlight.current?.catch(() => null);
        try {
          const next = await loginCustomer(credential);
          commit(next);
          if (mounted.current) setSessionError(null);
        } catch (error) {
          if (mounted.current) setSessionError(customerAuthMessage(error));
          throw error;
        }
      })().finally(() => {
        if (authOperation.current === request) authOperation.current = null;
      });
      authOperation.current = request;
      return request;
    },
    [commit],
  );
  const signOut = useCallback(() => {
    if (authOperation.current) return authOperation.current;
    revision.current++;
    const request = (async () => {
      await inFlight.current?.catch(() => null);
      try {
        await logoutCustomer();
        commit(null);
        if (mounted.current) setSessionError(null);
      } catch (error) {
        if (mounted.current) setSessionError(customerAuthMessage(error));
        throw error;
      }
    })().finally(() => {
      if (authOperation.current === request) authOperation.current = null;
    });
    authOperation.current = request;
    return request;
  }, [commit]);
  useEffect(() => {
    mounted.current = true;
    sessionStorage.removeItem("customer_session");
    void refreshSession().catch(() => {});
    return () => {
      mounted.current = false;
    };
  }, [refreshSession]);
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== "hidden")
        void getSession().catch(() => {});
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    const timer = session
      ? window.setTimeout(
          check,
          Math.max(1000, sessionExpiresAt(session) - Date.now() - 30000),
        )
      : undefined;
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
      window.clearTimeout(timer);
    };
  }, [session, getSession]);
  const value = useMemo(
    () => ({
      session,
      restoring,
      sessionError,
      signIn,
      signOut,
      refreshSession,
      getSession,
    }),
    [
      session,
      restoring,
      sessionError,
      signIn,
      signOut,
      refreshSession,
      getSession,
    ],
  );
  return (
    <CustomerSessionContext.Provider value={value}>
      {children}
    </CustomerSessionContext.Provider>
  );
}
