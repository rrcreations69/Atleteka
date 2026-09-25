import "server-only";
import { z } from "zod";

const environmentSchema = z.object({
  url: z.url(),
  key: z.string().min(1),
  appUrl: z.url().refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" ||
      (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  }),
});

export function getAuthConfig() {
  const result = environmentSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!result.success) throw new Error("Supabase authentication is not configured.");
  return result.data;
}

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};
