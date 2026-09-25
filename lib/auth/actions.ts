"use server";

import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/server";
import { getAuthConfig } from "@/lib/supabase/config";
import {
  loginSchema, registerSchema, recoverySchema, passwordSchema, validationError, type AuthState,
} from "./validation";

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const input = loginSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return validationError(input.error);
  const supabase = await createSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(input.data);
  if (error) return { error: "Unable to sign in. Check your email, password and email confirmation." };
  redirect("/account");
}

export async function register(_state: AuthState, formData: FormData): Promise<AuthState> {
  const input = registerSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return validationError(input.error);
  const supabase = await createSupabaseClient();
  const { email, password, displayName } = input.data;
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: new URL("/login", getAuthConfig().appUrl).href,
    },
  });
  if (error) {
    return { error: error.code === "weak_password"
      ? "Choose a stronger password that meets the account password requirements."
      : "Unable to register. Try again later, or sign in if you already have an account." };
  }
  if (data.session) redirect("/account");
  return { message: "Check your email for a confirmation link. Open it in this browser to finish signing up." };
}

export async function recover(_state: AuthState, formData: FormData): Promise<AuthState> {
  const input = recoverySchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return validationError(input.error);
  const supabase = await createSupabaseClient();
  await supabase.auth.resetPasswordForEmail(input.data.email, {
    redirectTo: new URL("/login", getAuthConfig().appUrl).href,
  });
  // The response is identical for existing and unknown accounts.
  return { message: "If an account can receive a reset email, a link will arrive shortly. Open it in this browser." };
}

export async function resetPassword(_state: AuthState, formData: FormData): Promise<AuthState> {
  const input = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return validationError(input.error);
  const supabase = await createSupabaseClient();
  const { data: { user }, error: identityError } = await supabase.auth.getUser();
  if (identityError || !user) return { error: "This link has expired. Request a new password reset link." };
  const { error } = await supabase.auth.updateUser({ password: input.data.password });
  if (error) return { error: "Unable to update your password. Use a different, stronger password or request a new link." };
  redirect("/account");
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw new Error("Unable to sign out. Please try again.");
  redirect("/login");
}
