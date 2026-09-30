"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireIdentity } from "@/lib/auth/session";
import { createSupabaseClient } from "@/lib/supabase/server";

export type AccountState = { error?: string; message?: string };

export async function deleteAddress(_state: AccountState, form: FormData): Promise<AccountState> {
  const ids = form.getAll("addressId");
  const id = z.uuid().safeParse(ids.length === 1 ? ids[0] : null);
  if (!id.success) return { error: "That address could not be removed." };
  const { user } = await requireIdentity();
  const supabase = await createSupabaseClient();
  // Owner filter plus RLS: another account's id deletes nothing.
  const { data, error } = await supabase.from("addresses").delete().eq("id", id.data).eq("user_id", user.id).select("id");
  if (error || !data?.length) return { error: "That address could not be removed." };
  revalidatePath("/account/addresses");
  return { message: "Address removed." };
}

const displayNameSchema = z.string().trim().min(1, "Enter your name.").max(80, "Use 80 characters or fewer.");

export async function updateDisplayName(_state: AccountState, form: FormData): Promise<AccountState> {
  const values = form.getAll("displayName");
  const name = displayNameSchema.safeParse(values.length === 1 ? values[0] : null);
  if (!name.success) return { error: name.error.issues[0]?.message ?? "Enter your name." };
  const { user } = await requireIdentity();
  const supabase = await createSupabaseClient();
  // Only display_name is granted to customers; role cannot be changed here.
  const { data, error } = await supabase.from("profiles").update({ display_name: name.data }).eq("id", user.id).select("id");
  if (error || !data?.length) return { error: "Your name could not be saved. Please try again." };
  revalidatePath("/account", "layout");
  return { message: "Name saved." };
}
