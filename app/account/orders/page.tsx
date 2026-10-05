import Link from "next/link";
import { AccountShell } from "@/components/account/account-shell";
import { OrderRows } from "@/components/account/order-rows";
import { buttonVariants } from "@/components/ui/button";
import { listOwnOrders } from "@/lib/account/orders";
import { requireIdentity } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const { user, profile } = await requireIdentity();
  const orders = await listOwnOrders(user.id);
  return <AccountShell title="Orders" isAdmin={profile.role === "admin"}
    description={orders.length > 0 ? <p>{orders.length} {orders.length === 1 ? "order" : "orders"}, newest first. Orders placed as a guest are not listed here.</p> : undefined}>
    {orders.length === 0
      ? <div role="status" className="space-y-4 bg-card px-6 py-12 text-center">
        <p className="text-lg font-semibold">You have no orders yet</p>
        <p className="text-sm text-muted-foreground">Orders you place while signed in appear here.</p>
        <Link href="/shop" className={buttonVariants()}>Browse products</Link>
      </div>
      : <OrderRows orders={orders} />}
  </AccountShell>;
}
