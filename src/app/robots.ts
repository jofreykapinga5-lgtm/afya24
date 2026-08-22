import type { MetadataRoute } from "next";

const siteUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

// Disallow list mirrors proxy.ts's PROTECTED_PREFIXES (nothing behind a
// session should be crawled anyway) plus the API surface and the
// session-dependent booking/payment/consultation flow, none of which has
// any content worth indexing even where it's technically reachable
// without a session.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/doctor/dashboard",
        "/account",
        "/consultation",
        "/api/",
        "/auth/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
