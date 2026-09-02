"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { signIn } from "./actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

// Phone + password, or Google -- the reference-number + date-of-birth
// session (this form used to offer it as an equal tab) was a login method,
// not just a record ID; every patient needs a real account to see or book a
// doctor, so that lighter-weight way in is gone, replaced by Google as the
// actual low-friction option instead.
export function LoginForm({
  locale,
  error,
  redirectTo,
  errorRedirectPath,
}: {
  locale: Locale;
  error?: string;
  redirectTo?: string;
  // Where a failed attempt should redirect back to (with ?error= set) --
  // omit to keep the default of /account. Used when this same form is
  // embedded somewhere else, e.g. a doctor's profile page, so a wrong
  // password doesn't bounce the patient off to the standalone login page.
  errorRedirectPath?: string;
}) {
  return (
    <div className="mt-7">
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form action={signIn} className="mt-4 space-y-3">
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
        {errorRedirectPath && (
          <input type="hidden" name="errorRedirectPath" value={errorRedirectPath} />
        )}
        <label htmlFor="phone" className="sr-only">
          {t("account_phone_placeholder", locale)}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder={t("account_phone_placeholder", locale)}
          required
          className="h-13 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
        />
        <label htmlFor="password" className="sr-only">
          {t("account_password_placeholder", locale)}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={t("account_password_placeholder", locale)}
          required
          className="h-13 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
        />
        <Link
          href="/account/forgot-password"
          className="-mt-1 block text-right text-xs font-semibold text-[#083273] hover:underline"
        >
          {t("account_forgot_password_link", locale)}
        </Link>
        <SubmitButton
          pendingText={t("common_please_wait", locale)}
          className="h-13 w-full rounded-full bg-[#01b7bb] text-base font-bold text-white hover:bg-[#019ea2] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/25"
        >
          {t("header_log_in", locale)}
        </SubmitButton>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs font-semibold text-[#8a969c]">
        <span className="h-px flex-1 bg-[#e5ecea]" />
        {t("account_divider_or", locale)}
        <span className="h-px flex-1 bg-[#e5ecea]" />
      </div>

      <GoogleSignInButton locale={locale} redirectTo={redirectTo} className="h-13 w-full rounded-full" />
    </div>
  );
}
