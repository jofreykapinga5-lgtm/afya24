import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { getDefaultService } from "@/lib/default-service";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { BookingForm } from "./booking-form";

export default async function DoctorBookingPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const locale = await getServerLocale();
  const service = createServiceClient();

  const [{ data: row }, defaultService] = await Promise.all([
    service
      .from("providers")
      .select(
        "id, full_name, specialty, credentials, bio, languages, rating_summary, available_now, consultation_modes"
      )
      .eq("id", providerId)
      .eq("profile_status", "active")
      .maybeSingle(),
    getDefaultService(service),
  ]);

  if (!row) {
    notFound();
  }

  const provider = mapProviderRow(row as ProviderRow, defaultService.basePrice, locale);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/doctors"
        className="mb-6 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-3.5" />
        {t("doctor_booking_back", locale)}
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {provider.name
              .replace("Dr. ", "")
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold">{provider.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{provider.specialty}</p>
            <div className="mt-1.5 flex items-center gap-1 text-xs">
              <Star className="size-3 shrink-0 fill-pending text-pending" aria-hidden="true" />
              <span className="font-semibold tabular-nums text-foreground">{provider.rating}</span>
              <span className="text-muted-foreground">({provider.reviewCount})</span>
            </div>
            {provider.isAvailableNow && (
              <p className="mt-1 text-xs font-medium text-emerald-600">
                {t("doctor_available_now", locale)}
              </p>
            )}
          </div>
        </div>

        {provider.bio && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{provider.bio}</p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("doctor_booking_price_label", locale)}
            </p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-primary">
              TZS {provider.price}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <BookingForm provider={provider} locale={locale} />
      </div>
    </main>
  );
}
