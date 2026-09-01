import { notFound, redirect } from "next/navigation";
import { getCachedActiveProviderById } from "@/lib/cache/public-catalog";
import { getDefaultService } from "@/lib/default-service";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import { Reveal } from "@/components/motion/reveal";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { GuestBookingForm } from "./guest-booking-form";

// The "continue without an account" destination -- a dedicated page rather
// than an inline reveal on the doctor's own page, and deliberately just
// name + phone (no date of birth): the goal is one short screen between
// picking a doctor and paying, not a second account-creation form. Styled
// after /doctor/apply (same shell: plain logo, centered heading, one white
// card) rather than the teal-branded account pages, since this is a quick
// utility step, not a marketing surface.
export default async function GuestBookingPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const locale = await getServerLocale();
  const service = createServiceClient();

  const [row, defaultService, patientSession] = await Promise.all([
    getCachedActiveProviderById(providerId),
    getDefaultService(service),
    getPatientSession(),
  ]);

  if (!row) {
    notFound();
  }

  // Already recognized (a real account or an earlier guest session) --
  // nothing left for this page to do. Send them back to the normal booking
  // flow, which now shows "Continue as X" instead.
  if (patientSession) {
    redirect(`/doctors/${providerId}`);
  }

  const provider = mapProviderRow(row as ProviderRow, defaultService.basePrice, locale);

  return (
    <main className="min-h-[calc(100dvh-3.5rem)] flex-1 bg-[#f7fbfb] px-4 py-10 text-[#071923] sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-center text-2xl font-bold sm:text-3xl">
          {t("guest_booking_title", locale)}
        </h1>
        <p className="mt-1.5 text-center text-sm text-[#60717a]">
          {t("guest_booking_subtitle", locale).replace("{name}", provider.name)}
        </p>

        <Reveal delay={60}>
          <section className="mt-6 rounded-[1.75rem] bg-white p-5 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#dfe8eb] sm:p-7">
            <GuestBookingForm providerId={providerId} locale={locale} />
          </section>
        </Reveal>
      </div>
    </main>
  );
}
