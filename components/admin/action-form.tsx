"use client";

import { useActionState, type ReactNode } from "react";
import type { AdminState } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Action = (state: AdminState, form: FormData) => Promise<AdminState>;

/** Shared admin form: disables while pending and announces the result. Field errors render via `fields`. */
export function ActionForm({ action, submitLabel, pendingLabel = "Saving…", children, className, fieldsetClassName, variant, encType }: {
  action: Action; submitLabel: string; pendingLabel?: string; className?: string; fieldsetClassName?: string;
  variant?: "default" | "outline"; encType?: "multipart/form-data";
  children: ReactNode | ((errors: Record<string, string>) => ReactNode);
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(action, {});
  const errors = state.errors ?? {};
  return <form action={formAction} encType={encType} className={cn("space-y-3", className)}>
    <fieldset disabled={pending} className={cn("min-w-0 space-y-3", fieldsetClassName)}>
      {typeof children === "function" ? children(errors) : children}
      <Button type="submit" variant={variant}>{pending ? pendingLabel : submitLabel}</Button>
    </fieldset>
    <div role="status" aria-live="polite" className="text-sm">
      {state.error && <p className="text-destructive">{state.error}</p>}
      {!state.error && Object.keys(errors).length > 0 && <p className="text-destructive">Check the highlighted fields.</p>}
      {state.message && <p>{state.message}</p>}
    </div>
  </form>;
}

export function FieldError({ message, id }: { message?: string; id: string }) {
  return message ? <p id={id} className="text-sm text-destructive">{message}</p> : null;
}
