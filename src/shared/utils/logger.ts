// src/shared/utils/logger.ts
// Logger centralizado. En producción los niveles debug/info/warn se silencian.
// Solo error queda activo en prod para no perder fallos críticos.

const isProd = import.meta.env.PROD;

const noop = () => {};

export const logger = {
  debug: isProd ? noop : (...args: unknown[]) => console.debug('[debug]', ...args),
  info:  isProd ? noop : (...args: unknown[]) => console.info('[info]',  ...args),
  warn:  isProd ? noop : (...args: unknown[]) => console.warn('[warn]',  ...args),
  error:           (...args: unknown[]) => console.error('[error]', ...args),
};
