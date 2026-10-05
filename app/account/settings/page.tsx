import Link from "next/link";
import { AccountShell } from "@/components/account/account-shell";
import { SettingsForm } from "@/components/account/settings-form";
import { requireIdentity } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings | Atleteka" };

export default async function SettingsPage() {
  const { user, profile } = await requireIdentity();
  return <AccountShell title="Settings" isAdmin={profile.role === "admin"}>
    <div className="max-w-xl divide-y divide-border border-b border-border [&>section:first-child]:pt-0">
      <section aria-labelledby="settings-name" className="space-y-4 py-6">
        <div className="space-y-1">
          <h2 id="settings-name" className="text-lg">Name</h2>
          <p className="text-sm text-muted-foreground">Shown on your account.</p>
        </div>
        <SettingsForm displayName={profile.display_name} />
      </section>
      <section aria-labelledby="settings-email" className="space-y-1 py-6">
        <h2 id="settings-email" className="text-lg">Email</h2>
        <p className="break-all text-sm">{user.email}</p>
      </section>
      <section aria-labelledby="settings-password" className="space-y-1 py-6">
        <h2 id="settings-password" className="text-lg">Password</h2>
        <p className="text-sm">To change your password, <Link href="/login?mode=recover" className="underline underline-offset-4">request a reset link</Link>.</p>
      </section>
    </div>
  </AccountShell>;
}
