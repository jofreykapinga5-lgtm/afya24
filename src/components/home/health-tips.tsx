"use client";

import Image from "next/image";
import { ArrowRight, Clock3 } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";

const featuredTips: {
  titleKey: TranslationKey;
  teaserKey: TranslationKey;
  image: string;
  alt: string;
}[] = [
  {
    titleKey: "health_tip1_title",
    teaserKey: "health_tip1_teaser",
    image: "/generated/health-tip-fever.png",
    alt: "Parent checking a child's fever",
  },
  {
    titleKey: "health_tip2_title",
    teaserKey: "health_tip2_teaser",
    image: "/generated/health-tip-video-consult.png",
    alt: "Patient speaking with a doctor by video",
  },
];

export function HealthTips() {
  const locale = useAppStore((state) => state.locale);

  return (
    <section id="health-tips" className="scroll-mt-20 rounded-[1.75rem] bg-white px-4 py-8 sm:px-6 lg:px-10">
      <SectionHeading
        eyebrow={t("health_tips_editorial_eyebrow", locale)}
        body={t("health_tips_editorial_subtitle", locale)}
      >
        <span className="text-[#01b7bb]">{t("health_tips_title", locale)}</span>
      </SectionHeading>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        {featuredTips.map((tip) => (
          <article
            key={tip.titleKey}
            className="overflow-hidden rounded-2xl bg-white shadow-[0_22px_65px_-42px_rgba(8,50,115,0.7)] ring-1 ring-border/70"
          >
            <div className="relative aspect-[16/7.2] w-full bg-secondary">
              <Image
                src={tip.image}
                alt={tip.alt}
                fill
                sizes="(min-width: 1024px) 540px, 100vw"
                className="object-cover"
              />
            </div>

            <div className="p-5 sm:p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
                <Clock3 className="size-4" />
                {t("health_tips_coming_soon", locale)}
              </span>

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="max-w-[18ch] text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                    {t(tip.titleKey, locale)}
                  </h3>
                  <p className="mt-3 max-w-[42ch] text-sm leading-6 text-muted-foreground">
                    {t(tip.teaserKey, locale)}
                  </p>
                </div>
                <a
                  href="/qualification"
                  aria-label={t(tip.titleKey, locale)}
                  className="mt-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-primary outline-none transition-colors hover:bg-primary-soft focus-visible:ring-3 focus-visible:ring-primary/25"
                >
                  <ArrowRight className="size-5" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

    </section>
  );
}
