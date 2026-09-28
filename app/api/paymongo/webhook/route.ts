import { NextResponse } from "next/server";
import { getPaidCheckoutSession, isLiveMode } from "@/lib/payment/paymongo";
import { parseEvent, paymentMetadataSchema, toPeso, verifySignature } from "@/lib/payment/webhook";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const PAID_EVENT = "checkout_session.payment.paid";
// PayMongo treats 200–209 with a JSON body as delivered; anything else is retried.
const ok = (body: Record<string, unknown> = { received: true }) => NextResponse.json(body, { status: 200 });
const fail = (status: number, code: string) => NextResponse.json({ error: code }, { status });

export async function POST(request: Request) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET ?? "";
  if (!secret) return fail(500, "not_configured");
  // Verify the exact bytes PayMongo signed before parsing anything.
  const rawBody = await request.text();
  const live = isLiveMode();
  if (!verifySignature(request.headers.get("paymongo-signature"), rawBody, secret, live, Math.floor(Date.now() / 1000))) {
    return fail(401, "invalid_signature");
  }
  const event = parseEvent(rawBody);
  if (!event) return fail(400, "invalid_event");
  if (event.livemode !== live) return ok({ received: true, ignored: "mode" });
  if (event.type !== PAID_EVENT) return ok({ received: true, ignored: "type" });
  if (!event.sessionId) return fail(400, "missing_session");

  try {
    const session = await getPaidCheckoutSession(event.sessionId);
    if (!session || session.livemode !== live) return fail(409, "session_not_paid");
    const metadata = paymentMetadataSchema.safeParse(session.metadata);
    if (!metadata.success) return fail(422, "unknown_session");
    const meta = metadata.data;
    if (session.amountCentavos !== meta.total_centavos) {
      console.error("paymongo_webhook amount_mismatch", event.id);
      return fail(422, "amount_mismatch");
    }
    const email = session.email?.trim();
    if (!email) return fail(422, "missing_email");

    const { data, error } = await createServiceSupabaseClient().rpc("record_paid_checkout", {
      p_event_id: event.id, p_event_type: event.type, p_session_id: session.id, p_payment_ref: session.paymentId,
      p_customer_email: email, p_customer_id: meta.user_id || null, p_cart_ref: meta.cart_id,
      p_coupon_code: meta.coupon_code || null,
      p_lines: meta.lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity, unitPrice: toPeso(line.unitCentavos) })),
      p_subtotal: toPeso(meta.subtotal_centavos), p_discount_total: toPeso(meta.discount_centavos),
      p_amount_paid: toPeso(session.amountCentavos), p_address: meta.shipping_address,
    });
    if (error) {
      // Codes only: no payload, customer data or database message in logs.
      console.error("paymongo_webhook record_failed", event.id, error.code);
      return fail(500, "record_failed");
    }
    return ok({ received: true, duplicate: Boolean((data as { duplicate?: boolean } | null)?.duplicate) });
  } catch {
    console.error("paymongo_webhook processing_failed", event.id);
    return fail(500, "processing_failed");
  }
}
