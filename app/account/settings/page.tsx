import Link from "next/link";
import { SettingsForm } from "@/components/account/settings-form";
import { AuthCard } from "@/components/auth/auth-card";
import { requireIdentity } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings | Atleteka" };

export default async function SettingsPage() {
  const { user, profile } = await requireIdentity();
  return <AuthCard title="Settings" description="Update the name shown on your account.">
    <div className="space-y-6">
      <SettingsForm displayName={profile.display_name} />
      <dl className="text-sm"><dt className="text-muted-foreground">Email</dt><dd className="break-all">{user.email}</dd></dl>
      <p className="text-sm">To change your password, <Link href="/login?mode=recover" className="underline underline-offset-4">request a reset link</Link>.</p>
      <p><Link href="/account" className="inline-flex min-h-11 items-center underline underline-offset-4">Back to account</Link></p>
    </div>
  </AuthCard>;
}
