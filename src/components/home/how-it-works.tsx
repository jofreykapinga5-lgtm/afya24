"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";

const steps: {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}[] = [
  {
    titleKey: "how_it_works_step1_title",
    bodyKey: "how_it_works_step1_body",
  },
  {
    titleKey: "how_it_works_step2_title",
    bodyKey: "how_it_works_step2_body",
  },
  {
    titleKey: "how_it_works_step3_title",
    bodyKey: "how_it_works_step3_body",
  },
  {
    titleKey: "how_it_works_step4_title",
    bodyKey: "how_it_works_step4_body",
  },
];

export function HowItWorks() {
  const locale = useAppStore((state) => state.locale);

  return (
    <section id="how-it-works" className="scroll-mt-20">
      <div className="relative min-h-[420px] overflow-hidden rounded-[1.5rem] shadow-[0_24px_70px_-52px_rgba(8,50,115,0.5)] sm:min-h-[430px]">
        <Image
          src="/images/process/telehealth-patient-phone-v2.png"
          alt="Patient using a phone during a telehealth consultation"
          fill
          priority={false}
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover object-[22%_center] sm:object-left"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-[#083273]/5" />

        <div className="relative z-10 flex min-h-[420px] items-center justify-end p-3 sm:min-h-[430px] sm:p-6 lg:p-10">
          <div className="w-[51%] rounded-[1rem] bg-[#083273] p-3 text-white shadow-[0_22px_60px_-38px_rgba(8,50,115,0.75)] sm:w-full sm:rounded-[1.25rem] sm:p-6 lg:w-[44%] xl:w-[39%]">
            <h2 className="text-[1rem] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[1.35rem]">
              {t("nav_how_it_works", locale)}
            </h2>

            <div className="mt-3 flex flex-col gap-2 sm:mt-5 sm:gap-3">
              {steps.map((step, index) => (
                <div key={step.titleKey} className="flex items-start gap-2 sm:gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/18 text-xs font-bold text-white ring-1 ring-white/20 sm:size-8 sm:text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-[0.8rem] font-semibold leading-tight text-white sm:text-base">
                      {t(step.titleKey, locale)}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-[0.68rem] leading-4 text-white/78 sm:mt-1 sm:text-xs sm:leading-5">
                      {t(step.bodyKey, locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/qualification"
          className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full bg-[#083273] px-5 text-sm font-bold text-white outline-none transition-colors hover:bg-[#062960] focus-visible:ring-3 focus-visible:ring-[#083273]/30"
        >
          Start now
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
