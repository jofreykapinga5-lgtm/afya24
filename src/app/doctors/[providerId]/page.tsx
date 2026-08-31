import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck, Star } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { getDefaultService } from "@/lib/default-service";
import { getCachedActiveProviderById } from "@/lib/cache/public-catalog";
import { getFullAccountPatientSession } from "@/lib/patient-session";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import { toTitleCase } from "@/lib/format-name";
import { Reveal } from "@/components/motion/reveal";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { physicianJsonLd } from "@/lib/structured-data";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { BookingForm } from "./booking-form";

function initials(name: string) {
  return name
    .replace("Dr. ", "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ providerId: string }>;
}): Promise<Metadata> {
  const { providerId } = await params;
  const locale = await getServerLocale();
  const service = createServiceClient();

  const [row, defaultService] = await Promise.all([
    getCachedActiveProviderById(providerId),
    getDefaultService(service).catch(() => null),
  ]);

  if (!row) {
    return { title: t("doctors_page_title", locale) };
  }

  const name = toTitleCase(row.full_name);
  return {
    title: `${name} - ${row.specialty} | Afya24`,
    description: t("seo_doctor_profile_description", locale)
      .replace("{name}", name)
      .replace("{specialty}", row.specialty)
      .replace("{price}", String(defaultService?.basePrice ?? "")),
  };
}

export default async function DoctorBookingPage({
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
    // A real account, not just a name/DOB collected mid-chat -- booking now
    // requires one everywhere (see BookingForm), so this is also the gate
    // that decides whether to show "Continue as X" or a login/sign-up
    // prompt instead of the old name/phone/DOB manual-details form.
    getFullAccountPatientSession(),
  ]);

  if (!row) {
    notFound();
  }

  const provider = mapProviderRow(row as ProviderRow, defaultService.basePrice, locale);

  const existingPatientNameRaw = patientSession
    ? (
        await service.from("patients").select("full_name").eq("id", patientSession.patientId).maybeSingle()
      ).data?.full_name ?? null
    : null;
  const existingPatientName = existingPatientNameRaw ? toTitleCase(existingPatientNameRaw) : null;

  return (
    <main className="min-h-[calc(100dvh-3.5rem)] flex-1 bg-[#f7fbfb]">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              physicianJsonLd({
                name: provider.name,
                specialty: provider.specialty,
                path: `/doctors/${providerId}`,
                photoUrl: provider.photoUrl || null,
                priceValue: provider.price,
                languages: provider.languages,
              })
            ),
          }}
        />
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { name: t("breadcrumb_home", locale), path: "/" },
              { name: t("nav_doctors", locale), path: "/doctors" },
            ]}
            current={provider.name}
            currentPath={`/doctors/${providerId}`}
          />
        </div>

        {/* Below sm, the full card (bio, rating, licensed badge) pushes the
            booking form -- the patient's actual task here -- well below the
            fold. Swapped for a slim summary bar that still surfaces the two
            things that matter mid-booking (who, and the price) without the
            scroll cost; the full card comes back at sm and up where there's
            room for it above the form without delay. */}
        <Reveal delay={0}>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_14px_40px_-32px_rgba(8,50,115,0.45)] ring-1 ring-[#e5eef0] sm:hidden">
            <span className="relative inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#083273] text-sm font-bold text-white ring-2 ring-[#e8f7f4]">
              {provider.photoUrl ? (
                <img src={provider.photoUrl} alt="" loading="lazy" className="size-full object-cover" />
              ) : (
                initials(provider.name)
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-bold text-[#071923]">{provider.name}</h1>
              <p className="truncate text-xs text-[#60717a]">{provider.specialty}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#8a969c]">
                {t("doctor_booking_price_label", locale)}
              </p>
              <p className="text-sm font-bold tabular-nums text-[#083273]">TZS {provider.price}</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0}>
          <div className="hidden rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:block sm:p-7">
            <div className="flex items-start gap-4">
              <span className="relative inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#083273] text-lg font-bold text-white ring-4 ring-[#e8f7f4]">
                {provider.photoUrl ? (
                  <img src={provider.photoUrl} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  initials(provider.name)
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
              redirectTo={`/doctors/${providerId}`}
            />
          </div>
        </Reveal>
      </div>
    </main>
  );
}
