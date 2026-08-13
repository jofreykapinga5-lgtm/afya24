import { Hero } from "@/components/ui/animated-hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { HealthTips } from "@/components/home/health-tips";
import { DoctorsPreview } from "@/components/home/doctors-preview";
import { ServicesGrid } from "@/components/home/services-grid";
import { PharmacyPreview } from "@/components/home/pharmacy-preview";
import { LabsPreview } from "@/components/home/labs-preview";
import { TrustSection } from "@/components/home/trust-section";
import { ReturningPatient } from "@/components/home/returning-patient";
import { PatientReviews } from "@/components/home/patient-reviews";
import { EmailCapture } from "@/components/home/email-capture";
import { SiteFooter } from "@/components/home/site-footer";
import { createServiceClient } from "@/lib/supabase/service";
import { getDefaultService } from "@/lib/default-service";
import { getServerLocale } from "@/lib/locale-cookie";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import type { Provider } from "@/lib/types";

export default async function Home() {
  const locale = await getServerLocale();
  let doctors: Provider[] = [];

  try {
    const service = createServiceClient();
    const [{ data: providerRows }, defaultService] = await Promise.all([
      service
        .from("providers")
        .select(
          "id, full_name, specialty, credentials, bio, languages, rating_summary, available_now, consultation_modes"
        )
        .eq("profile_status", "active")
        .order("available_now", { ascending: false })
        .limit(8),
      getDefaultService(service).catch(() => null),
    ]);

    doctors = ((providerRows ?? []) as ProviderRow[]).map((row) =>
      mapProviderRow(row, defaultService?.basePrice ?? 0, locale)
    );
  } catch {
    doctors = [];
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <Hero />

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-12 sm:gap-16 sm:px-6 sm:py-16">
          <HowItWorks />
          <ServicesGrid />
          <DoctorsPreview providers={doctors} />
          <PharmacyPreview />
          <TrustSection />
          <LabsPreview />
          <HealthTips />
          <ReturningPatient />
          <PatientReviews />
          <EmailCapture />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
