import { Hero } from "@/components/ui/animated-hero";
import { AiChatHeroCard } from "@/components/ai-chat-hero-card";
import { HowItWorks } from "@/components/home/how-it-works";
import { HealthTips } from "@/components/home/health-tips";
import { DoctorsPreview } from "@/components/home/doctors-preview";
import { ServicesGrid } from "@/components/home/services-grid";
import { PharmacyPreview } from "@/components/home/pharmacy-preview";
import { LabsPreview, type PublicLabLocation } from "@/components/home/labs-preview";
import { TrustSection } from "@/components/home/trust-section";
import { ReturningPatient } from "@/components/home/returning-patient";
import { PatientReviews } from "@/components/home/patient-reviews";
import { EmailCapture } from "@/components/home/email-capture";
import { SiteFooter } from "@/components/home/site-footer";
import { Reveal } from "@/components/motion/reveal";
import { createServiceClient } from "@/lib/supabase/service";
import { getDefaultService } from "@/lib/default-service";
import { getServerLocale } from "@/lib/locale-cookie";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import { t } from "@/lib/i18n";
import type { Provider } from "@/lib/types";

const MAX_SLOTS_PER_DOCTOR = 5;

function formatSlotTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

// Matches the "Today, 2:40 PM" / "Tomorrow, 9:15 AM" convention already
// used throughout mock-data.ts's nextAvailableAt values -- DoctorCarouselCard's
// badgesFor() string-matches on a literal "Today" prefix, so this has to
// stay in that exact shape for a real doctor's badge to show correctly too.
function formatNextAvailable(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000);
  const time = formatSlotTime(iso);

  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Tomorrow, ${time}`;
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
  const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  return `${weekday}, ${monthDay}`;
}

type ProviderSlotInfo = { chips: string[]; earliestIso: string | null };

async function getUpcomingSlotsByProvider(
  service: ReturnType<typeof createServiceClient>,
  providerIds: string[]
) {
  const slotsByProvider = new Map<string, ProviderSlotInfo>();
  if (providerIds.length === 0) return slotsByProvider;

  const { data: slotRows } = await service
    .from("provider_availability_slots")
    .select("provider_id, starts_at")
    .in("provider_id", providerIds)
    .eq("status", "open")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  for (const slot of slotRows ?? []) {
    const existing = slotsByProvider.get(slot.provider_id) ?? { chips: [], earliestIso: null };
    if (!existing.earliestIso) existing.earliestIso = slot.starts_at;
    if (existing.chips.length < MAX_SLOTS_PER_DOCTOR) {
      existing.chips.push(formatSlotTime(slot.starts_at));
    }
    slotsByProvider.set(slot.provider_id, existing);
  }

  return slotsByProvider;
}

export default async function Home() {
  const locale = await getServerLocale();
  let doctors: Provider[] = [];
  let labs: PublicLabLocation[] = [];

  try {
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

    const rows = (providerRows ?? []) as ProviderRow[];
    const slotsByProvider = await getUpcomingSlotsByProvider(
      service,
      rows.map((row) => row.id)
    );
    doctors = rows.map((row) => {
      const slotInfo = slotsByProvider.get(row.id);
      return mapProviderRow(row, defaultService?.basePrice ?? 0, locale, {
        chips: slotInfo?.chips ?? [],
        nextAvailableAt: slotInfo?.earliestIso ? formatNextAvailable(slotInfo.earliestIso) : undefined,
      });
    });
    labs = (labRows ?? []).map((lab) => ({
      id: lab.id,
      name: lab.name,
      address: lab.address,
      phone: lab.phone ?? "",
      region: lab.region ?? "",
      latitude: Number(lab.latitude),
      longitude: Number(lab.longitude),
      openingHours: lab.opening_hours ?? "Hours not listed",
      mapUrl: lab.map_url ?? "",
      status: lab.status,
    })) as PublicLabLocation[];
  } catch {
    doctors = [];
    labs = [];
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <Hero />

        <section className="bg-[#e9f8f7] px-4 pb-10 pt-8 sm:px-6 sm:pb-12">
          <div className="mx-auto w-full max-w-xl">
            <p className="mb-4 text-center text-base font-medium leading-relaxed text-[#083273] sm:text-lg">
              {t("ai_chat_intro", locale)}
            </p>
            <AiChatHeroCard />
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-12 sm:gap-16 sm:px-6 sm:py-16">
          <Reveal>
            <HowItWorks />
          </Reveal>
          <Reveal delay={60}>
            <ServicesGrid />
          </Reveal>
          <Reveal>
            <DoctorsPreview providers={doctors} />
          </Reveal>
          <Reveal delay={60}>
            <PharmacyPreview />
          </Reveal>
          <Reveal>
            <TrustSection />
          </Reveal>
          <Reveal delay={60}>
            <LabsPreview labs={labs} />
          </Reveal>
          <Reveal>
            <HealthTips />
          </Reveal>
          <Reveal delay={60}>
            <ReturningPatient />
          </Reveal>
          <Reveal>
            <PatientReviews />
          </Reveal>
          <Reveal delay={60}>
            <EmailCapture />
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
