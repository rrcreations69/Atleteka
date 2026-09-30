import "server-only";
import { z } from "zod";

const configSchema = z.object({
  key: z.string().regex(/^re_[A-Za-z0-9_]+$/),
  // "Name <address>" or a bare address.
  from: z.string().regex(/^(?:[^<>]{1,80} )?<?[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>?$/),
});

/** Sends one email through Resend. The idempotency key makes a repeated send a no-op for 24 hours. */
export async function sendEmail(input: { to: string; subject: string; html: string; text: string; idempotencyKey: string }) {
  const config = configSchema.safeParse({ key: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM });
  if (!config.success) throw new Error("Email sending is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.data.key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({ from: config.data.from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  // Response bodies are not logged: they can echo the recipient.
  if (!response.ok) throw new EmailSendError(response.status);
}

export class EmailSendError extends Error {
  constructor(readonly status: number) { super(`Resend rejected the email (HTTP ${status}).`); }
}
