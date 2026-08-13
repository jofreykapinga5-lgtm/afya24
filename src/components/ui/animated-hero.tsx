"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

function Hero() {
  const locale = useAppStore((state) => state.locale);

  return (
    <div className="relative isolate w-full overflow-hidden bg-[#083273]">
      <Image
        src="/images/process/telehealth-patient-phone-v2.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover object-[25%_center] sm:object-center"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#083273]/95 via-[#083273]/72 to-[#083273]/18" />
      <div className="absolute inset-0 -z-10 bg-[#01b7bb]/18 mix-blend-multiply" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-[#e9f8f7] to-transparent" />

      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="flex min-h-[520px] flex-col items-center justify-center py-16 text-center sm:py-20 lg:py-24">
          <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
            <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white ring-1 ring-white/18 backdrop-blur-sm">
              Afya24
            </p>
            <h1 className="text-4xl font-bold leading-[1.02] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              {t("hero_headline_prefix", locale)}{" "}
              <span className="text-[#7cf1ee]">{t("hero_title_simple", locale)}</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-white/84 sm:text-lg">
              {t("hero_body", locale)}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/doctors"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#083273] px-6 text-sm font-bold text-white shadow-[0_18px_44px_-24px_rgba(1,183,187,0.85)] ring-1 ring-white/20 transition-colors hover:bg-[#062960] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#01b7bb]/45"
              >
                {t("hero_get_help_cta", locale)}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
