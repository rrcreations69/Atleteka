// M14-P01: nothing personal or secret leaves the app in a Sentry event. Pure, so it is unit-tested.

const patterns: [RegExp, string][] = [
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]"],
  [/\b(?:sk|pk)_(?:test|live)_[A-Za-z0-9]+/g, "[paymongo-key]"],
  [/\bwhsk_[A-Za-z0-9]+/g, "[webhook-secret]"],
  [/\bre_[A-Za-z0-9_]{8,}/g, "[resend-key]"],
  [/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[supabase-key]"],
  [/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[jwt]"],
  [/\b(?:pkce|cs|pay|pi|evt|hook)_[A-Za-z0-9]{12,}/g, "[provider-id]"],
];

export function scrubText(value: string) {
  return patterns.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

type Json = unknown;
function scrubValue(value: Json, depth = 0): Json {
  if (depth > 6) return "[truncated]";
  if (typeof value === "string") return scrubText(value);
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, scrubValue(item, depth + 1)]));
  }
  return value;
}

type ScrubbableEvent = {
  message?: string;
  user?: unknown;
  request?: { url?: string; cookies?: unknown; headers?: unknown; data?: unknown; query_string?: unknown; env?: unknown };
  exception?: { values?: { value?: string }[] };
  breadcrumbs?: { message?: string; data?: Record<string, unknown> }[];
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
};

/** Drops request details and user fields, and masks emails/keys everywhere text can appear. */
export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
    delete event.request.query_string;
    delete event.request.env;
    if (event.request.url) event.request.url = scrubText(event.request.url.split("?")[0]);
  }
  if (event.message) event.message = scrubText(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubText(exception.value);
  }
  for (const crumb of event.breadcrumbs ?? []) {
    if (crumb.message) crumb.message = scrubText(crumb.message);
    if (crumb.data) crumb.data = scrubValue(crumb.data) as Record<string, unknown>;
  }
  if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;
  if (event.contexts) event.contexts = scrubValue(event.contexts) as Record<string, unknown>;
  return event;
}
