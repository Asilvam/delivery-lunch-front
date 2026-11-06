import { useEffect, useRef } from "react";

/** Permite descartar resultados tardíos sin afectar otras pantallas. */
export function useMountedRef() {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}
