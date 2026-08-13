"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AiChatHeroCard } from "@/components/ai-chat-hero-card";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

function Hero() {
  const locale = useAppStore((state) => state.locale);
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
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="relative w-full overflow-hidden bg-[#e9f8f7]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(8,50,115,0.06)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-96 -translate-x-1/2 rounded-full bg-[#01b7bb]/14 blur-3xl"
      />
      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-8 py-14 sm:py-16 lg:py-20">
          <div className="flex max-w-2xl flex-col gap-4">
            <h1 className="text-center text-3xl font-regular tracking-tighter sm:text-4xl">
              <span className="text-foreground">{t("hero_headline_prefix", locale)}</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={title}
                    className="absolute font-semibold text-primary"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="mx-auto max-w-xl text-center text-base leading-relaxed tracking-tight text-muted-foreground sm:text-lg">
              {t("hero_body", locale)}
            </p>
          </div>
          <div className="w-full max-w-xl">
            <AiChatHeroCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
