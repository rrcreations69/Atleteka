import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { Container } from "@/components/layout/container";
import { getAdminOrder } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/catalog/validation";
import { nextStatuses, orderStatusLabel, orderStatusSchema } from "@/lib/orders/status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order | Admin | Atleteka" };

const when = (value: string) =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
const label = (value: string) => { const parsed = orderStatusSchema.safeParse(value); return parsed.success ? orderStatusLabel[parsed.data] : value; };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getAdminOrder((await params).id);
  if (!order) notFound();
  const address = order.shipping_address;
  const history = [...order.order_status_history].sort((a, b) => a.changed_at.localeCompare(b.changed_at));
  return <Container className="space-y-8 py-10">
    <AdminNav />
    <div className="space-y-2">
      <Link href="/admin/orders" className="inline-flex min-h-11 items-center underline underline-offset-4">All orders</Link>
      <h1 className="text-3xl font-semibold">Order {order.id.slice(0, 8).toUpperCase()}</h1>
      <p className="text-sm text-muted-foreground">Placed {when(order.created_at)}</p>
      <p><span className="font-medium">Status:</span> {orderStatusLabel[order.status]} · <span className="font-medium">Payment:</span> {order.payment_status === "paid" ? "Paid" : order.payment_status} (set only by the verified payment webhook)</p>
      {order.status === "needs_review" && <p role="status" className="rounded-md border border-border p-3 text-sm">
        Flagged at payment time: an item may have sold out or the coupon was over its limit. Stock was not deducted for this order.
        Confirm you can fulfil it (and adjust inventory), or refund it in PayMongo and cancel it.
      </p>}
    </div>
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-labelledby="order-items" className="min-w-0 space-y-4">
        <h2 id="order-items" className="text-xl font-semibold">Items</h2>
        <ul className="space-y-3">
          {order.order_items.map((item) => <li key={item.id} className="break-words">
            <p>{item.product_name} · {item.variant_name} × {item.quantity}</p>
            <p className="text-sm text-muted-foreground">SKU {item.sku} · {formatPrice(item.unit_price)} each</p>
            <p>{formatPrice(item.line_total)}</p>
          </li>)}
        </ul>
        <dl className="space-y-2 border-t border-border pt-4">
          <div><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div><dt>Discount</dt><dd>{formatPrice(order.discount_total)}</dd></div>
          <div className="font-semibold"><dt>Amount paid</dt><dd>{formatPrice(order.grand_total)}</dd></div>
          <div><dt>Shipping</dt><dd>Customer pays the courier on delivery</dd></div>
        </dl>
      </section>
      <section aria-labelledby="order-customer" className="min-w-0 space-y-4">
        <h2 id="order-customer" className="text-xl font-semibold">Customer and delivery</h2>
        <p className="break-all">{order.email}{order.user_id ? " (account)" : " (guest)"}</p>
        <address className="not-italic break-words">
          {address.name}<br />{address.line1}{address.line2 ? <><br />{address.line2}</> : null}<br />
          {address.city}, {address.region} {address.postal_code}<br />Philippines
        </address>
        {(order.courier || order.tracking_number) && <p className="text-sm">Courier: {order.courier ?? "not specified"}{order.tracking_number ? ` · Tracking: ${order.tracking_number}` : ""}</p>}
        <p className="break-all text-xs text-muted-foreground">PayMongo payment {order.payment_id ?? "—"} · session {order.payment_session_id ?? "—"}</p>
      </section>
    </div>
    <section aria-labelledby="order-fulfillment" className="max-w-xl space-y-4">
      <h2 id="order-fulfillment" className="text-xl font-semibold">Fulfillment</h2>
      <OrderStatusForm key={order.status} orderId={order.id} next={nextStatuses[order.status]} />
    </section>
    <section aria-labelledby="order-history" className="space-y-3">
      <h2 id="order-history" className="text-xl font-semibold">Status history</h2>
      {history.length === 0 ? <p className="text-sm">No changes since the order was placed ({orderStatusLabel[order.status]}).</p>
        : <ol className="space-y-2 text-sm">{history.map((entry) => <li key={entry.id}>
          {when(entry.changed_at)}: {label(entry.from_status)} → {label(entry.to_status)}
          {entry.courier || entry.tracking_number ? ` (${[entry.courier, entry.tracking_number].filter(Boolean).join(", ")})` : ""}
        </li>)}</ol>}
    </section>
  </Container>;
}
