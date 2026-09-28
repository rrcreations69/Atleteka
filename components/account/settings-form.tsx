"use client";

import { useActionState } from "react";
import { updateDisplayName, type AccountState } from "@/lib/account/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

export function SettingsForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateDisplayName, {});
  return <form action={action} className="space-y-4">
    <TextField id="settings-display-name" name="displayName" label="Name" autoComplete="name" maxLength={80}
      required defaultValue={displayName} error={state.error} />
    <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save name"}</Button>
    <div role="status" aria-live="polite" className="text-sm">{state.message && <p>{state.message}</p>}</div>
  </form>;
}
