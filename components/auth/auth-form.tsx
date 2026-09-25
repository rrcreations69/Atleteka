"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, recover, resetPassword } from "@/lib/auth/actions";
import type { AuthState } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

const actions = { login, register, recover, reset: resetPassword };
const labels = { login: "Sign in", register: "Create account", recover: "Send reset link", reset: "Save password" };

export function AuthForm({ mode }: { mode: keyof typeof actions }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(actions[mode], {});
  return (
    <form action={action} className="space-y-5" aria-busy={pending}>
      <fieldset disabled={pending} className="min-w-0 space-y-5">
        <legend className="sr-only">{labels[mode]}</legend>
        {mode === "register" && <TextField id="displayName" name="displayName" label="Name" autoComplete="name" maxLength={80} required error={state.fields?.displayName} />}
        {mode !== "reset" && <TextField id="email" name="email" label="Email address" type="email" autoComplete="email" maxLength={254} required error={state.fields?.email} />}
        {mode !== "recover" && <TextField id="password" name="password" label={mode === "reset" ? "New password" : "Password"} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} maxLength={1024} required error={state.fields?.password} />}
        {mode === "reset" && <TextField id="confirmPassword" name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" maxLength={1024} required error={state.fields?.confirmPassword} />}
        <Button type="submit" className="w-full">{pending ? "Please wait..." : labels[mode]}</Button>
      </fieldset>
      <div aria-live="polite" aria-atomic="true">
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state.message && <p className="text-sm leading-relaxed">{state.message}</p>}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
        {mode === "login" ? <><Link href="/register" className="underline underline-offset-4">Create an account</Link><Link href="/login?mode=recover" className="underline underline-offset-4">Forgot password?</Link></>
          : <Link href="/login" className="underline underline-offset-4">Back to sign in</Link>}
      </div>
    </form>
  );
}
