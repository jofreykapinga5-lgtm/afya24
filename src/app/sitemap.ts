import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";

const siteUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

// Only real, public, content-bearing pages -- everything behind a session
// (dashboards, account, consultation/payment flows) or purely functional
// with no unique content to rank (lookup, qualification chat) is left out
// on purpose, matching proxy.ts's own PROTECTED_PREFIXES plus a few more
// utility routes that aren't worth a search result of their own.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const service = createServiceClient();
  const { data: providers } = await service
    .from("providers")
    .select("id, updated_at")
    .eq("profile_status", "active");

  const providerEntries: MetadataRoute.Sitemap = (providers ?? []).map((provider) => ({
    url: `${siteUrl}/doctors/${provider.id}`,
    lastModified: provider.updated_at as string,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/doctors`, changeFrequency: "daily", priority: 0.9 },
    ...providerEntries,
    { url: `${siteUrl}/pharmacy`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/doctor/apply`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/help`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
