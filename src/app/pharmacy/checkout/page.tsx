import { getServerLocale } from "@/lib/locale-cookie";
import { getPatientSession } from "@/lib/patient-session";
import { getPublishedPharmacyItems } from "@/lib/pharmacy-items";
import { PharmacyCheckoutClient } from "@/components/pharmacy-checkout-client";

export default async function PharmacyCheckoutPage() {
  const locale = await getServerLocale();
  const [session, items] = await Promise.all([getPatientSession(), getPublishedPharmacyItems()]);

  return <PharmacyCheckoutClient locale={locale} items={items} hasSession={Boolean(session)} />;
}
