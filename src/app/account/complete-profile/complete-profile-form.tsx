"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { TzPhoneInput } from "@/components/tz-phone-input";
import { completeGoogleProfile } from "./actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function CompleteProfileForm({
  locale,
  suggestedName,
  redirectTo,
  error,
  errorCode,
}: {
  locale: Locale;
  suggestedName: string;
  redirectTo?: string;
  error?: string;
  // "phone_exists": a real account already owns this phone -- safe to offer
  // an actual Log in link. "phone_orphaned": a guest/AI-intake record with
  // no password or Google link owns it -- there is nothing to log in to
  // (see checkPatientPhoneCollision's comment), so no link is shown for it.
  errorCode?: string;
}) {
  return (
    <>
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p>{error}</p>
            {errorCode === "phone_exists" && (
              <Link href="/account" className="mt-1 inline-block font-semibold underline underline-offset-2">
                {t("account_phone_taken_login", locale)}
              </Link>
            )}
          </div>
        </div>
      )}

      <form action={completeGoogleProfile} className="mt-5 space-y-3">
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

        <label htmlFor="fullName" className="sr-only">
          {t("account_fullname_placeholder", locale)}
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          defaultValue={suggestedName}
          placeholder={t("account_fullname_placeholder", locale)}
          required
          className="h-13 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
        />

        <label htmlFor="phone" className="sr-only">
          {t("account_phone_hint_placeholder", locale)}
        </label>
        <TzPhoneInput id="phone" name="phone" placeholder={t("account_phone_format_example", locale)} />

        {/* Google never provides this (gender sits behind Google's
            restricted "sensitive scopes," effectively unreachable for an
            app like this) -- optional so this step doesn't gain extra
            friction over what it already asks for. */}
        <label htmlFor="gender" className="block text-sm font-medium text-[#33454f]">
          {t("account_gender_label", locale)}
        </label>
        <select
          id="gender"
          name="gender"
          defaultValue=""
          className="h-13 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
        >
          <option value="">{t("account_gender_placeholder", locale)}</option>
          <option value="female">{t("account_gender_female", locale)}</option>
          <option value="male">{t("account_gender_male", locale)}</option>
          <option value="other">{t("account_gender_other", locale)}</option>
        </select>

        <SubmitButton
          pendingText={t("common_please_wait", locale)}
          className="h-13 w-full rounded-full bg-[#01b7bb] text-base font-bold text-white hover:bg-[#019ea2] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/25"
        >
          {t("complete_profile_cta", locale)}
        </SubmitButton>
      </form>
    </>
  );
}
