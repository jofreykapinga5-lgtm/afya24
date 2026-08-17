import Link from "next/link";
import type { Provider, Locale } from "@/lib/types";
import { ConsultationModeIcons } from "@/components/consultation-mode-icons";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { t } from "@/lib/i18n";

const avatarTints = ["bg-primary", "bg-brand-teal", "bg-info", "bg-[#0a5c8a]"];

function initials(name: string) {
  return name
    .replace("Dr. ", "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function DoctorCard({
  provider,
  tintIndex,
  locale,
}: {
  provider: Provider;
  tintIndex: number;
  locale: Locale;
}) {
  const languageLabel: Record<string, string> = {
    en: t("doctor_lang_en", locale),
    sw: t("doctor_lang_sw", locale),
  };

  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 shadow-[0_20px_50px_-38px_rgba(8,50,115,0.4)] ring-1 ring-[#e5eef0] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-32px_rgba(8,50,115,0.35)]">
      <div className="flex items-start gap-3.5">
        <span className="relative shrink-0">
          {provider.photoUrl ? (
            <span className="relative inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary ring-2 ring-white">
              {/* Plain <img> straight to storage -- see doctor-carousel-card
                  for why this bypasses next/image's /_next/image proxy. */}
              <img
                src={provider.photoUrl}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            </span>
          ) : (
            <span
              className={`inline-flex size-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white ${avatarTints[tintIndex % avatarTints.length]}`}
            >
              {initials(provider.name)}
            </span>
          )}
          {provider.isAvailableNow && (
            <span
              className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white bg-emerald-500"
              aria-hidden="true"
            />
          )}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate font-semibold text-[#071923]">{provider.name}</p>
          <p className="mt-0.5 truncate text-sm text-[#60717a]">{provider.specialty}</p>
          <StarRating
            rating={provider.rating}
            reviewCount={provider.reviewCount}
            locale={locale}
            className="mt-1.5 text-xs"
          />
          {provider.isAvailableNow && (
            <p className="mt-1 text-xs font-medium text-emerald-600">{t("doctor_available_now", locale)}</p>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        {provider.languages.map((lang) => (
          <span
            key={lang}
            className="rounded-full bg-[#e8f7f4] px-2.5 py-0.5 text-[11px] font-medium text-[#087a7b] ring-1 ring-[#01b7bb]/10"
          >
            {languageLabel[lang]}
          </span>
        ))}
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-[#eef2f3] pt-3.5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a969c]">
            {t("availability_next", locale)}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[#071923]">{provider.nextAvailableAt}</p>
        </div>
        <ConsultationModeIcons modes={provider.consultationModes} />
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a969c]">
            {t("doctor_card_from", locale)}
          </p>
          <p className="mt-0.5 text-base font-bold tabular-nums text-[#083273]">TZS {provider.price}</p>
        </div>
        <Button
          size="sm"
          className="h-9 shrink-0 rounded-full bg-[#01b7bb] px-4 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
          nativeButton={false}
          render={<Link href={`/doctors/${provider.id}`} />}
        >
          {t("doctor_card_view", locale)}
        </Button>
      </div>
    </article>
  );
}
