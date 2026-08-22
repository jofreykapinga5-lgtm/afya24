import "server-only";
import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getDefaultService } from "@/lib/default-service";

// Public, non-personalized data shared by every visitor -- cached for a
// short window so real traffic doesn't re-run the same queries on every
// single page view (homepage, doctors listing, every doctor profile, and
// the pharmacy catalog were each hitting the database fresh on every
// visit, with nothing shared between requests).
//
// unstable_cache's callback can't touch cookies()/headers(), so every
// function here uses the service-role client, never the per-request SSR
// client -- even for rows a public RLS policy would otherwise allow.
//
// 60s revalidation, not tag-based invalidation tied to admin actions: an
// admin edit (approving a doctor, updating a price) can take up to a
// minute to show up on these public pages. That's an acceptable trade for
// not having to wire revalidateTag into every admin action right now --
// worth revisiting if that staleness window ever actually matters.
const REVALIDATE_SECONDS = 60;

export const getCachedActiveProviders = unstable_cache(
  async () => {
    const service = createServiceClient();
    const { data } = await service
      .from("providers")
      .select(
        "id, full_name, specialty, credentials, bio, photo_url, languages, rating_summary, available_now, consultation_modes"
      )
      .eq("profile_status", "active")
      .order("available_now", { ascending: false });
    return data ?? [];
  },
  ["active-providers"],
  { revalidate: REVALIDATE_SECONDS, tags: ["providers"] }
);

export const getCachedActiveProviderById = unstable_cache(
  async (providerId: string) => {
    const service = createServiceClient();
    const { data } = await service
      .from("providers")
      .select(
        "id, full_name, specialty, credentials, bio, photo_url, languages, rating_summary, available_now, consultation_modes"
      )
      .eq("id", providerId)
      .eq("profile_status", "active")
      .maybeSingle();
    return data;
  },
  ["active-provider-by-id"],
  { revalidate: REVALIDATE_SECONDS, tags: ["providers"] }
);

export const getCachedPublishedPharmacyItems = unstable_cache(
  async () => {
    const service = createServiceClient();
    const { data } = await service
      .from("pharmacy_items")
      .select(
        "id, medicine_name, category, description, form, strength, stock_status, unit_price, requires_prescription, photo_url, badge"
      )
      .eq("status", "published")
      .order("medicine_name", { ascending: true });
    return data ?? [];
  },
  ["published-pharmacy-items"],
  { revalidate: REVALIDATE_SECONDS, tags: ["pharmacy-items"] }
);

// Homepage-specific: the featured providers slice, active lab locations,
// each provider's upcoming slots, and the default service's price, all in
// one cached fetch since the homepage already treats them as one unit
// (one Promise.all). Returns plain arrays, not a Map -- unstable_cache's
// result has to be JSON-serializable, and Map doesn't survive that.
export const getCachedHomepageData = unstable_cache(
  async () => {
    const service = createServiceClient();
    const [{ data: providerRows }, { data: labRows }, defaultService] = await Promise.all([
      service
        .from("providers")
        .select(
          "id, full_name, specialty, credentials, bio, photo_url, languages, rating_summary, available_now, consultation_modes"
        )
        .eq("profile_status", "active")
        .order("available_now", { ascending: false })
        .limit(8),
      service
        .from("lab_locations")
        .select("id, name, address, phone, region, latitude, longitude, map_url, opening_hours, status")
        .eq("status", "active")
        .order("region", { ascending: true })
        .limit(100),
      getDefaultService(service).catch(() => null),
    ]);

    const providers = providerRows ?? [];
    const providerIds = providers.map((row) => row.id);

    let slotEntries: [string, { chips: string[]; earliestIso: string | null }][] = [];
    if (providerIds.length > 0) {
      const { data: slotRows } = await service
        .from("provider_availability_slots")
        .select("provider_id, starts_at")
        .in("provider_id", providerIds)
        .eq("status", "open")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true });

      const slotsByProvider = new Map<string, { chips: string[]; earliestIso: string | null }>();
      const MAX_SLOTS_PER_DOCTOR = 5;
      for (const slot of slotRows ?? []) {
        const existing = slotsByProvider.get(slot.provider_id) ?? { chips: [], earliestIso: null };
        if (!existing.earliestIso) existing.earliestIso = slot.starts_at;
        if (existing.chips.length < MAX_SLOTS_PER_DOCTOR) {
          existing.chips.push(slot.starts_at);
        }
        slotsByProvider.set(slot.provider_id, existing);
      }
      slotEntries = [...slotsByProvider.entries()];
    }

    return { providers, labs: labRows ?? [], defaultServicePrice: defaultService?.basePrice ?? 0, slotEntries };
  },
  ["homepage-data"],
  { revalidate: REVALIDATE_SECONDS, tags: ["providers", "lab-locations"] }
);
