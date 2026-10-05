import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, adminPanel, adminWhen } from "@/components/admin/admin-nav";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminOrder } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/catalog/validation";
import { nextStatuses, orderStatusLabel, orderStatusSchema } from "@/lib/orders/status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order | Admin | Atleteka" };

const label = (value: string) => { const parsed = orderStatusSchema.safeParse(value); return parsed.success ? orderStatusLabel[parsed.data] : value; };
const row = "flex justify-between gap-4";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getAdminOrder((await params).id);
  if (!order) notFound();
  const address = order.shipping_address;
  const history = [...order.order_status_history].sort((a, b) => a.changed_at.localeCompare(b.changed_at));
  const discounted = Number(order.discount_total) > 0;
  return <AdminShell title={"Order " + order.id.slice(0, 8).toUpperCase()}
    description={<p>Placed {adminWhen(order.created_at)} · Payment: {order.payment_status === "paid" ? "Paid" : order.payment_status} (set only by the verified payment webhook)</p>}
    actions={<StatusBadge status={order.status} label={orderStatusLabel[order.status]} className="mb-1" />}>
    <Link href="/admin/orders" className="eyebrow -mt-4 inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><span aria-hidden="true">←</span> All orders</Link>
    {order.status === "needs_review" && <p role="status" className="border-l-2 border-destructive bg-card p-4 text-sm">
      Flagged at payment time: an item may have sold out or the coupon was over its limit. Stock was not deducted for this order.
      Confirm you can fulfil it (and adjust inventory), or refund it in PayMongo and cancel it.
    </p>}
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-10">
        <section aria-labelledby="order-items" className="space-y-2">
          <h2 id="order-items" className="text-xl">Items</h2>
          <ul className="border-t border-border">
            {order.order_items.map((item) => <li key={item.id} className="flex items-start justify-between gap-4 border-b border-border py-4">
              <div className="min-w-0 space-y-1">
                <p className="break-words font-semibold">{item.product_name}</p>
                <p className="break-words text-sm text-muted-foreground">{item.variant_name} · Qty {item.quantity}</p>
                <p className="break-words text-xs text-muted-foreground">SKU {item.sku} · {formatPrice(item.unit_price)} each</p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">{formatPrice(item.line_total)}</p>
            </li>)}
          </ul>
          <dl className="ml-auto max-w-sm space-y-2 pt-2 text-sm">
            <div className={row}><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
            {discounted && <div className={row}><dt className="text-muted-foreground">Discount</dt><dd className="tabular-nums">−{formatPrice(order.discount_total)}</dd></div>}
            <div className={row}><dt className="text-muted-foreground">Shipping</dt><dd className="text-right">Customer pays the courier on delivery</dd></div>
            <div className={row + " border-t border-border pt-3 text-base font-semibold"}><dt>Amount paid</dt><dd className="tabular-nums">{formatPrice(order.grand_total)}</dd></div>
          </dl>
        </section>
        <section aria-labelledby="order-history" className="space-y-3">
          <h2 id="order-history" className="text-xl">Status history</h2>
          {history.length === 0 ? <p className="text-sm text-muted-foreground">No changes since the order was placed ({orderStatusLabel[order.status]}).</p>
            : <ol className="space-y-3 border-l border-border pl-5 text-sm">{history.map((entry) => <li key={entry.id} className="relative">
              <span aria-hidden="true" className="absolute -left-[1.5625rem] top-1.5 size-2 rounded-full bg-foreground" />
              <p className="font-semibold">{label(entry.from_status)} → {label(entry.to_status)}</p>
              <p className="text-muted-foreground">{adminWhen(entry.changed_at)}{entry.courier || entry.tracking_number ? " · " + [entry.courier, entry.tracking_number].filter(Boolean).join(", ") : ""}</p>
            </li>)}</ol>}
        </section>
      </div>
      <div className="space-y-4">
        <section aria-labelledby="order-fulfillment" className={adminPanel}>
          <h2 id="order-fulfillment" className="text-lg">Fulfillment</h2>
          <OrderStatusForm key={order.status} orderId={order.id} next={nextStatuses[order.status]} />
        </section>
        <section aria-labelledby="order-customer" className={adminPanel}>
          <h2 id="order-customer" className="text-lg">Customer and delivery</h2>
          <p className="break-all text-sm">{order.email} <span className="text-muted-foreground">{order.user_id ? "(account)" : "(guest)"}</span></p>
          <address className="break-words text-sm not-italic leading-relaxed">
            <span className="font-semibold">{address.name}</span><br />{address.line1}{address.line2 ? <><br />{address.line2}</> : null}<br />
            {address.city}, {address.region} {address.postal_code}<br />Philippines
          </address>
          {(order.courier || order.tracking_number) && <dl className="space-y-2 border-t border-border pt-3 text-sm">
            <div className={row}><dt className="text-muted-foreground">Courier</dt><dd className="text-right">{order.courier ?? "Not specified"}</dd></div>
            {order.tracking_number && <div className={row}><dt className="text-muted-foreground">Tracking</dt><dd className="break-all text-right font-semibold">{order.tracking_number}</dd></div>}
          </dl>}
          <p className="break-all border-t border-border pt-3 text-xs text-muted-foreground">PayMongo payment {order.payment_id ?? "—"} · session {order.payment_session_id ?? "—"}</p>
        </section>
      </div>
    </div>
  </AdminShell>;
}
