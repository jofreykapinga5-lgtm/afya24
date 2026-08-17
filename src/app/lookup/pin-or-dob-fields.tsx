"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DobSelect } from "./dob-select";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function PinOrDobFields({ locale }: { locale: Locale }) {
  const [usePin, setUsePin] = useState(true);

  return (
    <div className="space-y-1.5">
      {usePin ? (
        <>
          <label htmlFor="pin" className="text-sm font-bold text-[#071923]">
            {t("lookup_pin_label", locale)}
          </label>
          <Input
            id="pin"
            name="pin"
            className="h-11 rounded-xl bg-[#f8fbfd]"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="off"
          />
        </>
      ) : (
        <>
          <span className="text-sm font-bold text-[#071923]">{t("lookup_dob_label", locale)}</span>
          <DobSelect locale={locale} />
        </>
      )}
      <button
        type="button"
        onClick={() => setUsePin((value) => !value)}
        className="block text-xs font-medium text-[#01b7bb] underline-offset-4 hover:underline"
      >
        {usePin ? t("lookup_use_dob_instead", locale) : t("lookup_use_pin_instead", locale)}
      </button>
    </div>
  );
}
