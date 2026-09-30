import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

// Reject signed requests older than this to limit replays (PayMongo: optional but recommended).
export const SIGNATURE_TOLERANCE_SECONDS = 300;

/** Verifies `Paymongo-Signature: t=…,te=…,li=…` over "{t}.{raw body}" with HMAC-SHA256. */
export function verifySignature(header: string | null, rawBody: string, secret: string, livemode: boolean, nowSeconds: number) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((part) => {
    const index = part.indexOf("=");
    return index < 0 ? [part.trim(), ""] : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }));
  const timestamp = Number(parts.t);
  const provided = livemode ? parts.li : parts.te;
  if (!Number.isInteger(timestamp) || !/^[a-f0-9]{64}$/.test(provided ?? "")) return false;
  if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest();
  return timingSafeEqual(expected, Buffer.from(provided, "hex"));
}

// Only the fields needed to route the event; the session itself is re-read from PayMongo.
const eventSchema = z.object({
  data: z.object({
    id: z.string().min(1),
    attributes: z.object({
      type: z.string().min(1),
      livemode: z.boolean(),
      data: z.object({ id: z.string().regex(/^cs_[A-Za-z0-9]+$/) }).passthrough().optional(),
    }).passthrough(),
  }),
});

export function parseEvent(rawBody: string) {
  let json: unknown;
  try { json = JSON.parse(rawBody); } catch { return null; }
  const event = eventSchema.safeParse(json);
  if (!event.success) return null;
  const { id, attributes } = event.data.data;
  return { id, type: attributes.type, livemode: attributes.livemode, sessionId: attributes.data?.id ?? null };
}

const centavos = z.string().regex(/^\d{1,9}$/).transform(Number);
const uuid = z.uuid();
const addressSchema = z.object({
  name: z.string().min(1).max(120), line1: z.string().min(1).max(200), line2: z.string().max(200),
  city: z.string().min(1).max(100), region: z.string().min(1).max(100),
  postal_code: z.string().regex(/^\d{4}$/), country: z.literal("PH"),
});

/** Metadata we wrote in startPayment (lib/payment/actions.ts). PayMongo metadata values are strings. */
export const paymentMetadataSchema = z.object({
  cart_id: uuid,
  user_id: z.union([uuid, z.literal("")]),
  coupon_code: z.string().max(100),
  lines: z.string().min(1).max(5000).transform((value, context) => {
    const lines = value.split(";").map((entry) => {
      const [variantId, quantity, unitCentavos] = entry.split(":");
      return { variantId, quantity: Number(quantity), unitCentavos: Number(unitCentavos) };
    });
    const valid = lines.every((line) => uuid.safeParse(line.variantId).success
      && Number.isSafeInteger(line.quantity) && line.quantity > 0
      && Number.isSafeInteger(line.unitCentavos) && line.unitCentavos >= 0);
    if (!valid) { context.addIssue({ code: "custom", message: "Invalid lines." }); return z.NEVER; }
    return lines;
  }),
  subtotal_centavos: centavos,
  discount_centavos: centavos,
  total_centavos: centavos,
  shipping_address: z.string().max(1000).transform((value, context) => {
    try { return addressSchema.parse(JSON.parse(value)); }
    catch { context.addIssue({ code: "custom", message: "Invalid address." }); return z.NEVER; }
  }),
});

export const toPeso = (value: number) => (value / 100).toFixed(2);
