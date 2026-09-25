import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/server";
import { profileSchema } from "./validation";

export async function getIdentity() {
  const supabase = await createSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const result = await supabase.from("profiles").select("id, display_name, role").eq("id", user.id).single();
  const profile = profileSchema.safeParse(result.data);
  if (result.error || !profile.success || profile.data.id !== user.id) {
    throw new Error("Your account could not be loaded. Please try again.");
  }
  return { user, profile: profile.data };
}

export async function requireIdentity() {
  const identity = await getIdentity();
  if (!identity) redirect("/login");
  return identity;
}

export async function requireAdmin() {
  const identity = await requireIdentity();
  if (identity.profile.role !== "admin") redirect("/account");
  return identity;
}
