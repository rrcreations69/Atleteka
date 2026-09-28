import Link from "next/link";
import { AddressList } from "@/components/account/address-list";
import { Container } from "@/components/layout/container";
import { requireIdentity } from "@/lib/auth/session";
import { getSavedAddresses } from "@/lib/checkout/data";
import { createSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved addresses | Atleteka" };

export default async function AddressesPage() {
  await requireIdentity();
  // Reuses the checkout reader: own rows only (verified user id + RLS).
  const addresses = await getSavedAddresses(await createSupabaseClient());
  return <Container className="space-y-6 py-10 sm:py-16">
    <Link href="/account" className="inline-flex min-h-11 items-center underline underline-offset-4">Back to account</Link>
    <h1 className="text-3xl font-semibold">Saved addresses</h1>
    <p className="text-sm text-muted-foreground">Addresses are saved when you check your total at checkout. Removing one here does not change past orders.</p>
    {addresses.length === 0
      ? <p role="status">You have no saved addresses yet.</p>
      : <AddressList addresses={addresses} />}
  </Container>;
}
