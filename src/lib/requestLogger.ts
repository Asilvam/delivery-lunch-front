// src/lib/requestLogger.ts
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

function maskAuth(headerVal: unknown) {
  if (!headerVal || typeof headerVal !== 'string') return headerVal;
  const parts = headerVal.split(' ');
  if (parts.length === 2) {
    const t = parts[1];
    return `${parts[0]} ${t.slice(0, 4)}…${t.slice(-4)}`;
  }
  return headerVal.slice(0, 8) + '…';
}

function shortStr(v: unknown, max = 300) {
  if (v == null) return v;
  try {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return s.length > max ? s.slice(0, max) + `…(+${s.length - max} chars)` : s;
  } catch {
    return String(v);
  }
}

export function installRequestLogger(axiosInstance: AxiosInstance) {
  const enabled = import.meta.env.VITE_ENABLE_REQUEST_LOGS === 'true';
  if (!enabled) return;

  // Inform that logger is active (use info so it's visible even if debug is filtered)
  try {
    console.info('[API LOGGING] request logger enabled (VITE_ENABLE_REQUEST_LOGS=true)');
  } catch {
    /* ignore */
  }

  axiosInstance.interceptors.request.use((config: AxiosRequestConfig) => {
    const now = Date.now();
    (config as any).__reqStart = now;

    const method = (config.method || 'get').toString().toUpperCase();
    const url = String(config.url ?? '<no-url>');
    const params = config.params ?? null;
    const data = config.data ?? null;
    // headers can be function or object; try to read Authorization safely
    const rawHeaders = config.headers as Record<string, unknown> | undefined;
    const auth = rawHeaders?.Authorization ?? rawHeaders?.authorization;
    const maskedAuth = maskAuth(auth);

    console.debug('[API ▶] %s %s', method, url, {
      params,
      data: shortStr(data),
      auth: maskedAuth,
      ts: new Date(now).toISOString(),
    });

    return config;
  }, (err) => {
    console.warn('[API ◀] request error', err);
    return Promise.reject(err);
  });

  axiosInstance.interceptors.response.use((resp: AxiosResponse) => {
    const cfg = resp.config as any;
    const start = cfg?.__reqStart;
    const elapsed = start ? Date.now() - start : undefined;
    const url = String(cfg?.url ?? '<no-url>');
    const method = (cfg?.method || 'get').toString().toUpperCase();
    const status = resp.status;
    const bodySummary = shortStr(resp.data, 500);
    console.debug('[API ◀] %s %s %d %sms body=%o', method, url, status, elapsed ?? '-', bodySummary);
    return resp;
  }, (err) => {
    const cfg = err.config as any ?? {};
    const start = cfg?.__reqStart;
    const elapsed = start ? Date.now() - start : undefined;
    const url = String(cfg?.url ?? '<no-url>');
    const method = (cfg?.method || 'get').toString().toUpperCase();
    const status = err.response?.status;
    console.error('[API ◀] %s %s ERROR status=%s %sms message=%s', method, url, status ?? '-', elapsed ?? '-', err.message);
    return Promise.reject(err);
  });
}

export default installRequestLogger;
