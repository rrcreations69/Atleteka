import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getAuthConfig } from "@/lib/supabase/config";
import { buildOrderConfirmation } from "./order-confirmation";
import { brand } from "@/lib/brand";
import { sendEmail } from "./resend";

const money = z.union([z.number(), z.string()]).transform(String);
const orderSchema = z.object({
  id: z.uuid(), created_at: z.string(), email: z.string(), user_id: z.uuid().nullable(),
  subtotal: money, discount_total: money, grand_total: money, confirmation_email_sent_at: z.string().nullable(),
  shipping_address: z.object({ name: z.string(), line1: z.string(), line2: z.string().optional(), city: z.string(), region: z.string(), postal_code: z.string() }),
  order_items: z.array(z.object({ product_name: z.string(), variant_name: z.string(), sku: z.string(), quantity: z.number().int(), unit_price: money, line_total: money })),
});

/**
 * Sends the confirmation once (M13-P01). Safe to call on every webhook delivery: a sent order is skipped,
 * and Resend's idempotency key covers two deliveries racing. Throws on failure so the webhook asks for a retry.
 */
export async function sendOrderConfirmation(service: SupabaseClient, orderId: string) {
  const { data, error } = await service.from("orders")
    .select("id, created_at, email, user_id, subtotal, discount_total, grand_total, confirmation_email_sent_at, shipping_address, order_items(product_name, variant_name, sku, quantity, unit_price, line_total)")
    .eq("id", orderId).maybeSingle();
  if (error || !data) throw new Error("Order not found for confirmation.");
  const order = orderSchema.parse(data);
  if (order.confirmation_email_sent_at) return "already_sent" as const;
  const email = buildOrderConfirmation({
    id: order.id, createdAt: order.created_at, accountOrder: order.user_id !== null,
    subtotal: order.subtotal, discountTotal: order.discount_total, grandTotal: order.grand_total,
    address: order.shipping_address,
    items: order.order_items.map((item) => ({
      productName: item.product_name, variantName: item.variant_name, sku: item.sku,
      quantity: item.quantity, unitPrice: item.unit_price, lineTotal: item.line_total,
    })),
  }, getAuthConfig().appUrl, {
    name: brand.name, ink: brand.colors.ink, primary: brand.colors.primary,
    // Email apps need an absolute image URL, and Gmail does not show SVG: use a PNG or JPG logo.
    logoUrl: brand.logo ? new URL(brand.logo.src, getAuthConfig().appUrl).href : null,
  });
  await sendEmail({ to: order.email, ...email, idempotencyKey: `order-confirmation-${order.id}` });
  // Only the first successful sender stamps it; a concurrent duplicate was already absorbed by Resend.
  await service.from("orders").update({ confirmation_email_sent_at: new Date().toISOString() })
    .eq("id", order.id).is("confirmation_email_sent_at", null);
  return "sent" as const;
}
