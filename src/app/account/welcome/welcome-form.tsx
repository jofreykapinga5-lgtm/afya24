"use client";

import { SubmitButton } from "@/components/submit-button";
import { completeOptionalProfile, skipOptionalProfile } from "./actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function WelcomeForm({ locale, redirectTo }: { locale: Locale; redirectTo?: string }) {
  return (
    <div className="mt-7">
      <form action={completeOptionalProfile} className="space-y-3.5">
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

        <div className="space-y-1.5">
          <label htmlFor="fullName" className="text-sm font-medium text-[#071923]">
            {t("account_fullname_placeholder", locale)}
          </label>
          <input
            id="fullName"
            name="fullName"
            autoComplete="name"
            className="h-12 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="gender" className="text-sm font-medium text-[#071923]">
              {t("account_gender_label", locale)}
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue=""
              className="h-12 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
            >
              <option value="">{t("account_gender_placeholder", locale)}</option>
              <option value="female">{t("account_gender_female", locale)}</option>
              <option value="male">{t("account_gender_male", locale)}</option>
              <option value="other">{t("account_gender_other", locale)}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="age" className="text-sm font-medium text-[#071923]">
              {t("account_welcome_age_label", locale)}
            </label>
            <input
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              min={0}
              max={130}
              placeholder={t("account_welcome_age_placeholder", locale)}
              className="h-12 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#a8b4b8] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="location" className="text-sm font-medium text-[#071923]">
            {t("account_welcome_location_label", locale)}
          </label>
          <input
            id="location"
            name="location"
            autoComplete="address-level2"
            placeholder={t("account_welcome_location_placeholder", locale)}
            className="h-12 w-full rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-base text-[#071923] outline-none placeholder:text-[#a8b4b8] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
          />
        </div>

        <SubmitButton
          pendingText={t("common_please_wait", locale)}
          className="h-13 w-full rounded-full bg-[#01b7bb] text-base font-bold text-white hover:bg-[#019ea2] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/25"
        >
          {t("account_welcome_continue", locale)}
        </SubmitButton>
      </form>

      <form action={skipOptionalProfile} className="mt-3">
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
        <button type="submit" className="w-full text-center text-sm font-semibold text-[#5d6970] hover:underline">
          {t("account_welcome_skip", locale)}
        </button>
      </form>
    </div>
  );
}
