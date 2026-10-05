"use client";

import { useActionState } from "react";
import { deleteAddress, type AccountState } from "@/lib/account/actions";
import type { SavedAddress } from "@/lib/checkout/validation";

export function AddressList({ addresses }: { addresses: SavedAddress[] }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(deleteAddress, {});
  return <div className="space-y-4">
    <div role="status" aria-live="polite" className="text-sm empty:hidden">
      {state.error && <p className="text-destructive">{state.error}</p>}
      {state.message && <p>{state.message}</p>}
    </div>
    <ul className="grid gap-4 sm:grid-cols-2">
      {addresses.map((address) => <li key={address.id} className="flex flex-col justify-between gap-4 bg-card p-5">
        <address className="min-w-0 break-words text-sm not-italic leading-relaxed">
          <span className="font-semibold">{address.name}</span><br />{address.line1}{address.line2 ? <><br />{address.line2}</> : null}<br />
          {address.city}, {address.region} {address.postal_code}<br />Philippines
        </address>
        <form action={action}>
          <input type="hidden" name="addressId" value={address.id} />
          <button type="submit" disabled={pending} aria-label={"Remove address for " + address.name + ", " + address.line1}
            className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-60">
            {pending ? "Removing…" : "Remove"}
          </button>
        </form>
      </li>)}
    </ul>
  </div>;
}
