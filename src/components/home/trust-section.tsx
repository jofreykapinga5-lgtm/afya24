"use client";

import Image from "next/image";
import { SectionHeading } from "@/components/home/section-heading";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";

const points: {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  image: string;
  alt: string;
}[] = [
  {
    titleKey: "trust_point1_title",
    bodyKey: "trust_point1_body",
    image: "/images/trust/licensed-doctor.jpg",
    alt: "Smiling licensed doctor with a tablet",
  },
  {
    titleKey: "trust_point2_title",
    bodyKey: "trust_point2_body",
    image: "/images/trust/ai-assist.jpg",
    alt: "Doctor preparing for a virtual care session",
  },
  {
    titleKey: "trust_point4_title",
    bodyKey: "trust_point4_body",
    image: "/images/trust/secure-records.jpg",
    alt: "Clinician writing secure patient notes",
  },
  {
    titleKey: "trust_point5_title",
    bodyKey: "trust_point5_body",
    image: "/images/trust/urgent-boundaries.jpg",
    alt: "Doctor speaking with a patient by phone",
  },
];

export function TrustSection() {
  const locale = useAppStore((state) => state.locale);

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#fbf7f0] px-4 py-5 shadow-[0_28px_80px_-55px_rgba(8,50,115,0.45)] sm:px-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute -left-28 -top-6 h-56 w-56 rounded-full bg-brand-teal/20" />
      <div className="pointer-events-none absolute -bottom-32 right-12 h-72 w-72 rounded-full bg-primary/10" />

      <div className="relative grid gap-5 lg:grid-cols-[0.72fr_1.45fr] lg:items-start">
        <div>
          <SectionHeading eyebrow={t("trust_section_badge", locale)} body={t("trust_section_body", locale)}>
            <span className="text-[#01b7bb]">
            {t("trust_section_title", locale)}
            </span>
          </SectionHeading>

          <div className="relative mt-5 hidden min-h-[220px] pt-4 sm:block">
            <div className="absolute bottom-0 left-8 h-44 w-[78%] rounded-t-[8rem] bg-brand-teal/12" />
            <div className="relative h-[230px] overflow-hidden rounded-t-[7rem] rounded-br-[2rem] bg-white shadow-[0_25px_55px_-35px_rgba(8,50,115,0.65)]">
              <Image
                src="/images/trust/doctor-video-consult.jpg"
                alt="Doctor smiling during an online consultation"
                fill
                sizes="(min-width: 1024px) 390px, 92vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/35 to-transparent" />
            </div>

            <div className="absolute bottom-4 right-0 max-w-[220px] rounded-2xl bg-[#087a7b] p-3 text-white shadow-[0_20px_45px_-25px_rgba(8,50,115,0.9)]">
              <p className="text-sm font-semibold leading-snug">{t("trust_section_photo_badge", locale)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {points.map((point) => (
            <article
              key={point.titleKey}
              className="flex min-h-[160px] flex-col items-center rounded-2xl bg-white/82 px-3 py-4 text-center shadow-[0_18px_45px_-38px_rgba(8,50,115,0.5)] ring-1 ring-primary/5 backdrop-blur sm:min-h-[190px] sm:px-4 sm:py-5"
            >
              <div className="relative size-16 overflow-hidden rounded-full bg-[#e8f3ef] ring-6 ring-[#f2f5ee] sm:size-20">
                <Image
                  src={point.image}
                  alt={point.alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-3 max-w-[12rem] text-sm font-bold leading-tight tracking-tight text-[#064f55] sm:text-base">
                {t(point.titleKey, locale)}
              </h3>
              <p className="mt-2 line-clamp-3 max-w-[13rem] text-xs leading-5 text-[#4f5b61]">
                {t(point.bodyKey, locale)}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="relative mt-4 rounded-2xl bg-[#e8f2ee] px-4 py-3 text-center text-xs font-medium leading-5 text-[#0f5d63] sm:text-sm sm:leading-6">
        {t("trust_section_footer", locale)}
      </div>
    </section>
  );
}
