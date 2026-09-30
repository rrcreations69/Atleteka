import Link from "next/link";
import { Container } from "@/components/layout/container";
import { listOwnOrders, orderStatusLabel } from "@/lib/account/orders";
import { requireIdentity } from "@/lib/auth/session";
import { formatPrice } from "@/lib/catalog/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your orders | Atleteka" };

const orderDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));

export default async function OrdersPage() {
  const { user } = await requireIdentity();
  const orders = await listOwnOrders(user.id);
  return <Container className="space-y-6 py-10 sm:py-16">
    <Link href="/account" className="inline-flex min-h-11 items-center underline underline-offset-4">Back to account</Link>
    <h1 className="text-3xl font-semibold">Your orders</h1>
    {orders.length === 0 ? <div className="space-y-3" role="status">
      <p>You have no orders yet.</p>
      <p><Link href="/shop" className="underline underline-offset-4">Browse products</Link></p>
    </div> : <ul className="divide-y divide-border rounded-lg border border-border">
      {orders.map((order) => <li key={order.id}>
        <Link href={`/order/${order.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-accent">
          <span className="min-w-0">
            <span className="block font-medium">{orderDate(order.created_at)}</span>
            <span className="block text-sm text-muted-foreground">{order.itemCount} {order.itemCount === 1 ? "item" : "items"} · {orderStatusLabel(order.status)}</span>
          </span>
          <span className="font-semibold">{formatPrice(order.grand_total)}</span>
        </Link>
      </li>)}
    </ul>}
  </Container>;
}
