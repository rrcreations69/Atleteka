import "server-only";
import { z } from "zod";
import { orderStatusSchema, customerStatusLabel } from "@/lib/orders/status";
import { createSupabaseClient } from "@/lib/supabase/server";

const money = z.union([z.number(), z.string()]).transform(String);
const addressSchema = z.object({
  name: z.string(), line1: z.string(), line2: z.string().optional().default(""),
  city: z.string(), region: z.string(), postal_code: z.string(), country: z.string(),
});
const orderSummarySchema = z.object({
  id: z.uuid(), created_at: z.string(), status: orderStatusSchema,
  grand_total: money, order_items: z.array(z.object({ quantity: z.number().int() })),
});
const orderDetailSchema = z.object({
  id: z.uuid(), user_id: z.uuid().nullable(), created_at: z.string(),
  status: orderStatusSchema, payment_status: z.literal("paid"),
  courier: z.string().nullable(), tracking_number: z.string().nullable(),
  subtotal: money, discount_total: money, grand_total: money, currency: z.literal("PHP"),
  shipping_address: addressSchema,
  order_items: z.array(z.object({
    id: z.uuid(), sku: z.string(), product_name: z.string(), variant_name: z.string(),
    unit_price: money, quantity: z.number().int(), line_total: money,
  })),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

/** Own orders only: RLS enforces ownership and the query filters by the verified user as well. */
export async function listOwnOrders(userId: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from("orders")
    .select("id, created_at, status, grand_total, order_items(quantity)")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Your orders could not be loaded.");
  return z.array(orderSummarySchema).parse(data).map((order) => ({
    ...order, itemCount: order.order_items.reduce((sum, item) => sum + item.quantity, 0),
  }));
}

/** Returns null for malformed ids and for orders that are missing or belong to someone else. */
export async function getOwnOrder(userId: string, orderId: string) {
  if (!z.uuid().safeParse(orderId).success) return null;
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from("orders")
    .select("id, user_id, created_at, status, payment_status, courier, tracking_number, subtotal, discount_total, grand_total, currency, shipping_address, order_items(id, sku, product_name, variant_name, unit_price, quantity, line_total)")
    .eq("id", orderId).eq("user_id", userId).maybeSingle();
  if (error) throw new Error("This order could not be loaded.");
  if (!data) return null;
  const order = orderDetailSchema.parse(data);
  // Admins can read every order through RLS; this page is the customer's own view only.
  return order.user_id === userId ? order : null;
}

export const orderStatusLabel = customerStatusLabel;
