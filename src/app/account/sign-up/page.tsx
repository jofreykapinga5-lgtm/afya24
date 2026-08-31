import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirectIfStaffUser } from "@/lib/staff-redirect-guard";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, type TranslationKey } from "@/lib/i18n";
import { SubmitButton } from "@/components/submit-button";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { signUp } from "../actions";

const benefitKeys: TranslationKey[] = [
  "account_benefit1",
  "account_benefit2",
  "account_benefit3",
  "account_benefit4",
];

export default async function AccountSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo } = await searchParams;
  const locale = await getServerLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await redirectIfStaffUser(user.id);
    redirect(safeRedirectPath(redirectTo, "/account/dashboard"));
  }

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-white px-4 sm:px-6 lg:px-8">
      <div className="shrink-0 -mx-4 flex border-b border-[#edf2f1] bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/brand/afya24-logo-header.png"
            alt="Afya24"
            width={220}
            height={70}
            priority
            style={{ width: "auto" }}
            className="h-8"
          />
        </Link>
        </div>
      </div>

      <div className="mx-auto grid min-h-0 flex-1 w-full max-w-4xl gap-6 py-4 md:grid-cols-[1fr_320px] md:items-center lg:py-5">
        <section className="mx-auto w-full max-w-[420px] md:order-1">
          <p className="text-sm font-semibold text-[#0a5260]">
            {t("account_create_account_link", locale)}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#071923]">
            {t("account_signup_title", locale)}
          </h1>
          <p className="mt-2 text-sm leading-5 text-[#5d6970]">
            {t("account_signup_body", locale)}
          </p>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-2xl border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form action={signUp} className="mt-5 space-y-2.5">
            {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
            <label htmlFor="signup-fullName" className="sr-only">
              {t("account_fullname_placeholder", locale)}
            </label>
            <input
              id="signup-fullName"
              name="fullName"
              autoComplete="name"
              placeholder={t("account_fullname_placeholder", locale)}
              required
              className="h-12 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
            />
            <label htmlFor="signup-phone" className="sr-only">
              {t("account_phone_hint_placeholder", locale)}
            </label>
            <input
              id="signup-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder={t("account_phone_hint_placeholder", locale)}
              pattern="\+[0-9]{9,15}"
              title={t("account_phone_hint_title", locale)}
              required
              className="h-12 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
            />
            <label htmlFor="signup-password" className="sr-only">
              {t("account_password_placeholder", locale)}
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={t("account_password_placeholder", locale)}
              minLength={8}
              required
              className="h-12 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
            />

            <label className="flex items-start gap-2.5 pt-0.5 text-xs leading-5 text-[#24343b]">
              <input
                type="checkbox"
                name="agreedToTerms"
                required
                className="mt-0.5 size-4 shrink-0 rounded border-[#b9cbc8] text-[#01b7bb] outline-none focus-visible:ring-3 focus-visible:ring-[#01b7bb]/30"
              />
              <span>
                {t("account_agree_prefix", locale)}{" "}
                <Link href="/terms" className="font-semibold text-[#083273] hover:underline">
                  {t("account_terms_of_service_link", locale)}
                </Link>{" "}
                {t("account_and", locale)}{" "}
                <Link href="/privacy" className="font-semibold text-[#083273] hover:underline">
                  {t("account_privacy_policy_link", locale)}
                </Link>
                .
              </span>
            </label>

            <SubmitButton
              pendingText={t("common_please_wait", locale)}
              className="h-12 w-full rounded-full bg-[#01b7bb] text-base font-bold text-white hover:bg-[#019ea2] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/25"
            >
              {t("account_create_cta", locale)}
            </SubmitButton>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs font-semibold text-[#8a969c]">
            <span className="h-px flex-1 bg-[#e5ecea]" />
            {t("account_divider_or", locale)}
            <span className="h-px flex-1 bg-[#e5ecea]" />
          </div>

          <GoogleSignInButton locale={locale} redirectTo={redirectTo} />

          <div className="mt-4 rounded-2xl bg-[#f8fbfa] p-3 text-center text-sm text-[#5d6970]">
            <span>{t("account_already_customer", locale)}</span>{" "}
            <Link
              href={redirectTo ? `/account?redirectTo=${encodeURIComponent(redirectTo)}` : "/account"}
              className="font-bold text-[#083273] hover:underline"
            >
              {t("header_log_in", locale)}
            </Link>
          </div>
        </section>

        <section className="relative hidden h-[min(430px,calc(100dvh-116px))] min-h-0 overflow-hidden rounded-[1.5rem] bg-[#f4faf9] md:order-2 md:block">
          <Image
            src="/images/trust/ai-assist.jpg"
            alt="Doctor preparing for an Afya24 patient consultation"
            fill
            sizes="(min-width: 768px) 340px, 100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071923]/55 via-transparent to-transparent" />
          <div className="absolute inset-x-4 bottom-4 rounded-[1.25rem] bg-white/88 p-4 shadow-[0_20px_60px_-35px_rgba(8,50,115,0.55)] backdrop-blur">
            <p className="text-sm font-semibold text-[#083273]">{t("brand_tagline", locale)}</p>
            <div className="mt-3 grid gap-2">
              {benefitKeys.map((key) => (
                <div key={key} className="flex items-center gap-2 text-xs text-[#4d5960]">
                  <Check className="size-4 shrink-0 text-[#01b7bb]" />
                  <span>{t(key, locale)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
