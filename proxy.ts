import { randomBytes } from "node:crypto";
import { guestCartCookie, hasAuthCookie, validGuestToken } from "@/lib/cart/cookie";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { authCookieOptions, getAuthConfig } from "@/lib/supabase/config";
import { callbackCodeSchema } from "@/lib/auth/validation";

export async function proxy(request: NextRequest) {
  const { url, key, appUrl } = getAuthConfig();
  const cartRoute = request.nextUrl.pathname === "/cart" || request.nextUrl.pathname === "/checkout" || request.nextUrl.pathname.startsWith("/products/");
  const hadAuthCookie = hasAuthCookie(request.cookies.getAll(), url);
  request.headers.delete("x-cart-session-error");
  const guest = guestCartCookie(appUrl);
  let newGuestToken: string | null = null;
  if (cartRoute && request.method === "GET" && !validGuestToken(request.cookies.get(guest.name)?.value)) {
    newGuestToken = randomBytes(32).toString("hex");
    request.cookies.set(guest.name, newGuestToken);
  }
  let response = NextResponse.next({ request });
  if (newGuestToken) response.cookies.set(guest.name, newGuestToken, guest.options);
  const supabase = createServerClient(url, key, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previousCookies = response.cookies.getAll();
        response = NextResponse.next({ request });
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const authReturn = request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/login";
  if (authReturn && (request.nextUrl.searchParams.has("code") || (request.nextUrl.searchParams.has("error") && request.nextUrl.searchParams.get("error") !== "link"))) {
    const code = callbackCodeSchema.safeParse(request.nextUrl.searchParams.get("code"));
    const rawFlowId = request.nextUrl.searchParams.get("sb_flow_id");
    const flowId = z.string().regex(/^[a-f0-9]{32}$/).nullable().safeParse(rawFlowId);
    let destination = "/login?error=link";
    if (code.success && flowId.success && !request.nextUrl.searchParams.has("error")) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        code.data, flowId.data ? { flowId: flowId.data } : undefined,
      );
      if (!error) {
        const payload = z.object({ redirectType: z.string().nullable() }).safeParse(data);
        destination = payload.success && payload.data.redirectType === "recovery" ? "/login?mode=reset" : "/account";
      }
    }
    const redirect = NextResponse.redirect(new URL(destination, appUrl));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    response = redirect;
  } else {
    // Verify with Auth, refreshing cookies before any Server Component renders.
    const { data: { user }, error } = await supabase.auth.getUser();
    if (cartRoute && hadAuthCookie && (error || !user)) {
      request.headers.set("x-cart-session-error", "1");
      const previousCookies = response.cookies.getAll();
      response = NextResponse.next({ request });
      previousCookies.forEach((cookie) => response.cookies.set(cookie));
    }
  }

  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export const config = {
  matcher: ["/", "/login", "/register", "/account/:path*", "/admin/:path*", "/products/:path*", "/cart", "/checkout"],
};
