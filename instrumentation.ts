import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

// Server Component, route handler and Server Action errors. Next.js requires awaited async work here:
// without the flush, a serverless function can freeze before the event is uploaded (M14 finding).
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  Sentry.captureRequestError(...args);
  await Sentry.flush(2000);
};
