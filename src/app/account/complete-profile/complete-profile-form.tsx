"use client";

import { TriangleAlert } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { completeGoogleProfile } from "./actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function CompleteProfileForm({
  locale,
  suggestedName,
  redirectTo,
  error,
}: {
  locale: Locale;
  suggestedName: string;
  redirectTo?: string;
  error?: string;
}) {
  return (
    <>
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
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
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder={t("account_phone_hint_placeholder", locale)}
          pattern="\+[0-9]{9,15}"
          title={t("account_phone_hint_title", locale)}
          required
          className="h-13 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
        />

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
