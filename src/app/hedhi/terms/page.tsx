import type { Metadata } from "next";
import { HedhiLegalDoc } from "@/components/hedhi/hedhi-legal-doc";
import { LEGAL } from "@/lib/hedhi-legal";
import { getServerLocale } from "@/lib/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const doc = LEGAL.terms[locale];
  return { title: `${doc.title} | Hedhi`, description: doc.intro };
}

// Public terms of use of the Hedhi app.
export default async function HedhiTermsPage() {
  const locale = await getServerLocale();
  return <HedhiLegalDoc doc={LEGAL.terms[locale]} locale={locale} path="/hedhi/terms" />;
}
