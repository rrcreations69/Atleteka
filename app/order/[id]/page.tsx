import { notFound } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { orderDate, orderNumber } from "@/components/account/order-rows";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOwnOrder, orderStatusLabel } from "@/lib/account/orders";
import { requireIdentity } from "@/lib/auth/session";
import { formatPrice } from "@/lib/catalog/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order" };

const notice = "border-l-2 bg-card p-4 text-sm";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, profile } = await requireIdentity();
  // Someone else's order and a nonexistent one look the same: not found.
  const order = await getOwnOrder(user.id, (await params).id);
  if (!order) notFound();
  const address = order.shipping_address;
  const shipped = order.status === "shipped" || order.status === "delivered";
  const discounted = Number(order.discount_total) > 0;
  return <AccountShell title={"Order " + orderNumber(order.id)} isAdmin={profile.role === "admin"} back={{ href: "/account/orders", label: "All orders" }}
    description={<p>Placed {orderDate(order.created_at, "long")}</p>}
    actions={<StatusBadge status={order.status} label={orderStatusLabel(order.status)} className="mb-1" />}>
    {order.status === "cancelled" && <p role="status" className={notice + " border-foreground"}>
      This order was cancelled. If you were charged, the refund is handled through the payment provider; contact us if you have questions.
    </p>}
    {order.status === "needs_review" && <p role="status" className={notice + " border-destructive"}>
      We need to check this order before shipping it (for example, an item sold out while you were paying). We will contact you by email.
    </p>}
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="order-items" className="min-w-0 space-y-2">
        <h2 id="order-items" className="text-xl">Items</h2>
        <ul className="border-t border-border">
          {order.order_items.map((item) => <li key={item.id} className="flex items-start justify-between gap-4 border-b border-border py-4">
            <div className="min-w-0 space-y-1">
              <p className="break-words font-semibold">{item.product_name}</p>
              <p className="break-words text-sm text-muted-foreground">{item.variant_name} · Qty {item.quantity}</p>
              <p className="break-words text-xs text-muted-foreground">{formatPrice(item.unit_price)} each · SKU {item.sku}</p>
            </div>
            <p className="shrink-0 font-semibold tabular-nums">{formatPrice(item.line_total)}</p>
          </li>)}
        </ul>
      </section>
      <div className="space-y-4">
        <section aria-labelledby="order-summary" className="space-y-4 bg-card p-5 sm:p-6">
          <h2 id="order-summary" className="text-lg">Summary</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
            {discounted && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Discount</dt><dd className="tabular-nums text-success">−{formatPrice(order.discount_total)}</dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Shipping</dt><dd className="text-right">Paid to the courier on delivery</dd></div>
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4 text-base font-semibold"><dt>Amount paid</dt><dd className="text-xl tabular-nums">{formatPrice(order.grand_total)}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">Prices include tax.</p>
        </section>
        <section aria-labelledby="order-delivery" className="space-y-3 bg-card p-5 sm:p-6">
          <h2 id="order-delivery" className="text-lg">Delivery</h2>
          <address className="break-words text-sm not-italic leading-relaxed">
            <span className="font-semibold">{address.name}</span><br />{address.line1}{address.line2 ? <><br />{address.line2}</> : null}<br />
            {address.city}, {address.region} {address.postal_code}<br />Philippines
          </address>
          {shipped && (order.courier || order.tracking_number) && <dl className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Courier</dt><dd className="text-right">{order.courier ?? "Not specified"}</dd></div>
            {order.tracking_number && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Tracking number</dt><dd className="break-all text-right font-semibold">{order.tracking_number}</dd></div>}
          </dl>}
        </section>
      </div>
    </div>
  </AccountShell>;
}
