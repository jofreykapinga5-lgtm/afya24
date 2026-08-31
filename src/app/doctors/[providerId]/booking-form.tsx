"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookConsultation, startOverAsNewPatient } from "../actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Locale, Provider } from "@/lib/types";

export function BookingForm({
  provider,
  locale,
  hasSession,
  existingPatientName,
  redirectTo,
}: {
  provider: Provider;
  locale: Locale;
  hasSession: boolean;
  existingPatientName?: string | null;
  redirectTo: string;
}) {
  const router = useRouter();
  const qualificationResult = useAppStore((state) => state.qualificationResult);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function bookWithSession() {
    startTransition(async () => {
      const result = await bookConsultation({
        providerId: provider.id,
        locale,
        qualification: qualificationResult,
      });
      if (result.ok) {
        router.push(`/consultation/${result.appointmentId}/pay`);
      } else {
        // Show the real reason instead of a generic "try again" -- the fix
        // is usually specific (session expired, no doctors available, a
        // database error) and "try again" alone won't help when the same
        // click will just fail the same way again.
        setError(result.message || t("doctor_booking_error", locale));
      }
    });
  }

  function handleStartOver() {
    startTransition(async () => {
      await startOverAsNewPatient(provider.id);
    });
  }

  if (hasSession && existingPatientName) {
    const firstName = existingPatientName.trim().split(/\s+/)[0];
    return (
      <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7">
        {qualificationResult && (
          <p className="mb-4 text-xs text-[#60717a]">{t("doctor_booking_summary_note", locale)}</p>
        )}

        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-[#fff4f0] px-4 py-3 text-sm text-[#9b2c12]">
            {error}
          </p>
        )}

        {/* Two standalone buttons, not a <form> -- neither is submitting
            fields, and nesting startOverAsNewPatient's own form inside this
            component's form (the previous shape) is invalid HTML: browsers
            can't nest <form> elements, so the server-rendered markup and
            React's client tree disagreed on structure, surfacing as a real
            hydration error plus a "form was unexpectedly submitted" crash
            in production. */}
        <div className="grid gap-3">
          <Button
            type="button"
            disabled={pending}
            onClick={bookWithSession}
            className="h-12 w-full rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
          >
            <UserRound className="size-4" />
            {pending
              ? t("doctor_booking_confirm_pending", locale)
              : `${t("doctor_booking_continuing_as", locale)} ${firstName}`}
            <ArrowRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={handleStartOver}
            className="h-11 w-full rounded-full font-semibold"
          >
            {t("doctor_booking_not_you", locale)}
          </Button>
        </div>

        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#60717a]">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#01b7bb]" />
          {t("doctor_booking_trust_note", locale)}
        </p>
      </div>
    );
  }

  // No real account (patients.user_id) tied to this session -- booking now
  // requires one everywhere, whether via the AI intake chat or landing
  // directly on a doctor's profile. This replaces the old "type your name/
  // phone/DOB right here" fallback form and the reference-number "returning
  // patient" lookup with a straightforward login/sign-up prompt that sends
  // the patient right back to this exact doctor afterward.
  return (
    <div className="rounded-[1.75rem] bg-white p-6 text-center shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#e8f7f4] text-[#01b7bb]">
        <UserRound className="size-5" />
      </span>
      <p className="mt-3 font-bold text-[#071923]">{t("doctor_booking_login_required_title", locale)}</p>
      <p className="mt-1 text-sm text-[#60717a]">{t("doctor_booking_login_required_body", locale)}</p>

      <div className="mt-5 grid gap-3">
        <Button
          nativeButton={false}
          render={<Link href={`/account?redirectTo=${encodeURIComponent(redirectTo)}`} />}
          className="h-12 w-full rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
        >
          {t("header_log_in", locale)}
          <ArrowRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/account/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`} />}
          className="h-11 w-full rounded-full font-semibold"
        >
          {t("account_create_account_link", locale)}
        </Button>
      </div>

      <p className="mt-4 flex items-start gap-2 text-left text-xs leading-5 text-[#60717a]">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#01b7bb]" />
        {t("doctor_booking_trust_note", locale)}
      </p>
    </div>
  );
}
