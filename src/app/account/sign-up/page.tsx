import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirectIfStaffUser } from "@/lib/staff-redirect-guard";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { SubmitButton } from "@/components/submit-button";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { signUp } from "../actions";

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
    <main className="flex min-h-[100dvh] flex-col bg-white">
      <div className="sticky top-0 z-30 border-b border-[#edf2f1] bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
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

      <div className="mx-auto w-full max-w-sm px-4 py-8 sm:px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#071923] sm:text-[28px]">
            {t("account_signup_title", locale)}
          </h1>
          <p className="mt-2 text-sm leading-5 text-[#5d6970]">
            {t("account_signup_body", locale)}
          </p>
        </div>

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

        <GoogleSignInButton locale={locale} redirectTo={redirectTo} className="h-13 w-full rounded-full" />

        <div className="mt-4 rounded-2xl bg-[#f8fbfa] p-3 text-center text-sm text-[#5d6970]">
          <span>{t("account_already_customer", locale)}</span>{" "}
          <Link
            href={redirectTo ? `/account?redirectTo=${encodeURIComponent(redirectTo)}` : "/account"}
            className="font-bold text-[#083273] hover:underline"
          >
            {t("header_log_in", locale)}
          </Link>
        </div>
      </div>
    </main>
  );
}
