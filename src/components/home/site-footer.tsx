"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";

const quickLinks: { href: string; labelKey: TranslationKey }[] = [
  { href: "#how-it-works", labelKey: "nav_how_it_works" },
  { href: "#doctors", labelKey: "nav_doctors" },
  { href: "#services", labelKey: "services_title" },
  { href: "/pharmacy", labelKey: "nav_pharmacy" },
  { href: "#labs", labelKey: "nav_labs" },
  { href: "#health-tips", labelKey: "nav_health_tips" },
];

const linkClass =
  "rounded-sm text-sm text-white/75 outline-none transition-colors hover:text-white focus-visible:ring-3 focus-visible:ring-white/40";

export function SiteFooter() {
  const locale = useAppStore((state) => state.locale);

  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-6">
          <div className="space-y-4 md:col-span-4">
            <span className="inline-flex w-fit rounded-lg bg-white px-2.5 py-1.5">
              <Image
                src="/brand/afya24-logo-footer.png"
                alt="Afya24"
                width={160}
                height={51}
                style={{ width: "auto" }}
                className="h-6"
              />
            </span>
            <p className="max-w-sm text-sm text-white/75">{t("footer_tagline", locale)}</p>
            <span className="inline-flex rounded-full bg-white/90 p-0.5">
              <LanguageToggle />
            </span>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:col-span-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-white">
                {t("footer_quick_links", locale)}
              </p>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith("#") ? (
                      <a href={link.href} className={linkClass}>
                        {t(link.labelKey, locale)}
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>
                        {t(link.labelKey, locale)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-white">
                {t("footer_patient_support", locale)}
              </p>
              <ul className="space-y-3">
                <li>
                  <Link href="/account" className={linkClass}>
                    {t("footer_find_my_visit", locale)}
                  </Link>
                </li>
                <li>
                  <Link href="/help" className={linkClass}>
                    {t("footer_help_center", locale)}
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@afya24.com" className={linkClass}>
                    {t("footer_contact_support", locale)}
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-white">
                {t("footer_for_providers", locale)}
              </p>
              <ul className="space-y-3">
                <li>
                  <Link href="/doctor" className={linkClass}>
                    {t("header_doctor_admin_login", locale)}
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@afya24.com?subject=Provider%20application"
                    className={linkClass}
                  >
                    {t("footer_join_provider", locale)}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 border-t border-white/15 pt-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-3 text-xs text-white/75">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-primary">
              24
            </span>
            <p>
              &copy; {new Date().getFullYear()} Afya24. {t("footer_all_rights", locale)}
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link href="/privacy" className={linkClass}>
              {t("footer_privacy_policy", locale)}
            </Link>
            <Link href="/terms" className={linkClass}>
              {t("footer_terms", locale)}
            </Link>
          </div>

          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-center text-xs font-medium text-white">
            {t("footer_emergency_note", locale)}
          </span>
        </div>
      </div>
    </footer>
  );
}
