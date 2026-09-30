import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getAuthConfig } from "./config";

// Legacy service_role JWT or a current sb_secret_ key. Never exposed to the browser or logged.
const serviceKeySchema = z.string().regex(/^(sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);

// Privileged client for server-to-server work with no user session (the PayMongo webhook only).
export function createServiceSupabaseClient() {
  const key = serviceKeySchema.safeParse(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key.success) throw new Error("Supabase service access is not configured.");
  return createClient(getAuthConfig().url, key.data, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
