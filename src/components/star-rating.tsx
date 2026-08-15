import { Star } from "lucide-react";
import type { Locale } from "@/lib/types";
import { t } from "@/lib/i18n";

// A brand-new doctor with zero reviews showing "0 (0)" reads as broken, not
// honest -- a "New" pill matches how most marketplaces handle an empty
// rating instead of a literal zero-star row.
export function StarRating({
  rating,
  reviewCount,
  locale,
  className,
}: {
  rating: number;
  reviewCount: number;
  locale: Locale;
  className?: string;
}) {
  if (reviewCount <= 0) {
    return (
      <span
        className={`inline-flex w-fit rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary ${className ?? ""}`}
      >
        {t("doctor_rating_new", locale)}
      </span>
    );
  }

  const filledStars = Math.round(Math.min(Math.max(rating, 0), 5));

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <div className="flex items-center gap-px" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`size-3 shrink-0 ${index < filledStars ? "fill-pending text-pending" : "fill-none text-border"}`}
          />
        ))}
      </div>
      <span className="font-semibold tabular-nums text-foreground">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground">({reviewCount})</span>
    </div>
  );
}
