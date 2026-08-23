import type { Metadata } from "next";
import { getServerLocale } from "@/lib/locale-cookie";
import { getPublishedPharmacyItems } from "@/lib/pharmacy-items";
import { PharmacyCatalog } from "@/components/pharmacy-catalog";
import { breadcrumbJsonLd } from "@/lib/structured-data";
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

  const jsonLd = breadcrumbJsonLd([
    { name: t("breadcrumb_home", locale), path: "/" },
    { name: t("nav_pharmacy", locale), path: "/pharmacy" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PharmacyCatalog items={items} locale={locale} />
    </>
  );
}
