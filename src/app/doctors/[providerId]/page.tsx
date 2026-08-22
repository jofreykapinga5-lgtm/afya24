import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Star } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { getDefaultService } from "@/lib/default-service";
import { getPatientSession } from "@/lib/patient-session";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import { Reveal } from "@/components/motion/reveal";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { BookingForm } from "./booking-form";

export default async function DoctorBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ providerId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { providerId } = await params;
  const { error: lookupError } = await searchParams;
  const locale = await getServerLocale();
  const service = createServiceClient();

  const [{ data: row }, defaultService, patientSession] = await Promise.all([
    service
      .from("providers")
      .select(
        "id, full_name, specialty, credentials, bio, photo_url, languages, rating_summary, available_now, consultation_modes"
      )
      .eq("id", providerId)
      .eq("profile_status", "active")
      .maybeSingle(),
    getDefaultService(service),
    getPatientSession(),
  ]);

  if (!row) {
    notFound();
  }

  const provider = mapProviderRow(row as ProviderRow, defaultService.basePrice, locale);

  // hasSession hides the whole name/phone/DOB form below (see BookingForm) --
  // without this, a recognized returning visitor sees a bare "Start
  // consultation" button with no indication of why their details aren't
  // being asked for again, which reads as a missing section rather than an
  // intentional shortcut.
  const existingPatientName = patientSession
    ? (
        await service.from("patients").select("full_name").eq("id", patientSession.patientId).maybeSingle()
      ).data?.full_name ?? null
    : null;

  return (
    <main className="min-h-[calc(100dvh-3.5rem)] flex-1 bg-[#f7fbfb]">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/doctors"
          className="mb-6 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-[#60717a] outline-none transition-colors hover:text-[#071923] focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-3.5" />
          {t("doctor_booking_back", locale)}
        </Link>

        <Reveal delay={0}>
          <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7">
            <div className="flex items-start gap-4">
              <span className="relative inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#083273] text-lg font-bold text-white ring-4 ring-[#e8f7f4]">
                {provider.photoUrl ? (
                  <img src={provider.photoUrl} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  provider.name
                    .replace("Dr. ", "")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold tracking-tight text-[#071923]">{provider.name}</h1>
                <p className="mt-0.5 text-sm text-[#60717a]">{provider.specialty}</p>
                <div className="mt-1.5 flex items-center gap-1 text-xs">
                  <Star className="size-3 shrink-0 fill-pending text-pending" aria-hidden="true" />
                  <span className="font-semibold tabular-nums text-[#071923]">{provider.rating}</span>
                  <span className="text-[#8a969c]">({provider.reviewCount})</span>
                </div>
                {provider.isAvailableNow && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                    {t("doctor_available_now", locale)}
                  </p>
                )}
              </div>
            </div>

            {provider.bio && (
              <p className="mt-4 text-sm leading-relaxed text-[#60717a]">{provider.bio}</p>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-[#eef2f3] pt-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a969c]">
                  {t("doctor_booking_price_label", locale)}
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-[#083273]">
                  TZS {provider.price}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f7f4] px-3 py-1.5 text-xs font-semibold text-[#087a7b]">
                <ShieldCheck className="size-3.5" />
                {t("doctor_licensed_badge", locale)}
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="mt-6">
            <BookingForm
              provider={provider}
              locale={locale}
              hasSession={Boolean(patientSession)}
              existingPatientName={existingPatientName}
              lookupError={lookupError}
            />
          </div>
        </Reveal>
      </div>
    </main>
  );
}
