"use client";

import { useState } from "react";
import { ChevronDown, Search, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { DobSelect } from "@/app/lookup/dob-select";
import { lookupPatient } from "@/app/lookup/actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

// Lets a returning patient re-establish their session (reference number +
// date of birth, same verification as /lookup) right here instead of
// filling in the manual details form below -- the redirectTo hidden field sends
// lookupPatient back to this exact booking page. A resolved session there
// is enough on its own: BookingForm reads it server-side next render and
// skips the manual fields entirely (see hasSession there).
export function ReturningPatientLookup({
  locale,
  redirectTo,
  error,
}: {
  locale: Locale;
  redirectTo: string;
  error?: string;
}) {
  const [open, setOpen] = useState(Boolean(error));

  return (
    <div className="mb-5 overflow-hidden rounded-2xl bg-white ring-1 ring-[#e5eef0]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#f8fbfd]"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold text-[#071923]">
          <Search className="size-4 shrink-0 text-[#01b7bb]" />
          {t("doctor_booking_returning_patient_prompt", locale)}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-[#8a969c] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <form action={lookupPatient} className="grid gap-3 border-t border-[#eef2f3] px-4 py-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-[#fff4f0] px-4 py-3 text-sm text-[#9b2c12]">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="returning-reference" className="text-sm font-bold text-[#071923]">
              {t("lookup_reference_label", locale)}
            </label>
            <Input
              id="returning-reference"
              name="referenceNumber"
              placeholder="AF24-2026-00000"
              autoComplete="off"
              spellCheck={false}
              required
              className="h-11 rounded-xl bg-[#f8fbfd] font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-bold text-[#071923]">{t("lookup_dob_label", locale)}</span>
            <DobSelect locale={locale} />
          </div>

          <SubmitButton
            pendingText={t("common_please_wait", locale)}
            className="mt-1 h-11 w-full rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
          >
            {t("doctor_booking_returning_patient_confirm", locale)}
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
