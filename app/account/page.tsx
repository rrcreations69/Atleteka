import Link from "next/link";
import { AccountShell } from "@/components/account/account-shell";
import { OrderRows } from "@/components/account/order-rows";
import { buttonVariants } from "@/components/ui/button";
import { listOwnOrders } from "@/lib/account/orders";
import { requireIdentity } from "@/lib/auth/session";
import { getSavedAddresses } from "@/lib/checkout/data";
import { createSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account | Atleteka" };

const panel = "space-y-4 bg-card p-5 sm:p-6";
const panelLink = "inline-flex min-h-11 items-center text-sm underline underline-offset-4";

export default async function AccountPage() {
  const { user, profile } = await requireIdentity();
  const [orders, addresses] = await Promise.all([listOwnOrders(user.id), getSavedAddresses(await createSupabaseClient())]);
  return (
    <AccountShell title={profile.display_name ? "Hi, " + profile.display_name : "Your account"}
      description={<p className="break-all">{user.email}</p>} isAdmin={profile.role === "admin"}>
      <section aria-labelledby="recent-orders" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent-orders" className="text-xl">Recent orders</h2>
          {orders.length > 0 && <Link href="/account/orders" className={panelLink}>View all</Link>}
        </div>
        {orders.length === 0
          ? <div className="space-y-4 bg-card px-6 py-10 text-center">
            <p className="text-muted-foreground">You have no orders yet.</p>
            <Link href="/shop" className={buttonVariants()}>Browse products</Link>
          </div>
          : <OrderRows orders={orders.slice(0, 3)} />}
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="addresses-summary" className={panel}>
          <h2 id="addresses-summary" className="text-lg">Saved addresses</h2>
          <p className="text-sm text-muted-foreground">{addresses.length === 0
            ? "None yet. Addresses are saved when you confirm your total at checkout."
            : addresses.length + (addresses.length === 1 ? " saved address." : " saved addresses.")}</p>
          <Link href="/account/addresses" className={panelLink}>Manage addresses</Link>
        </section>
        <section aria-labelledby="settings-summary" className={panel}>
          <h2 id="settings-summary" className="text-lg">Settings</h2>
          <p className="text-sm text-muted-foreground">Your name, email and password.</p>
          <Link href="/account/settings" className={panelLink}>Open settings</Link>
        </section>
      </div>
    </AccountShell>
  );
}
