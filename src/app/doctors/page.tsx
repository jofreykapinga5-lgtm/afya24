import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { getDefaultService } from "@/lib/default-service";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import { DoctorCard } from "@/components/doctor-card";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string }>;
}) {
  const { q, specialty } = await searchParams;
  const locale = await getServerLocale();
  const query = q?.trim().toLowerCase() ?? "";
  const specialtyFilter = specialty?.trim().toLowerCase() ?? "";

  const service = createServiceClient();
  const [{ data: providerRows }, defaultService] = await Promise.all([
    service
      .from("providers")
      .select(
        "id, full_name, specialty, credentials, bio, languages, rating_summary, available_now, consultation_modes"
      )
      .eq("profile_status", "active"),
    getDefaultService(service).catch(() => null),
  ]);

  const providers = ((providerRows ?? []) as ProviderRow[]).map((row) =>
    mapProviderRow(row, defaultService?.basePrice ?? 0, locale)
  );

  const normalizedSpecialtyFilter = specialtyFilter
    .replace(/\bdoctor\b/g, "")
    .replace(/\bpractice\b/g, "")
    .trim();

  const matchesQuery = (provider: (typeof providers)[number]) =>
    !query ||
    provider.name.toLowerCase().includes(query) ||
    provider.specialty.toLowerCase().includes(query);

  const matchesSpecialty = (provider: (typeof providers)[number]) => {
    if (!specialtyFilter) return true;
    const providerSpecialty = provider.specialty.toLowerCase();
    const normalizedProviderSpecialty = providerSpecialty
      .replace(/\bdoctor\b/g, "")
      .replace(/\bpractice\b/g, "")
      .trim();

    return (
      providerSpecialty.includes(specialtyFilter) ||
      specialtyFilter.includes(providerSpecialty) ||
      (Boolean(normalizedSpecialtyFilter) &&
        (normalizedProviderSpecialty.includes(normalizedSpecialtyFilter) ||
          normalizedSpecialtyFilter.includes(normalizedProviderSpecialty)))
    );
  };

  let results = providers.filter(
    (provider) => matchesQuery(provider) && matchesSpecialty(provider)
  );

  // The AI's recommended specialty is free text the model generates;
  // providers.specialty is free text an admin typed once -- there's no enum
  // tying them together, so a near-miss (e.g. "Dermatology" vs.
  // "Dermatologist") would otherwise be a silent zero-results dead end.
  let specialtyFallbackUsed = false;
  if (specialtyFilter && results.length === 0) {
    specialtyFallbackUsed = true;
    results = providers.filter(matchesQuery);
  }

  // Doctors online right now surface first within the filtered set, since a
  // patient just qualified by Afya24 is trying to reach someone promptly --
  // "who's available" matters as much as "who's the right specialty."
  results = [...results].sort((a, b) => Number(b.isAvailableNow) - Number(a.isAvailableNow));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-3.5" />
        {t("back_to_home", locale)}
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">{t("doctors_page_title", locale)}</h1>
      <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
        {specialtyFallbackUsed
          ? t("doctors_page_specialty_fallback", locale).replace("{specialty}", specialty ?? "")
          : specialty
            ? t("doctors_page_specialty_results", locale)
                .replace("{n}", String(results.length))
                .replace("{specialty}", specialty)
            : query
              ? t("doctors_page_search_results", locale)
                  .replace("{n}", String(results.length))
                  .replace("{q}", q ?? "")
              : t("doctors_page_body", locale).replace("{n}", String(providers.length))}
      </p>

      {results.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((provider, index) => (
            <DoctorCard key={provider.id} provider={provider} tintIndex={index} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          {t("doctors_page_no_results", locale)}
        </p>
      )}
    </main>
  );
}
