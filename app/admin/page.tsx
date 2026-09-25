import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminPage() {
  const { user } = await requireAdmin();
  return (
    <AuthCard title="Admin" description="You are signed in with administrator access.">
      <p className="mb-5 break-all text-sm">{user.email}</p>
      <Link href="/account" className="mb-5 block text-sm underline underline-offset-4">Your account</Link>
      <form action={logout}><Button type="submit" variant="outline">Sign out</Button></form>
    </AuthCard>
  );
}
