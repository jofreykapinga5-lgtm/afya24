"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DoctorCarouselCard } from "@/components/doctor-carousel-card";
import { SectionHeading } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Provider } from "@/lib/types";

export function DoctorsPreview({ providers }: { providers: Provider[] }) {
  const locale = useAppStore((state) => state.locale);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function cardStride() {
    const scroller = scrollerRef.current;
    const card = scroller?.children[0] as HTMLElement | undefined;
    return card ? card.offsetWidth + 16 : 304;
  }

  function scrollByCard(direction: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: direction * cardStride(), behavior: "smooth" });
  }

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const index = Math.round(scroller.scrollLeft / cardStride());
    setActiveIndex(Math.min(Math.max(index, 0), Math.max(providers.length - 1, 0)));
  }

  return (
    <section id="doctors" className="scroll-mt-20">
      <div>
        <SectionHeading eyebrow={t("nav_doctors", locale)} body={t("doctors_preview_subtitle", locale)}>
          <span className="text-[#01b7bb]">
            {t("doctors_preview_title", locale)}
          </span>
        </SectionHeading>
      </div>

      {providers.length > 0 ? (
        <>
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
          >
            {providers.map((provider, index) => (
              <DoctorCarouselCard key={provider.id} provider={provider} tintIndex={index} locale={locale} />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {providers.map((provider, index) => (
                <span
                  key={provider.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t("doctors_preview_prev", locale)}
                onClick={() => scrollByCard(-1)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground outline-none transition-colors hover:border-primary/30 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label={t("doctors_preview_next", locale)}
                onClick={() => scrollByCard(1)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-[1.25rem] bg-[#f7fbfb] px-5 py-7 text-center ring-1 ring-[#dfe8eb]">
          <p className="text-sm font-semibold text-[#071923]">{t("home_no_doctors_title", locale)}</p>
          <p className="mt-1 text-sm text-[#60717a]">
            {t("home_no_doctors_body", locale)}
          </p>
        </div>
      )}

      <div className="mt-5 flex justify-center">
        <Link
          href="/doctors"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary outline-none transition-colors hover:border-primary/30 hover:bg-primary-soft focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t("doctors_preview_see_all", locale)}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="-mx-4 mt-7 overflow-hidden bg-[#e8f7f4] sm:mx-0 sm:rounded-[1.75rem] sm:ring-1 sm:ring-[#ccece7]">
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          <div className="flex flex-1 flex-col items-start justify-center p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a7b]">
              {t("home_for_professionals_label", locale)}
            </p>
            <h3 className="mt-2 text-xl font-bold leading-tight text-[#071923] sm:text-2xl">
              {t("home_are_you_doctor_title", locale)}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#4d5960]">
              {t("home_are_you_doctor_body", locale)}
            </p>
            <Link
              href="/doctor/apply"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white outline-none transition hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-primary/35"
            >
              {t("home_apply_now", locale)}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <Reveal variant="image" className="relative h-44 shrink-0 overflow-hidden sm:h-auto sm:w-[220px] md:w-[260px]">
            <Image
              src="/images/doctors/tanzanian-male-doctor.png"
              alt="Tanzanian male doctor in a white coat"
              fill
              sizes="(min-width: 640px) 260px, 100vw"
              className="object-cover object-[50%_20%] sm:object-top"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
