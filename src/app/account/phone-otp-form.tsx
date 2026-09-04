"use client";

import { TriangleAlert } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { TzPhoneInput } from "@/components/tz-phone-input";
import { requestPatientOtp } from "./actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

// Phone+OTP, or Continue with Google -- the only two ways a patient gets in
// now (see actions.ts's requestPatientOtp/verifyPatientOtp). One form for
// both /account and /account/sign-up: there's no separate "sign up" step
// anymore -- requesting a code and verifying it transparently handles a
// first-time phone (creates the account), a returning one (signs in), or an
// orphaned guest/AI-intake record (claims it), all in verifyPatientOtp.
// Terms/privacy are a passive disclosure under the button, not a checkbox
// gate, since the same form now also serves a returning patient signing in.
export function PhoneOtpForm({
  locale,
  error,
  redirectTo,
  ctaLabel,
}: {
  locale: Locale;
  error?: string;
  redirectTo?: string;
  ctaLabel: string;
}) {
  return (
    <div className="mt-7">
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form action={requestPatientOtp} className="mt-4 space-y-3">
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
        <label htmlFor="phone" className="sr-only">
          {t("account_phone_placeholder", locale)}
        </label>
        <TzPhoneInput id="phone" name="phone" placeholder={t("account_phone_format_example", locale)} />
        <SubmitButton
          pendingText={t("common_please_wait", locale)}
          className="h-13 w-full rounded-full bg-[#01b7bb] text-base font-bold text-white hover:bg-[#019ea2] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/25"
        >
          {ctaLabel}
        </SubmitButton>
        <p className="px-1 text-center text-xs leading-5 text-[#8a969c]">
          {t("account_otp_terms_disclosure", locale)}
        </p>
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
