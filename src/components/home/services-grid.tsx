"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";
import { serviceCategories } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";

type ServiceTile = {
  categoryId: string;
  labelKey: TranslationKey;
  priceKey?: TranslationKey;
  image: string;
  alt: string;
};

const serviceTabKeys: TranslationKey[] = [
  "home_service_tab_popular",
  "home_service_tab_ongoing_care",
  "home_service_tab_urgent_care",
  "home_service_tab_medications",
  "home_service_tab_labs_imaging",
];

const stitchServices: ServiceTile[] = [
  {
    categoryId: "cat-prescription",
    labelKey: "home_service_prescription_refills",
    image: "/images/services/prescription-bottle.png",
    alt: "Prescription medication bottle",
  },
  {
    categoryId: "cat-general",
    labelKey: "home_service_general_doctor",
    priceKey: "home_service_price_from_15000",
    image: "/images/services/fertility-doctor.png",
    alt: "Doctor providing online care",
  },
  {
    categoryId: "cat-urgent",
    labelKey: "home_service_tab_urgent_care",
    priceKey: "home_service_price_from_20000",
    image: "/images/services/urgent-care-doctor.png",
    alt: "Doctor ready for urgent care",
  },
  {
    categoryId: "cat-mental-health",
    labelKey: "home_service_mental_health",
    priceKey: "home_service_price_from_25000",
    image: "/images/services/mental-health-meds.png",
    alt: "Mental health medication tablets",
  },
  {
    categoryId: "cat-sexual-health",
    labelKey: "home_service_sexual_health",
    priceKey: "home_service_private_visit",
    image: "/images/services/doctor-note.png",
    alt: "Doctor preparing a confidential visit note",
  },
  {
    categoryId: "cat-dermatology",
    labelKey: "home_service_dermatology",
    priceKey: "home_service_photo_review",
    image: "/images/services/weight-loss-meds.png",
    alt: "Clean medical product photography",
  },
];

export function ServicesGrid() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const setQualificationComplaint = useAppStore((state) => state.setQualificationComplaint);

  function openCategory(categoryId: string, fallbackLabel: string) {
    const category = serviceCategories.find((item) => item.id === categoryId);
    setQualificationComplaint(category?.description ?? fallbackLabel);
    router.push("/qualification");
  }

  return (
    <section id="services" className="scroll-mt-20 py-2">
      <div className="mx-auto w-full max-w-4xl">
        <SectionHeading eyebrow={t("services_title", locale)} body={t("services_subtitle", locale)}>
          <span className="text-[#01b7bb]">{t("services_feature_title", locale)}</span>
        </SectionHeading>

        <nav
          aria-label={t("home_service_categories_aria", locale)}
          className="mt-4 flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden"
        >
          {serviceTabKeys.map((tabKey, index) => (
            <button
              key={tabKey}
              type="button"
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-brand-teal/25 ${
                index === 0
                  ? "border-[#01b7bb] bg-[#e9f8f7] text-[#087a7b]"
                  : "border-[#e4e9ec] bg-white text-[#4c5560] hover:border-[#d6dde2] hover:bg-[#f7f8f8]"
              }`}
            >
              {t(tabKey, locale)}
            </button>
          ))}
        </nav>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {stitchServices.map((service) => (
            <button
              key={service.categoryId}
              type="button"
              onClick={() => openCategory(service.categoryId, t(service.labelKey, locale))}
              className="group relative flex min-h-[96px] items-center overflow-hidden rounded-[1.05rem] bg-[#f7f7f7] px-4 py-3 text-left outline-none transition-all duration-300 hover:bg-[#f0f0f0] hover:shadow-[0_12px_28px_-26px_rgba(8,50,115,0.45)] focus-visible:ring-3 focus-visible:ring-brand-teal/30 sm:min-h-[108px] sm:px-5"
            >
              <div className="relative z-10 max-w-[58%]">
                <h3 className="text-[1rem] font-semibold leading-tight tracking-[-0.015em] text-[#171b20] sm:text-[1.05rem]">
                  {t(service.labelKey, locale)}
                </h3>
                {service.priceKey ? (
                  <p className="mt-1 text-xs leading-5 text-[#5c6670]">{t(service.priceKey, locale)}</p>
                ) : null}
              </div>

              <ServiceImage service={service} />

              <span className="relative z-10 ml-auto inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[#9aa2aa] transition-colors group-hover:text-[#4c5560]">
                <ArrowRight className="size-4" />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => router.push("/qualification")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#087a7b] outline-none transition-colors hover:text-[#065f63] focus-visible:ring-3 focus-visible:ring-brand-teal/25"
          >
            {t("home_explore_all_services", locale)}
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function ServiceImage({ service }: { service: ServiceTile }) {
  return (
    <div className="absolute right-10 top-1/2 size-16 -translate-y-1/2 overflow-hidden rounded-full bg-white sm:size-20">
      <Image
        src={service.image}
        alt={service.alt}
        fill
        sizes="96px"
        className="object-cover"
      />
    </div>
  );
}
