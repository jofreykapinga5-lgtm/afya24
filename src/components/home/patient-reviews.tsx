"use client";

import { Star } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";

type Review = {
  name: string;
  roleKey: TranslationKey;
  quoteKey: TranslationKey;
  rating: number;
  approved: boolean;
};

const reviews: Review[] = [
  {
    name: "Amina K.",
    roleKey: "reviews_role_mother",
    quoteKey: "reviews_quote_1",
    rating: 5,
    approved: true,
  },
  {
    name: "Brian M.",
    roleKey: "reviews_role_patient",
    quoteKey: "reviews_quote_2",
    rating: 5,
    approved: true,
  },
  {
    name: "Josephine W.",
    roleKey: "reviews_role_parent",
    quoteKey: "reviews_quote_3",
    rating: 5,
    approved: true,
  },
  {
    name: "Daniel O.",
    roleKey: "reviews_role_patient",
    quoteKey: "reviews_quote_4",
    rating: 5,
    approved: true,
  },
  {
    name: "Neema S.",
    roleKey: "reviews_role_mother",
    quoteKey: "reviews_quote_5",
    rating: 5,
    approved: true,
  },
  {
    name: "Peter L.",
    roleKey: "reviews_role_patient",
    quoteKey: "reviews_quote_6",
    rating: 4,
    approved: true,
  },
];

function ReviewCard({
  review,
  highlighted = false,
}: {
  review: Review;
  highlighted?: boolean;
}) {
  const locale = useAppStore((state) => state.locale);

  return (
    <article
      className={`flex h-[180px] w-[82vw] max-w-[430px] shrink-0 flex-col justify-between rounded-[1.35rem] px-6 py-6 sm:h-[195px] sm:w-[430px] ${
        highlighted ? "bg-[#e9f8f7] text-[#171b20]" : "bg-[#f3f7ef] text-[#171b20]"
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, starIndex) => (
              <Star
                key={starIndex}
                className={`size-4 ${
                  starIndex < review.rating
                    ? "fill-[#d9a939] text-[#d9a939]"
                    : highlighted
                      ? "text-[#bfdedc]"
                      : "text-[#d9d1c6]"
                }`}
              />
            ))}
          </div>
          <span className={`text-xs font-bold ${highlighted ? "text-[#087a7b]" : "text-[#171b20]"}`}>
            {review.rating}.0
          </span>
        </div>

        <p
          className={`mt-5 max-w-[34ch] text-sm font-medium leading-6 ${
            highlighted ? "text-[#21363a]" : "text-[#2c3137]"
          }`}
        >
          {t(review.quoteKey, locale)}
        </p>
      </div>

      <p className={`mt-5 text-sm font-bold ${highlighted ? "text-[#087a7b]" : "text-[#171b20]"}`}>
        {review.name}, {t(review.roleKey, locale)}
      </p>
    </article>
  );
}

export function PatientReviews() {
  const locale = useAppStore((state) => state.locale);
  const approvedReviews = reviews.filter((review) => review.approved);
  const topReviews = approvedReviews.slice(0, 3);
  const bottomReviews = approvedReviews.slice(3, 6);

  return (
    <section className="overflow-hidden bg-white py-8 sm:py-10">
      <div className="mx-auto max-w-5xl px-4">
        <SectionHeading eyebrow={t("reviews_kicker", locale)} body={t("reviews_medvi_body", locale)}>
          {t("reviews_medvi_title", locale)}{" "}
          <span className="text-[#01b7bb]">{t("reviews_medvi_title_accent", locale)}</span>.
        </SectionHeading>
      </div>

      <div className="mt-10 space-y-5">
        <div className="-mx-8 overflow-hidden">
          <div className="animate-reviews-right flex w-max gap-5 pr-5">
            {[...topReviews, ...topReviews].map((review, index) => (
              <ReviewCard key={`top-${review.name}-${index}`} review={review} />
            ))}
          </div>
        </div>

        <div className="-mx-8 overflow-hidden">
          <div className="animate-reviews-left flex w-max gap-5 pr-5">
            {[...bottomReviews, ...bottomReviews].map((review, index) => (
              <ReviewCard
                key={`bottom-${review.name}-${index}`}
                review={review}
                highlighted={index % bottomReviews.length === bottomReviews.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
