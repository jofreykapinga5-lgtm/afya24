import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { faqPageJsonLd } from "@/lib/structured-data";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, type TranslationKey } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("help_title", locale),
    description: t("seo_help_description", locale),
  };
}

const faqs: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { titleKey: "help_q1_title", bodyKey: "help_q1_body" },
  { titleKey: "help_q2_title", bodyKey: "help_q2_body" },
  { titleKey: "help_q3_title", bodyKey: "help_q3_body" },
  { titleKey: "help_q4_title", bodyKey: "help_q4_body" },
  { titleKey: "help_q5_title", bodyKey: "help_q5_body" },
  { titleKey: "help_q6_title", bodyKey: "help_q6_body" },
  { titleKey: "help_q7_title", bodyKey: "help_q7_body" },
];

export default async function HelpPage() {
  const locale = await getServerLocale();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqPageJsonLd(
              faqs.map((faq) => ({
                question: t(faq.titleKey, locale),
                answer: t(faq.bodyKey, locale),
              }))
            )
          ),
        }}
      />
      <div className="mb-8">
        <Breadcrumbs
          items={[{ name: t("breadcrumb_home", locale), path: "/" }]}
          current={t("help_title", locale)}
          currentPath="/help"
        />
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{t("help_title", locale)}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("help_subtitle", locale)}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
        {faqs.map((faq) => (
          <section key={faq.titleKey}>
            <h2 className="text-base font-semibold">{t(faq.titleKey, locale)}</h2>
            <p className="mt-2 text-muted-foreground">{t(faq.bodyKey, locale)}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <Button nativeButton={false} render={<a href="mailto:support@afya24.com" />}>
          <Mail className="size-4" />
          {t("help_contact_cta", locale)}
        </Button>
      </div>
    </main>
  );
}
