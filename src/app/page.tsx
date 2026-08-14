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

    doctors = ((providerRows ?? []) as ProviderRow[]).map((row) =>
      mapProviderRow(row, defaultService?.basePrice ?? 0, locale)
    );
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
