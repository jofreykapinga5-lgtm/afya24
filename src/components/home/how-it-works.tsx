"use client";

import Image from "next/image";
import { SectionHeading } from "@/components/home/section-heading";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";

const steps: {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  image: string;
  alt: string;
}[] = [
  {
    titleKey: "how_it_works_step1_title",
    bodyKey: "how_it_works_step1_body",
    image: "/generated/how-step-explain.jpg",
    alt: "Patient explaining a health concern on a phone",
  },
  {
    titleKey: "how_it_works_step2_title",
    bodyKey: "how_it_works_step2_body",
    image: "/generated/how-step-match.jpg",
    alt: "Doctor reviewing an online patient request",
  },
  {
    titleKey: "how_it_works_step3_title",
    bodyKey: "how_it_works_step3_body",
    image: "/generated/how-step-video.jpg",
    alt: "Patient speaking with a doctor by video call",
  },
  {
    titleKey: "how_it_works_step4_title",
    bodyKey: "how_it_works_step4_body",
    image: "/generated/how-step-results.jpg",
    alt: "Patient receiving a clear care outcome on a phone",
  },
];

export function HowItWorks() {
  const locale = useAppStore((state) => state.locale);

  return (
    <section id="how-it-works" className="scroll-mt-20">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#e9f8f7] px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
        <SectionHeading eyebrow={t("how_it_works_badge", locale)} body={t("how_it_works_body", locale)}>
          {t("how_it_works_title", locale)}
        </SectionHeading>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            return (
              <article
                key={step.titleKey}
                className="animate-enter group relative flex min-h-[300px] flex-col overflow-hidden rounded-[1.25rem] bg-white p-3.5 shadow-[0_18px_48px_-42px_rgba(8,50,115,0.5)] transition duration-300 hover:-translate-y-1 lg:min-h-[315px]"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#087a7b] text-sm font-bold text-white shadow-[0_16px_35px_-20px_rgba(8,50,115,0.8)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="relative mt-3 aspect-[16/8.6] overflow-hidden rounded-2xl bg-[#f8fbfa]">
                  <Image
                    src={step.image}
                    alt={step.alt}
                    fill
                    sizes="(min-width: 1024px) 250px, (min-width: 640px) 42vw, 90vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="mt-4 flex flex-1 flex-col">
                  <h3 className="text-base font-bold leading-snug tracking-tight text-[#071923]">
                    {t(step.titleKey, locale)}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#4f5b61]">
                    {t(step.bodyKey, locale)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
