import * as Sentry from '@sentry/react';

import { env } from '@/lib/env';

export const initErrorReporting = () => {
  if (!env.VITE_GLITCHTIP_DSN) return;

  Sentry.init({
    dsn: env.VITE_GLITCHTIP_DSN,
    environment: import.meta.env.MODE,
  });
};

export const reportError = (
  error: unknown,
  extra?: Record<string, unknown>,
) => {
  if (!env.VITE_GLITCHTIP_DSN) return;

  Sentry.captureException(error, extra ? { extra } : undefined);
};
