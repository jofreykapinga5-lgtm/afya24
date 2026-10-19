import type { Metadata } from "next";
import { HedhiLegalDoc } from "@/components/hedhi/hedhi-legal-doc";
import { LEGAL } from "@/lib/hedhi-legal";
import { getServerLocale } from "@/lib/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const doc = LEGAL.privacy[locale];
  return { title: `${doc.title} | Hedhi`, description: doc.intro };
}

// Public privacy policy of the Hedhi app (the link given to Google Play).
export default async function HedhiPrivacyPage() {
  const locale = await getServerLocale();
  return <HedhiLegalDoc doc={LEGAL.privacy[locale]} locale={locale} path="/hedhi/privacy" />;
}
