import { getServerLocale } from "@/lib/locale-cookie";
import { getPublishedPharmacyItems } from "@/lib/pharmacy-items";
import { PharmacyCatalog } from "@/components/pharmacy-catalog";

export default async function PharmacyPage() {
  const locale = await getServerLocale();
  const items = await getPublishedPharmacyItems();

  return <PharmacyCatalog items={items} locale={locale} />;
}
