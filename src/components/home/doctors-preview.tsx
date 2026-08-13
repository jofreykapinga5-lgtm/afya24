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
          <p className="text-sm font-semibold text-[#071923]">No doctors are published yet.</p>
          <p className="mt-1 text-sm text-[#60717a]">
            Add and activate the first doctor in the admin dashboard to show them here.
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
        <div className="grid md:grid-cols-[1fr_310px] md:items-stretch">
          <div className="p-5 pb-4 sm:p-6 md:pr-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a7b]">
              For professionals
            </p>
            <h3 className="mt-3 text-2xl font-bold leading-tight text-[#071923]">
              Are you a doctor?
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#4d5960]">
              Join Afya24, set your availability, and receive matched patients after admin verification.
            </p>
          </div>

          <Reveal variant="image" className="relative min-h-64 overflow-hidden md:min-h-80">
            <Image
              src="/images/doctors/tanzanian-male-doctor.png"
              alt="Tanzanian male doctor in a white coat"
              fill
              sizes="(min-width: 768px) 310px, 100vw"
              className="object-cover object-[50%_28%] md:object-top"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-[#071923]/82 via-[#071923]/18 to-transparent p-5 pt-24 sm:p-6">
              <Link
                href="/doctor/apply"
                className="inline-flex w-auto translate-y-1 items-center justify-center gap-2 rounded-full bg-[#01b7bb] px-5 py-2.5 text-sm font-bold text-white outline-none transition hover:bg-[#019ea2] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/35 sm:translate-y-0"
              >
                Apply now
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
