import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Provider, Locale } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { t, type TranslationKey } from "@/lib/i18n";

const avatarTints = ["bg-primary", "bg-brand-teal", "bg-info", "bg-[#0a5c8a]"];

function initials(name: string) {
  return name
    .replace("Dr. ", "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function badgesFor(provider: Provider) {
  const badges: { labelKey: TranslationKey; className: string }[] = [];
  if (provider.isAvailableNow) {
    badges.push({
      labelKey: "doctor_available_now",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
    });
  } else if (provider.nextAvailableAt.startsWith("Today")) {
    badges.push({
      labelKey: "doctor_badge_available_today",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
    });
  }
  if (provider.rating >= 4.8) {
    badges.push({
      labelKey: "doctor_badge_highly_rated",
      className: "bg-primary-soft text-primary ring-1 ring-primary/10",
    });
  }
  if (provider.reviewCount >= 150) {
    badges.push({
      labelKey: "doctor_badge_loyal_patients",
      className: "bg-pending-soft text-pending ring-1 ring-pending/15",
    });
  }
  return badges.slice(0, 2);
}

export function DoctorCarouselCard({
  provider,
  tintIndex,
  locale,
}: {
  provider: Provider;
  tintIndex: number;
  locale: Locale;
}) {
  const badges = badgesFor(provider);
  const slots = provider.timeSlots ?? [];

  return (
    <article className="flex w-[288px] shrink-0 snap-start flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-18px_rgba(8,50,115,0.28)] sm:w-[308px]">
      <div className="flex items-start gap-3.5">
        <span className="relative shrink-0">
          {provider.photoUrl ? (
            <span className="relative size-[3.25rem] shrink-0 overflow-hidden rounded-full bg-secondary ring-2 ring-white">
              <Image src={provider.photoUrl} alt="" fill sizes="52px" className="object-cover" />
            </span>
          ) : (
            <span
              className={`inline-flex size-[3.25rem] shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white ${avatarTints[tintIndex % avatarTints.length]}`}
            >
              {initials(provider.name)}
            </span>
          )}
          {provider.isAvailableNow && (
            <span
              className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-card bg-emerald-500"
              aria-hidden="true"
            />
          )}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-base font-semibold leading-tight text-foreground">{provider.name}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{provider.specialty}</p>
          <div className="mt-1.5 flex items-center gap-1 text-xs">
            <Star className="size-3.5 shrink-0 fill-pending text-pending" aria-hidden="true" />
            <span className="font-semibold tabular-nums text-foreground">{provider.rating}</span>
            <span className="text-muted-foreground">({provider.reviewCount})</span>
          </div>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span
              key={badge.labelKey}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${badge.className}`}
            >
              {t(badge.labelKey, locale)}
            </span>
          ))}
        </div>
      )}

      {provider.quote && (
        <p className="mt-3.5 line-clamp-2 rounded-xl bg-[#f6f8f8] px-3.5 py-2.5 text-sm leading-relaxed text-muted-foreground">
          &ldquo;{provider.quote}&rdquo;
        </p>
      )}

      <div className="mt-auto flex flex-col gap-3.5 pt-4">
        <div className="flex items-end justify-between gap-3 border-t border-border pt-3.5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("availability_next", locale)}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{provider.nextAvailableAt}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("doctor_card_from", locale)}
            </p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-primary">TZS {provider.price}</p>
          </div>
        </div>

        {slots.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {slots.slice(0, 5).map((slot, index) => (
              <span
                key={slot}
                className={`inline-flex h-8 items-center justify-center rounded-lg border text-[11px] font-medium tabular-nums ${
                  index === 0
                    ? "border-primary/30 bg-primary-soft text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {slot}
              </span>
            ))}
            <span className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background text-[11px] font-medium text-muted-foreground">
              {t("doctor_carousel_more", locale)}
            </span>
          </div>
        )}

        <Button
          className="h-11 w-full rounded-full font-semibold"
          nativeButton={false}
          render={<Link href="/doctors" />}
        >
          {t("doctor_carousel_book_visit", locale)}
        </Button>
      </div>
    </article>
  );
}
