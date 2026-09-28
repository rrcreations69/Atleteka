import Link from "next/link";
import { MonitoringTest } from "@/components/admin/monitoring-test";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminPage() {
  const { user } = await requireAdmin();
  return (
    <AuthCard title="Admin" description="You are signed in with administrator access.">
      <p className="mb-5 break-all text-sm">{user.email}</p>
      <nav aria-label="Admin" className="mb-6">
        <ul className="space-y-3">
          <li><Link href="/admin/products" className="inline-flex min-h-11 items-center underline underline-offset-4">Products</Link></li>
          <li><Link href="/admin/categories" className="inline-flex min-h-11 items-center underline underline-offset-4">Categories</Link></li>
          <li><Link href="/admin/inventory" className="inline-flex min-h-11 items-center underline underline-offset-4">Inventory</Link></li>
          <li><Link href="/admin/orders" className="inline-flex min-h-11 items-center underline underline-offset-4">Orders</Link></li>
        </ul>
      </nav>
      <div className="mb-6"><MonitoringTest /></div>
      <Link href="/account" className="mb-5 block text-sm underline underline-offset-4">Your account</Link>
      <form action={logout}><Button type="submit" variant="outline">Sign out</Button></form>
    </AuthCard>
  );
}
