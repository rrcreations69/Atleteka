import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Container } from "@/components/layout/container";
import { listAdminOrders } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/catalog/validation";
import { orderStatusLabel, orderStatusSchema, orderStatuses } from "@/lib/orders/status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders | Admin | Atleteka" };

const orderDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const status = orderStatusSchema.safeParse((await searchParams).status).data ?? null;
  const orders = await listAdminOrders(status);
  return <Container className="space-y-8 py-10">
    <AdminNav />
    <h1 className="text-3xl font-semibold">Orders</h1>
    <nav aria-label="Filter orders by status" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <Link href="/admin/orders" aria-current={status === null ? "page" : undefined} className="inline-flex min-h-11 items-center underline underline-offset-4 aria-[current=page]:font-semibold">All</Link>
      {orderStatuses.map((value) => <Link key={value} href={`/admin/orders?status=${value}`} aria-current={status === value ? "page" : undefined}
        className="inline-flex min-h-11 items-center underline underline-offset-4 aria-[current=page]:font-semibold">{orderStatusLabel[value]}</Link>)}
    </nav>
    {orders.length === 0 ? <p role="status">No orders{status ? ` with status "${orderStatusLabel[status]}"` : ""}.</p>
      : <ul className="divide-y divide-border rounded-lg border border-border">
        {orders.map((order) => <li key={order.id}>
          <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-accent">
            <span className="min-w-0">
              <span className="block font-medium">{orderDate(order.created_at)} · {order.id.slice(0, 8).toUpperCase()}</span>
              <span className="block break-all text-sm text-muted-foreground">{order.email}{order.user_id ? "" : " (guest)"} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}</span>
            </span>
            <span className="text-right">
              <span className="block font-semibold">{formatPrice(order.grand_total)}</span>
              <span className="block text-sm">{orderStatusLabel[order.status]}</span>
            </span>
          </Link>
        </li>)}
      </ul>}
  </Container>;
}
