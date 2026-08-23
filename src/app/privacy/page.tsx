import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, type TranslationKey } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("privacy_title", locale),
    description: t("seo_privacy_description", locale),
  };
}

const sections: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { titleKey: "privacy_s1_title", bodyKey: "privacy_s1_body" },
  { titleKey: "privacy_s2_title", bodyKey: "privacy_s2_body" },
  { titleKey: "privacy_s3_title", bodyKey: "privacy_s3_body" },
  { titleKey: "privacy_s4_title", bodyKey: "privacy_s4_body" },
  { titleKey: "privacy_s5_title", bodyKey: "privacy_s5_body" },
  { titleKey: "privacy_s6_title", bodyKey: "privacy_s6_body" },
  { titleKey: "privacy_s7_title", bodyKey: "privacy_s7_body" },
];

export default async function PrivacyPage() {
  const locale = await getServerLocale();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14 sm:px-6">
      <div className="mb-8">
        <Breadcrumbs
          items={[{ name: t("breadcrumb_home", locale), path: "/" }]}
          current={t("privacy_title", locale)}
          currentPath="/privacy"
        />
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{t("privacy_title", locale)}</h1>
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
