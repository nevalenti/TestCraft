import type { Breadcrumb, ErrorEvent } from "@sentry/react";
import * as Sentry from "@sentry/react";

import { env } from "@/lib/env";
import { pageId } from "@/lib/pageId";

const PRODUCTION_TRACES_SAMPLE_RATE = 0.1;
const SENSITIVE_URL_PARTS =
  /([?&#](?:code|state|session_state|token|access_token|id_token|refresh_token)=)[^&#]*|(\/share\/)[^/?#]+/gi;

export const scrubUrl = (url: string) =>
  url.replaceAll(
    SENSITIVE_URL_PARTS,
    (_match, param?: string, sharePath?: string) =>
      `${param ?? sharePath}[Filtered]`,
  );

const scrubUrls = (data: Record<string, unknown> | undefined) => {
  if (!data) return;
  for (const key of ["url", "from", "to"]) {
    const value = data[key];
    if (typeof value === "string") data[key] = scrubUrl(value);
  }
};

export const scrubEvent = (event: ErrorEvent): ErrorEvent => {
  if (event.request?.url) event.request.url = scrubUrl(event.request.url);
  const headers = event.request?.headers;
  if (headers?.["Referer"]) headers["Referer"] = scrubUrl(headers["Referer"]);
  const breadcrumbs = event.breadcrumbs ?? [];
  for (const breadcrumb of breadcrumbs) scrubUrls(breadcrumb.data);
  return event;
};

export const scrubBreadcrumb = (breadcrumb: Breadcrumb): Breadcrumb => {
  scrubUrls(breadcrumb.data);
  return breadcrumb;
};

const tracesSampleRate = () =>
  env.VITE_TRACES_SAMPLE_RATE ??
  (env.VITE_ENVIRONMENT === "production" ? PRODUCTION_TRACES_SAMPLE_RATE : 1);

export const initErrorReporting = (router: unknown) => {
  if (!env.VITE_GLITCHTIP_DSN) return;

  Sentry.init({
    dsn: env.VITE_GLITCHTIP_DSN,
    release: env.VITE_RELEASE,
    environment: env.VITE_ENVIRONMENT,
    integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
    tracesSampleRate: tracesSampleRate(),
    tracePropagationTargets: [`${env.VITE_API_URL}/api/`],
    propagateTraceparent: true,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
  Sentry.setTag("page_id", pageId);
};

export const setReportingUser = (userId: string | undefined) => {
  Sentry.setUser(userId ? { id: userId } : null);
};

export const reportError = (
  error: unknown,
  extra?: Record<string, unknown>,
) => {
  if (!env.VITE_GLITCHTIP_DSN) return;

  Sentry.captureException(error, extra ? { extra } : undefined);
};

interface ApiErrorDetails {
  status: number;
  method?: string;
  url?: string;
  requestId?: string;
}

export const reportApiError = (
  error: unknown,
  { status, method, url, requestId }: ApiErrorDetails,
) => {
  if (!env.VITE_GLITCHTIP_DSN) return;

  Sentry.captureException(error, {
    tags: {
      http_status: status,
      ...(requestId && { request_id: requestId }),
    },
    extra: { method, url: url ? scrubUrl(url) : url },
  });
};
