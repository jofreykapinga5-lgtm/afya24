import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDefaultService } from "@/lib/default-service";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { getPatientDashboardContext } from "../patient-context";

export default async function AccountDashboardDoctorsPage() {
  const locale = await getServerLocale();
  const { supabase } = await getPatientDashboardContext();

  const [defaultService, { data: providerRows }] = await Promise.all([
    getDefaultService(supabase).catch(() => null),
    supabase
      .from("providers")
      .select(
        "id, full_name, specialty, credentials, bio, photo_url, languages, rating_summary, available_now, consultation_modes"
      )
      .eq("profile_status", "active")
      .eq("available_now", true)
      .order("available_now", { ascending: false })
      .limit(6),
  ]);

  const featuredDoctors = ((providerRows ?? []) as ProviderRow[]).map((row) =>
    mapProviderRow(row, defaultService?.basePrice ?? 0, locale)
  );

  return (
    <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_available_doctors_title", locale)}</p>
          <p className="mt-1 text-sm text-[#64747c]">{t("account_dashboard_available_doctors_body", locale)}</p>
        </div>
        <Button variant="outline" className="h-9 rounded-full bg-white" nativeButton={false} render={<Link href="/doctors" />}>
          {t("doctors_preview_see_all", locale)}
          <ArrowRight className="size-4" />
        </Button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {featuredDoctors.length > 0 ? (
          featuredDoctors.map((provider) => <DoctorMiniCard key={provider.id} provider={provider} locale={locale} />)
        ) : (
          <p className="text-sm text-[#64747c] md:col-span-3">{t("account_dashboard_no_doctors_available", locale)}</p>
        )}
      </div>
    </section>
  );
}

function DoctorMiniCard({
  provider,
  locale,
}: {
  provider: ReturnType<typeof mapProviderRow>;
  locale: Locale;
}) {
  return (
    <article className="rounded-2xl border border-[#e1e9ec] bg-[#f8fbfd] p-4">
      <div className="flex items-center gap-3">
        {provider.photoUrl ? (
          <span className="relative flex size-11 shrink-0 overflow-hidden rounded-full bg-[#e8f7f4]">
            <Image src={provider.photoUrl} alt="" fill sizes="44px" className="object-cover" />
          </span>
        ) : (
          <span className="flex size-11 items-center justify-center rounded-full bg-[#083273] text-sm font-bold text-white">
            {provider.name
              .replace("Dr. ", "")
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#071923]">{provider.name}</p>
          <p className="truncate text-xs text-[#64747c]">{provider.specialty}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#64747c]">{provider.nextAvailableAt}</p>
          <p className="mt-0.5 text-sm font-bold text-[#083273]">TZS {provider.price}</p>
        </div>
        <Button
          size="sm"
          className="h-8 rounded-full bg-[#01b7bb] px-3 font-bold text-white hover:bg-[#019ea2]"
          nativeButton={false}
          render={<Link href={`/doctors/${provider.id}`} />}
        >
          {t("account_dashboard_book_button", locale)}
        </Button>
      </div>
    </article>
  );
}
