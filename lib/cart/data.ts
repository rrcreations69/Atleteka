import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { createSupabaseClient } from "@/lib/supabase/server";
import { getAuthConfig } from "@/lib/supabase/config";
import { guestCartCookie, hasAuthCookie, validGuestToken } from "./cookie";
import { cartSchema } from "./validation";

export class CartAccessError extends Error {}

export async function createCartClient() {
  const store = await cookies();
  const { url, key, appUrl } = getAuthConfig();
  // Proxy overwrites this internal header; incoming browser headers have no authority.
  if ((await headers()).get("x-cart-session-error") === "1") {
    throw new CartAccessError("Your session could not be verified. Sign in again, or sign out to use your guest cart.");
  }
  if (hasAuthCookie(store.getAll(), url)) {
    const supabase = await createSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new CartAccessError("Your session could not be verified. Sign in again, or sign out to use your guest cart.");
    }
    return { client: supabase, kind: "account" as const };
  }
  const token = validGuestToken(store.get(guestCartCookie(appUrl).name)?.value);
  if (!token) throw new CartAccessError("Enable cookies and refresh this page to use your cart.");
  // Only this server-read cookie supplies the guest credential, never a request header or form field.
  return {
    client: createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "x-cart-token": token } },
    }),
    kind: "guest" as const,
  };
}

export async function getCart() {
  const { client, kind } = await createCartClient();
  const { data, error } = await client.rpc("read_cart");
  if (error) throw new Error("Unable to load cart.");
  return { cart: cartSchema.parse(data), kind };
}
