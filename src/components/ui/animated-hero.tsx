"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { Reveal } from "@/components/motion/reveal";

function Hero() {
  const locale = useAppStore((state) => state.locale);

  return (
    <div className="relative isolate w-full overflow-hidden bg-[#052052]">
      <Image
        src="/images/process/hero-telehealth-blue.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover object-[70%_center] sm:object-[62%_center]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#052052]/97 via-[#083273]/78 to-[#083273]/25" />
      <div className="absolute inset-0 -z-10 bg-[#01b7bb]/22 mix-blend-multiply" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-[#e9f8f7] to-transparent" />

      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="flex min-h-[560px] flex-col items-center justify-center py-16 text-center sm:py-20 lg:py-24">
          <Reveal variant="fade">
            <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
              <h1 className="text-4xl font-bold leading-[1.02] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
                {t("hero_headline_prefix", locale)}{" "}
                <span className="text-[#7cf1ee]">{t("hero_title_simple", locale)}</span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-white/84 sm:text-lg">
                {t("hero_body", locale)}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Link
                  href="/doctors"
                  className="group inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-[#01b7bb] px-8 text-base font-bold text-[#052052] shadow-[0_22px_50px_-20px_rgba(1,183,187,0.85)] ring-1 ring-white/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1ecdd1] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#01b7bb]/50"
                >
                  {t("hero_get_help_cta", locale)}
                  <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

export { Hero };
