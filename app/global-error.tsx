"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Last-resort boundary when the root layout itself fails; keeps markup self-contained.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem 1.25rem" }}>
        <h1>Something went wrong</h1>
        <p>Please refresh the page. If this keeps happening, try again later.</p>
      </body>
    </html>
  );
}
