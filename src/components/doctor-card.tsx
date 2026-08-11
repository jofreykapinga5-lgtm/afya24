import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Provider, Locale } from "@/lib/types";
import { ConsultationModeIcons } from "@/components/consultation-mode-icons";
import { Button } from "@/components/ui/button";
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
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-18px_rgba(8,50,115,0.28)]">
      <div className="flex items-start gap-3.5">
        <span className="relative shrink-0">
          {provider.photoUrl ? (
            <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-secondary ring-2 ring-white">
              <Image src={provider.photoUrl} alt="" fill sizes="48px" className="object-cover" />
            </span>
          ) : (
            <span
              className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white ${avatarTints[tintIndex % avatarTints.length]}`}
            >
              {initials(provider.name)}
            </span>
          )}
          {provider.isAvailableNow && (
            <span
              className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card bg-emerald-500"
              aria-hidden="true"
            />
          )}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate font-semibold text-foreground">{provider.name}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{provider.specialty}</p>
          <div className="mt-1.5 flex items-center gap-1 text-xs">
            <Star className="size-3 shrink-0 fill-pending text-pending" aria-hidden="true" />
            <span className="font-semibold tabular-nums text-foreground">{provider.rating}</span>
            <span className="text-muted-foreground">({provider.reviewCount})</span>
          </div>
          {provider.isAvailableNow && (
            <p className="mt-1 text-xs font-medium text-emerald-600">{t("doctor_available_now", locale)}</p>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        {provider.languages.map((lang) => (
          <span
            key={lang}
            className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-medium text-primary ring-1 ring-primary/10"
          >
            {languageLabel[lang]}
          </span>
        ))}
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-border pt-3.5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("availability_next", locale)}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{provider.nextAvailableAt}</p>
        </div>
        <ConsultationModeIcons modes={provider.consultationModes} />
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("doctor_card_from", locale)}
          </p>
          <p className="mt-0.5 text-base font-bold tabular-nums text-primary">TZS {provider.price}</p>
        </div>
        <Button size="sm" className="h-9 shrink-0 rounded-full px-4 font-semibold" nativeButton={false} render={<Link href={`/doctors/${provider.id}`} />}>
          {t("doctor_card_view", locale)}
        </Button>
      </div>
    </article>
  );
}
