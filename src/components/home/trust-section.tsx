"use client";

import Image from "next/image";
import { Lock, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";

const points: {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  icon: typeof ShieldCheck;
}[] = [
  {
    titleKey: "trust_point1_title",
    bodyKey: "trust_point1_body",
    icon: ShieldCheck,
  },
  {
    titleKey: "trust_point2_title",
    bodyKey: "trust_point2_body",
    icon: Sparkles,
  },
  {
    titleKey: "trust_point4_title",
    bodyKey: "trust_point4_body",
    icon: Lock,
  },
  {
    titleKey: "trust_point5_title",
    bodyKey: "trust_point5_body",
    icon: TriangleAlert,
  },
];

export function TrustSection() {
  const locale = useAppStore((state) => state.locale);

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] shadow-[0_28px_80px_-55px_rgba(8,50,115,0.55)]">
      <Image
        src="/images/trust/trust-panel-blue.png"
        alt=""
        fill
        priority={false}
        sizes="(min-width: 1024px) 1024px, 100vw"
        className="absolute inset-0 -z-20 object-cover object-[68%_center]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#03302e]/70 via-[#075554]/50 to-[#087a7b]/25" />
      <div className="absolute inset-0 -z-10 bg-brand-teal/10 mix-blend-multiply" />

      <div className="relative grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.8fr_1.3fr] lg:items-center lg:gap-10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 [text-shadow:0_1px_12px_rgba(3,25,24,0.85)]">
            {t("trust_section_badge", locale)}
          </p>
          <h2 className="mt-4 max-w-[26ch] text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#7cf1ee] [text-shadow:0_2px_20px_rgba(3,25,24,0.85)]">
            {t("trust_section_title", locale)}
          </h2>
          <p className="mt-4 max-w-[42ch] text-sm leading-6 text-white/90 [text-shadow:0_1px_14px_rgba(3,25,24,0.85)]">
            {t("trust_section_body", locale)}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          {points.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.titleKey} className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm">
                  <Icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="text-sm font-bold leading-tight text-white [text-shadow:0_1px_12px_rgba(3,25,24,0.85)] sm:text-[15px]">
                    {t(point.titleKey, locale)}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-white/90 [text-shadow:0_1px_10px_rgba(3,25,24,0.85)]">
                    {t(point.bodyKey, locale)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative border-t border-white/20 px-5 py-4 text-center text-xs font-medium leading-5 text-white/95 [text-shadow:0_1px_12px_rgba(3,25,24,0.85)] sm:px-8 sm:text-sm sm:leading-6">
        {t("trust_section_footer", locale)}
      </div>
    </section>
  );
}
