import type { MetadataRoute } from "next";

// Shop pages are indexable; private, per-visitor and payment routes are not.
export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/api/", "/cart", "/checkout", "/order/", "/login", "/register"] },
    sitemap: appUrl && URL.canParse(appUrl) ? new URL("/sitemap.xml", appUrl).href : undefined,
  };
}
