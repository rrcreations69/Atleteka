import { guestTokenSchema } from "./validation";

export const GUEST_CART_MAX_AGE = 60 * 60 * 24 * 30;

export function guestCartCookie(appUrl: string) {
  const secure = new URL(appUrl).protocol === "https:";
  return {
    name: secure ? "__Host-atleteka-cart" : "atleteka-cart",
    options: { httpOnly: true, sameSite: "lax" as const, secure, path: "/", maxAge: GUEST_CART_MAX_AGE },
  };
}
export function validGuestToken(value: unknown): string | null {
  const token = guestTokenSchema.safeParse(value);
  return token.success ? token.data : null;
}
export function hasAuthCookie(cookies: { name: string; value: string }[], supabaseUrl: string) {
  const base = "sb-" + new URL(supabaseUrl).hostname.split(".")[0] + "-auth-token";
  return cookies.some(({ name, value }) => value && (name === base || new RegExp("^" + base + "\\.\\d+$").test(name)));
}
