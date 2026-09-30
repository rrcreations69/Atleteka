"use client";

import { useActionState } from "react";
import { deleteAddress, type AccountState } from "@/lib/account/actions";
import type { SavedAddress } from "@/lib/checkout/validation";
import { Button } from "@/components/ui/button";

export function AddressList({ addresses }: { addresses: SavedAddress[] }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(deleteAddress, {});
  return <div className="space-y-4">
    <div role="status" aria-live="polite" className="text-sm">
      {state.error && <p className="text-destructive">{state.error}</p>}
      {state.message && <p>{state.message}</p>}
    </div>
    <ul className="space-y-4">
      {addresses.map((address) => <li key={address.id} className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border p-4">
        <address className="min-w-0 break-words not-italic">
          {address.name}<br />{address.line1}{address.line2 ? <><br />{address.line2}</> : null}<br />
          {address.city}, {address.region} {address.postal_code}<br />Philippines
        </address>
        <form action={action}>
          <input type="hidden" name="addressId" value={address.id} />
          <Button type="submit" variant="outline" disabled={pending} aria-label={`Remove address for ${address.name}, ${address.line1}`}>
            {pending ? "Removing…" : "Remove"}
          </Button>
        </form>
      </li>)}
    </ul>
  </div>;
}
