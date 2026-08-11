"use client";

import { Brain, Camera, Lock, Pill, Stethoscope, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { SectionHeading } from "@/components/home/section-heading";
import { serviceCategories } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

// One consistent icon-tile treatment for every category -- three of these
// six never had real photography, which made the grid look half-broken
// (three photo tiles, three blank gradients). Icons read as an intentional
// design choice; a mix of real photos and empty placeholders doesn't.
const serviceMedia: Record<
  string,
  {
    icon: typeof Stethoscope;
    tone: string;
  }
> = {
  "cat-general": { icon: Stethoscope, tone: "bg-[#e8eff2]" },
  "cat-urgent": { icon: Zap, tone: "bg-[#edf0f2]" },
  "cat-mental-health": { icon: Brain, tone: "bg-[#edf1f6]" },
  "cat-dermatology": { icon: Camera, tone: "bg-[#eaf2ee]" },
  "cat-sexual-health": { icon: Lock, tone: "bg-[#f1eef4]" },
  "cat-prescription": { icon: Pill, tone: "bg-[#eef0f2]" },
};

export function ServicesGrid() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const setQualificationComplaint = useAppStore((state) => state.setQualificationComplaint);
  const featuredCategories = serviceCategories.slice(0, 6);

  function openCategory(description: string) {
    setQualificationComplaint(description);
    router.push("/qualification");
  }

  return (
    <section id="services" className="scroll-mt-20 py-8">
      <div className="rounded-[1.75rem] bg-[#f6f8f8] p-4 sm:p-6 lg:p-8">
        <SectionHeading eyebrow={t("services_title", locale)} body={t("services_subtitle", locale)}>
          <span className="text-[#01b7bb]">{t("services_feature_title", locale)}</span>
        </SectionHeading>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCategories.map((category) => {
              const media = serviceMedia[category.id] ?? {
                icon: Stethoscope,
                tone: "bg-[#eef1f3]",
              };
              const Icon = media.icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => openCategory(category.description)}
                  className="group grid min-h-[126px] overflow-hidden rounded-2xl bg-card text-left outline-none transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-26px_rgba(8,50,115,0.42)] focus-visible:ring-3 focus-visible:ring-ring/40 sm:grid-cols-[96px_1fr]"
                >
                  <div
                    className={`relative flex min-h-[104px] items-center justify-center overflow-hidden ${media.tone}`}
                  >
                    <Icon
                      className="size-8 text-primary transition duration-300 group-hover:scale-110"
                      strokeWidth={1.75}
                    />
                  </div>

                  <div className="flex min-w-0 items-center p-4">
                    <h3 className="text-2xl font-medium leading-tight tracking-tight text-foreground">
                      {category.name}
                    </h3>
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </section>
  );
}
