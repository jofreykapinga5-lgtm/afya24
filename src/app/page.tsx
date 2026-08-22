import { Hero } from "@/components/ui/animated-hero";
import { AiChatHeroCard } from "@/components/ai-chat-hero-card";
import { HowItWorks } from "@/components/home/how-it-works";
import { HealthTips } from "@/components/home/health-tips";
import { DoctorsPreview } from "@/components/home/doctors-preview";
import { ServicesGrid } from "@/components/home/services-grid";
import { PharmacyPreview } from "@/components/home/pharmacy-preview";
import { LabsPreview, type PublicLabLocation } from "@/components/home/labs-preview";
import { TrustSection } from "@/components/home/trust-section";
import { PatientReviews } from "@/components/home/patient-reviews";
import { EmailCapture } from "@/components/home/email-capture";
import { SiteFooter } from "@/components/home/site-footer";
import { Reveal } from "@/components/motion/reveal";
import { getCachedHomepageData } from "@/lib/cache/public-catalog";
import { getServerLocale } from "@/lib/locale-cookie";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import { t } from "@/lib/i18n";
import type { Provider } from "@/lib/types";

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

export default async function Home() {
  const locale = await getServerLocale();
  let doctors: Provider[] = [];
  let labs: PublicLabLocation[] = [];

  try {
    const { providers, labs: labRows, defaultServicePrice, slotEntries } = await getCachedHomepageData();
    const slotsByProvider = new Map(slotEntries);

    const rows = providers as ProviderRow[];
    doctors = rows.map((row) => {
      const slotInfo = slotsByProvider.get(row.id);
      return mapProviderRow(row, defaultServicePrice, locale, {
        chips: (slotInfo?.chips ?? []).map(formatSlotTime),
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
