"use client";

import { useState } from "react";
import { Phone, Search, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DobSelect } from "@/app/lookup/dob-select";
import { lookupPatient } from "@/app/lookup/actions";
import { signIn } from "./actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type Mode = "password" | "reference";

// Two ways to sign in as a patient: the full account (phone + password,
// see actions.ts's signIn) or the lightweight reference-number + date of
// birth session used by patients who never set a password (see
// lib/patient-session.ts). Both were always supported, but the reference
// route used to be a small footer link out to a separate /lookup page --
// promoted to an equal tab here instead, reusing the same lookupPatient
// action /lookup itself calls.
export function LoginForm({ locale, error }: { locale: Locale; error?: string }) {
  const [mode, setMode] = useState<Mode>("password");

  return (
    <div className="mt-7">
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#f0f4f3] p-1.5">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-colors ${
            mode === "password" ? "bg-white text-[#083273] shadow-sm" : "text-[#5d6970] hover:text-[#083273]"
          }`}
        >
          <Phone className="size-3.5" />
          {t("account_login_tab_password", locale)}
        </button>
        <button
          type="button"
          onClick={() => setMode("reference")}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-colors ${
            mode === "reference" ? "bg-white text-[#083273] shadow-sm" : "text-[#5d6970] hover:text-[#083273]"
          }`}
        >
          <Search className="size-3.5" />
          {t("account_login_tab_reference", locale)}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-urgent/30 bg-urgent-soft px-3.5 py-3 text-sm text-urgent">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {mode === "password" ? (
        <form action={signIn} className="mt-5 space-y-3">
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
          <button
            type="submit"
            className="h-13 w-full rounded-full bg-[#01b7bb] text-base font-bold text-white outline-none transition hover:bg-[#019ea2] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/25 active:translate-y-px"
          >
            {t("header_log_in", locale)}
          </button>
        </form>
      ) : (
        <form action={lookupPatient} className="mt-5 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="referenceNumber" className="text-sm font-bold text-[#071923]">
              {t("lookup_reference_label", locale)}
            </label>
            <Input
              id="referenceNumber"
              name="referenceNumber"
              placeholder="AF24-2026-00000"
              autoComplete="off"
              spellCheck={false}
              required
              className="h-13 rounded-2xl bg-[#f8fbfa] font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-sm font-bold text-[#071923]">{t("lookup_dob_label", locale)}</span>
            <DobSelect locale={locale} />
          </div>
          <button
            type="submit"
            className="h-13 w-full rounded-full bg-[#01b7bb] text-base font-bold text-white outline-none transition hover:bg-[#019ea2] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/25 active:translate-y-px"
          >
            {t("header_log_in", locale)}
          </button>
        </form>
      )}
    </div>
  );
}
