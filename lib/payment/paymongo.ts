import "server-only";
import { z } from "zod";
import { getAuthConfig } from "@/lib/supabase/config";

const API_URL = "https://api.paymongo.com/v2/checkout_sessions";
// Methods must also be enabled on the merchant account (PayMongo Settings → Payment Methods).
export const PAYMENT_METHOD_TYPES = ["card", "gcash", "paymaya", "qrph"] as const;

const secretKeySchema = z.string().regex(/^sk_(test|live)_[A-Za-z0-9]+$/);
const sessionResponseSchema = z.object({
  data: z.object({
    id: z.string().min(1),
    attributes: z.object({ checkout_url: z.url().refine((url) => new URL(url).protocol === "https:") }),
  }),
});

export type CheckoutLineItem = { name: string; amount: number; quantity: number; currency: "PHP"; description?: string };
export type CheckoutSessionInput = {
  line_items: CheckoutLineItem[];
  description: string;
  reference_number: string;
  metadata: Record<string, string>;
  billing: {
    name: string;
    email?: string;
    address: { line1: string; line2?: string; city: string; state: string; postal_code: string; country: string };
  };
  success_url: string;
  cancel_url: string;
};

function secretKey() {
  const key = secretKeySchema.safeParse(process.env.PAYMONGO_SECRET_KEY);
  if (!key.success) throw new Error("PayMongo payments are not configured.");
  // A live key must never be used from a plain-HTTP local origin.
  if (key.data.startsWith("sk_live_") && new URL(getAuthConfig().appUrl).protocol !== "https:") {
    throw new Error("PayMongo live keys require an HTTPS application URL.");
  }
  return key.data;
}

export async function createCheckoutSession(input: CheckoutSessionInput) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      data: { attributes: { ...input, payment_method_types: PAYMENT_METHOD_TYPES, show_line_items: true, show_description: true } },
    }),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  // Error bodies are not logged or shown: they can echo request details.
  if (!response.ok) throw new Error(`PayMongo rejected the checkout session (HTTP ${response.status}).`);
  const session = sessionResponseSchema.parse(await response.json()).data;
  return { id: session.id, url: session.attributes.checkout_url };
}
