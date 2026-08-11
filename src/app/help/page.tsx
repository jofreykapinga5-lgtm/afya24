import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, type TranslationKey } from "@/lib/i18n";

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
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-3.5" />
        {t("back_to_home", locale)}
      </Link>

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
