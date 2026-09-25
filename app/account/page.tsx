import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { requireIdentity } from "@/lib/auth/session";

export default async function AccountPage() {
  const { user, profile } = await requireIdentity();
  return (
    <AuthCard title="Your account" description={profile.display_name ? `Welcome, ${profile.display_name}.` : "You are signed in."}>
      <dl className="mb-6 space-y-3 text-sm">
        <div><dt className="text-muted-foreground">Email</dt><dd className="break-all">{user.email}</dd></div>
        <div><dt className="text-muted-foreground">Role</dt><dd>{profile.role}</dd></div>
      </dl>
      {profile.role === "admin" && <Link href="/admin" className="mb-5 block underline underline-offset-4">Open admin</Link>}
      <form action={logout}><Button type="submit" variant="outline">Sign out</Button></form>
    </AuthCard>
  );
}
