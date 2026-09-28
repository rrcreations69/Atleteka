import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { orderStatusSchema, type OrderStatus } from "@/lib/orders/status";
import { createSupabaseClient } from "@/lib/supabase/server";

const money = z.union([z.number(), z.string()]).transform(String);

/** Admin-only: requireAdmin() here, and RLS lets only admins read other customers' orders. */
export async function listAdminOrders(status: OrderStatus | null) {
  await requireAdmin();
  const supabase = await createSupabaseClient();
  let query = supabase.from("orders")
    .select("id, created_at, email, status, grand_total, user_id, order_items(quantity)")
    .order("created_at", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error("Orders could not be loaded.");
  return z.array(z.object({
    id: z.uuid(), created_at: z.string(), email: z.string(), status: orderStatusSchema, grand_total: money,
    user_id: z.uuid().nullable(), order_items: z.array(z.object({ quantity: z.number().int() })),
  })).parse(data).map((order) => ({ ...order, itemCount: order.order_items.reduce((sum, item) => sum + item.quantity, 0) }));
}

export async function getAdminOrder(orderId: string) {
  if (!z.uuid().safeParse(orderId).success) return null;
  await requireAdmin();
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from("orders")
    .select("id, created_at, email, user_id, status, payment_status, payment_id, payment_session_id, subtotal, discount_total, grand_total, currency, shipping_address, courier, tracking_number, status_updated_at, order_items(id, sku, product_name, variant_name, unit_price, quantity, line_total), order_status_history(id, from_status, to_status, courier, tracking_number, changed_at)")
    .eq("id", orderId).maybeSingle();
  if (error) throw new Error("This order could not be loaded.");
  if (!data) return null;
  return z.object({
    id: z.uuid(), created_at: z.string(), email: z.string(), user_id: z.uuid().nullable(),
    status: orderStatusSchema, payment_status: z.string(), payment_id: z.string().nullable(), payment_session_id: z.string().nullable(),
    subtotal: money, discount_total: money, grand_total: money, currency: z.string(),
    shipping_address: z.object({ name: z.string(), line1: z.string(), line2: z.string().optional().default(""), city: z.string(), region: z.string(), postal_code: z.string(), country: z.string() }),
    courier: z.string().nullable(), tracking_number: z.string().nullable(), status_updated_at: z.string().nullable(),
    order_items: z.array(z.object({ id: z.uuid(), sku: z.string(), product_name: z.string(), variant_name: z.string(), unit_price: money, quantity: z.number().int(), line_total: money })),
    order_status_history: z.array(z.object({
      id: z.uuid(), from_status: z.string(), to_status: z.string(), courier: z.string().nullable(), tracking_number: z.string().nullable(), changed_at: z.string(),
    })),
  }).parse(data);
}
export type AdminOrder = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;
