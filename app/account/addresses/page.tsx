import { AccountShell } from "@/components/account/account-shell";
import { AddressList } from "@/components/account/address-list";
import { requireIdentity } from "@/lib/auth/session";
import { getSavedAddresses } from "@/lib/checkout/data";
import { createSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved addresses" };

export default async function AddressesPage() {
  const { profile } = await requireIdentity();
  // Reuses the checkout reader: own rows only (verified user id + RLS).
  const addresses = await getSavedAddresses(await createSupabaseClient());
  return <AccountShell title="Addresses" isAdmin={profile.role === "admin"}
    description={<p>Addresses are saved when you confirm your total at checkout. Removing one here does not change past orders.</p>}>
    {addresses.length === 0
      ? <p role="status" className="bg-card px-6 py-12 text-center text-muted-foreground">You have no saved addresses yet.</p>
      : <AddressList addresses={addresses} />}
  </AccountShell>;
}
