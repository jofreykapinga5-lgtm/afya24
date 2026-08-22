import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, type TranslationKey } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("terms_title", locale),
    description: t("seo_terms_description", locale),
  };
}

const sections: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { titleKey: "terms_s1_title", bodyKey: "terms_s1_body" },
  { titleKey: "terms_s2_title", bodyKey: "terms_s2_body" },
  { titleKey: "terms_s3_title", bodyKey: "terms_s3_body" },
  { titleKey: "terms_s4_title", bodyKey: "terms_s4_body" },
  { titleKey: "terms_s5_title", bodyKey: "terms_s5_body" },
  { titleKey: "terms_s6_title", bodyKey: "terms_s6_body" },
  { titleKey: "terms_s7_title", bodyKey: "terms_s7_body" },
];

export default async function TermsPage() {
  const locale = await getServerLocale();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-3.5" />
        {t("back_to_home", locale)}
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">{t("terms_title", locale)}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("legal_last_updated", locale)}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
        {sections.map((section) => (
          <section key={section.titleKey}>
            <h2 className="text-base font-semibold">{t(section.titleKey, locale)}</h2>
            <p className="mt-2 text-muted-foreground">{t(section.bodyKey, locale)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
