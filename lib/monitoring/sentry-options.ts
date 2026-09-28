import type { ErrorEvent, EventHint } from "@sentry/nextjs";
import { scrubEvent } from "./scrub";

// Shared by server, edge and browser (M14-P01): errors only, no tracing or replay, no default PII.
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend: (event: ErrorEvent, _hint: EventHint) => scrubEvent(event),
  beforeBreadcrumb: <T extends { message?: string; data?: Record<string, unknown> }>(crumb: T) =>
    scrubEvent({ breadcrumbs: [crumb] }).breadcrumbs?.[0] as T,
};
