"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { Reveal } from "@/components/motion/reveal";

function Hero() {
  const locale = useAppStore((state) => state.locale);
  const reduceMotion = useReducedMotion();
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => [
      t("hero_title_fast", locale),
      t("hero_title_private", locale),
      t("hero_title_affordable", locale),
      t("hero_title_simple", locale),
      t("hero_title_convenient", locale),
    ],
    [locale]
  );

  useEffect(() => {
    if (reduceMotion) return;
    const timeoutId = setTimeout(() => {
      setTitleNumber((current) => (current === titles.length - 1 ? 0 : current + 1));
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles, reduceMotion]);

  return (
    <div className="relative isolate w-full overflow-hidden bg-[#052052]">
      <Image
        src="/images/process/hero-doctor-blue.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover object-[70%_center] sm:object-[62%_center]"
      />
      <div className="absolute inset-0 -z-10 bg-[#0a3d8f]/50 mix-blend-multiply" />
      <div className="absolute inset-0 -z-10 bg-[#052052]/15" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-[#e9f8f7] to-transparent" />

      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="flex min-h-[560px] flex-col items-center justify-center py-16 text-center sm:py-20 lg:py-24">
          <Reveal variant="fade">
            <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
              <h1 className="text-4xl font-bold leading-[1.15] tracking-[-0.03em] text-white [text-shadow:0_2px_24px_rgba(5,32,82,0.55)] sm:text-5xl sm:leading-[1.15] lg:text-6xl">
                {t("hero_headline_prefix", locale)}
                <span className="relative flex h-[1.15em] w-full items-center justify-center overflow-hidden text-[#7cf1ee]">
                  {titles.map((title, index) =>
                    reduceMotion ? (
                      titleNumber === 0 && index === 0 ? (
                        <span key={title}>{title}</span>
                      ) : null
                    ) : (
                      <motion.span
                        key={title}
                        className="absolute"
                        initial={{ opacity: 0, y: "-100%" }}
                        transition={{ type: "spring", stiffness: 50 }}
                        animate={
                          titleNumber === index
                            ? { y: "0%", opacity: 1 }
                            : { y: titleNumber > index ? "-150%" : "150%", opacity: 0 }
                        }
                      >
                        {title}
                      </motion.span>
                    )
                  )}
                </span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-white/90 [text-shadow:0_1px_16px_rgba(5,32,82,0.55)] sm:text-lg">
                {t("hero_body", locale)}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Link
                  href="/doctors"
                  className="group inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-primary px-8 text-base font-bold text-primary-foreground shadow-[0_22px_50px_-20px_rgba(47,111,192,0.85)] ring-1 ring-white/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
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
