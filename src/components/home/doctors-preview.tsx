"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { providers } from "@/lib/mock-data";
import { DoctorCarouselCard } from "@/components/doctor-carousel-card";
import { SectionHeading } from "@/components/home/section-heading";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export function DoctorsPreview() {
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
    setActiveIndex(Math.min(Math.max(index, 0), providers.length - 1));
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

      <div className="mt-5 flex justify-center">
        <Link
          href="/doctors"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary outline-none transition-colors hover:border-primary/30 hover:bg-primary-soft focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t("doctors_preview_see_all", locale)}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
