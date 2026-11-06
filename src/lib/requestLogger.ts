import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

type TimedConfig = InternalAxiosRequestConfig & { requestStartedAt?: number };
export function installRequestLogger(instance: AxiosInstance) {
  if (import.meta.env.VITE_ENABLE_REQUEST_LOGS !== 'true') return;
  instance.interceptors.request.use(config => {
    (config as TimedConfig).requestStartedAt = Date.now();
    console.debug('[API] solicitud', config.method?.toUpperCase(), config.url?.split('?')[0]);
    return config;
  });
  instance.interceptors.response.use(response => {
    const config = response.config as TimedConfig;
    console.debug('[API] respuesta', response.status, config.url?.split('?')[0], Date.now() - (config.requestStartedAt ?? Date.now()));
    return response;
  }, (error: unknown) => Promise.reject(error));
}
