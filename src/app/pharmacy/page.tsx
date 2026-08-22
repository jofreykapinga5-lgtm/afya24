import type { Metadata } from "next";
import { getServerLocale } from "@/lib/locale-cookie";
import { getPublishedPharmacyItems } from "@/lib/pharmacy-items";
import { PharmacyCatalog } from "@/components/pharmacy-catalog";
import { t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("seo_pharmacy_title", locale),
    description: t("seo_pharmacy_description", locale),
  };
}

export default async function PharmacyPage() {
  const locale = await getServerLocale();
  const items = await getPublishedPharmacyItems();

  return <PharmacyCatalog items={items} locale={locale} />;
}
