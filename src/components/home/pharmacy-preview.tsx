"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/home/section-heading";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export function PharmacyPreview() {
  const locale = useAppStore((state) => state.locale);

  return (
    <section id="pharmacy" className="scroll-mt-20">
      <div className="overflow-hidden rounded-[1.75rem] bg-white px-5 py-8 ring-1 ring-black/5 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-5xl">
          <SectionHeading eyebrow={t("pharmacy_preview_label", locale)}>
            <span className="text-[#01b7bb]">{t("pharmacy_preview_title_accent", locale)}</span>{" "}
            {t("pharmacy_preview_title_rest", locale)}
          </SectionHeading>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5">
            <MedicineImageCard
              href="/pharmacy"
              image="/images/pharmacy/white-supplement-bottle.jpg"
              title={t("pharmacy_preview_supplements_card", locale)}
              body={t("pharmacy_preview_supplements_body", locale)}
            />
            <MedicineImageCard
              href="/pharmacy"
              image="/images/pharmacy/medicine-bottle-tablets.jpg"
              title={t("pharmacy_preview_medicine_card", locale)}
              body={t("pharmacy_preview_medicine_body", locale)}
            />
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              className="h-11 w-fit gap-2 rounded-full bg-[#01b7bb] px-5 text-white hover:bg-[#019ea2]"
              nativeButton={false}
              render={<Link href="/pharmacy" />}
            >
              {t("pharmacy_preview_open_cta", locale)}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function MedicineImageCard({
  href,
  image,
  title,
  body,
}: {
  href: string;
  image: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group relative min-h-[250px] overflow-hidden rounded-[1.4rem] bg-white shadow-[0_22px_70px_-48px_rgba(15,23,42,0.5)] ring-1 ring-black/5 sm:min-h-[330px]"
    >
      <Image
        src={image}
        alt={title}
        fill
        sizes="(min-width: 1024px) 280px, 100vw"
        className="object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <p className="text-base font-bold leading-tight">{title}</p>
        <p className="mt-1 max-w-[24ch] text-xs leading-5 text-white/78">{body}</p>
      </div>
    </Link>
  );
}
