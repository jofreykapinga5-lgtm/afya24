"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneOtpForm } from "@/app/account/phone-otp-form";
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
  loginError,
}: {
  provider: Provider;
  locale: Locale;
  hasSession: boolean;
  existingPatientName?: string | null;
  redirectTo: string;
  loginError?: string;
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
  // directly on a doctor's profile. The phone entry starts right here
  // (below the doctor's own card above); entering the code it texts is a
  // brief detour to /account/verify, which sends the patient right back
  // here afterward via redirectTo -- same as every other entry point.
  return (
    <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7">
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-tight text-[#071923]">
          {t("account_welcome_back", locale)}
        </h2>
        <p className="mt-1 text-sm text-[#60717a]">{t("account_login_title", locale)}</p>
      </div>

      <PhoneOtpForm
        locale={locale}
        error={loginError}
        redirectTo={redirectTo}
        ctaLabel={t("account_continue_cta", locale)}
      />

      <div className="mt-5 rounded-2xl bg-[#f8fbfa] p-4 text-center text-sm text-[#5d6970]">
        <span>{t("account_new_to_afya24", locale)}</span>{" "}
        <Link
          href={`/account/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="font-bold text-[#083273] hover:underline"
        >
          {t("account_create_account_link", locale)}
        </Link>
      </div>

      <Link
        href={`/doctors/${provider.id}/guest`}
        className="mt-4 block w-full text-center text-sm font-medium text-[#60717a] underline-offset-4 hover:text-[#083273] hover:underline"
      >
        {t("account_continue_without_account", locale)}
      </Link>

      <p className="mt-4 flex items-start gap-2 text-left text-xs leading-5 text-[#60717a]">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#01b7bb]" />
        {t("doctor_booking_trust_note", locale)}
      </p>
    </div>
  );
}
