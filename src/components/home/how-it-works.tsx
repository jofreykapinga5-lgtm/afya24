"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
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

const cardPositionKey = "afya24-how-it-works-card-position";
const defaultCardPosition = { x: 73, y: 52 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function HowItWorks() {
  const locale = useAppStore((state) => state.locale);
  const frameRef = useRef<HTMLDivElement>(null);
  const loadedSavedPosition = useRef(false);
  const [cardPosition, setCardPosition] = useState(defaultCardPosition);

  useEffect(() => {
    const saved = window.localStorage.getItem(cardPositionKey);
    if (saved) {
      try {
        const next = JSON.parse(saved) as typeof defaultCardPosition;
        if (Number.isFinite(next.x) && Number.isFinite(next.y)) {
          setCardPosition({ x: clamp(next.x, 30, 78), y: clamp(next.y, 24, 76) });
        }
      } catch {
        window.localStorage.removeItem(cardPositionKey);
      }
    }
    loadedSavedPosition.current = true;
  }, []);

  useEffect(() => {
    if (!loadedSavedPosition.current) return;
    window.localStorage.setItem(cardPositionKey, JSON.stringify(cardPosition));
  }, [cardPosition]);

  function moveCard(event: PointerEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    setCardPosition({
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 30, 78),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 24, 76),
    });
  }

  function startCardDrag(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    moveCard(event);
  }

  function dragCard(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    moveCard(event);
  }

  function stopCardDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <section id="how-it-works" className="scroll-mt-20">
      <div
        ref={frameRef}
        className="relative min-h-[420px] overflow-hidden rounded-[1.5rem] shadow-[0_24px_70px_-52px_rgba(8,50,115,0.5)] sm:min-h-[430px]"
      >
        <Image
          src="/images/process/telehealth-patient-phone-v2.png"
          alt="Patient using a phone during a telehealth consultation"
          fill
          priority={false}
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover object-[22%_center] sm:object-left"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-[#083273]/5" />

        <div
          role="button"
          tabIndex={0}
          aria-label="Move how it works card"
          onPointerDown={startCardDrag}
          onPointerMove={dragCard}
          onPointerUp={stopCardDrag}
          onPointerCancel={stopCardDrag}
          style={{ left: `${cardPosition.x}%`, top: `${cardPosition.y}%` }}
          className="absolute z-10 w-[51%] -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none rounded-[1rem] bg-[#083273] p-3 text-white shadow-[0_22px_60px_-38px_rgba(8,50,115,0.75)] outline-none transition-shadow duration-200 active:cursor-grabbing focus-visible:ring-3 focus-visible:ring-white/50 sm:w-[48%] sm:rounded-[1.25rem] sm:p-6 lg:w-[40%] xl:w-[36%]"
        >
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
