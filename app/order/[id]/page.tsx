import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { getOwnOrder, orderStatusLabel } from "@/lib/account/orders";
import { requireIdentity } from "@/lib/auth/session";
import { formatPrice } from "@/lib/catalog/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order | Atleteka" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireIdentity();
  // Someone else's order and a nonexistent one look the same: not found.
  const order = await getOwnOrder(user.id, (await params).id);
  if (!order) notFound();
  const address = order.shipping_address;
  const placed = new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(order.created_at));
  return <Container className="space-y-8 py-10 sm:py-16">
    <Link href="/account/orders" className="inline-flex min-h-11 items-center underline underline-offset-4">Back to your orders</Link>
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold">Order details</h1>
      <p className="text-sm text-muted-foreground">Placed {placed} · Order {order.id.slice(0, 8).toUpperCase()}</p>
      <p><span className="font-medium">Status:</span> {orderStatusLabel(order.status)} · Paid</p>
      {order.status === "shipped" || order.status === "delivered" ? (order.courier || order.tracking_number) && <p className="text-sm">
        Courier: {order.courier ?? "not specified"}{order.tracking_number ? <> · Tracking number: <span className="break-all">{order.tracking_number}</span></> : null}
      </p> : null}
      {order.status === "cancelled" && <p role="status" className="rounded-md border border-border p-3 text-sm">
        This order was cancelled. If you were charged, the refund is handled through the payment provider; contact us if you have questions.
      </p>}
      {order.status === "needs_review" && <p role="status" className="rounded-md border border-border p-3 text-sm">
        We need to check this order before shipping it (for example, an item sold out while you were paying). We will contact you by email.
      </p>}
    </div>
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-labelledby="order-items" className="min-w-0 space-y-4">
        <h2 id="order-items" className="text-xl font-semibold">Items</h2>
        <ul className="space-y-3">
          {order.order_items.map((item) => <li key={item.id} className="break-words">
            <p>{item.product_name} · {item.variant_name} × {item.quantity}</p>
            <p className="text-sm text-muted-foreground">{formatPrice(item.unit_price)} each · SKU {item.sku}</p>
            <p>{formatPrice(item.line_total)}</p>
          </li>)}
        </ul>
      </section>
      <section aria-labelledby="order-summary" className="min-w-0 space-y-5 rounded-lg border border-border p-5">
        <h2 id="order-summary" className="text-xl font-semibold">Summary</h2>
        <dl className="space-y-3">
          <div><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div><dt>Discount</dt><dd>{formatPrice(order.discount_total)}</dd></div>
          <div><dt>Tax</dt><dd>Included in prices</dd></div>
          <div><dt>Shipping</dt><dd>Paid to the courier on delivery (not included)</dd></div>
          <div className="font-semibold"><dt>Amount paid</dt><dd>{formatPrice(order.grand_total)}</dd></div>
        </dl>
        <div className="border-t border-border pt-4">
          <h3 className="font-medium">Delivery address</h3>
          <address className="not-italic break-words text-sm">
            {address.name}<br />{address.line1}{address.line2 ? <><br />{address.line2}</> : null}<br />
            {address.city}, {address.region} {address.postal_code}<br />Philippines
          </address>
        </div>
      </section>
    </div>
  </Container>;
}
