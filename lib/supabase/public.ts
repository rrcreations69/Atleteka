import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getAuthConfig } from "./config";

// Public storefront reads must not inherit an administrator's session or RLS privileges.
export function createPublicSupabaseClient() {
  const { url, key } = getAuthConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
