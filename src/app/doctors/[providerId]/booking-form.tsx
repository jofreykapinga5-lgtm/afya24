"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DobSelect } from "@/app/lookup/dob-select";
import { ReturningPatientLookup } from "./returning-patient-lookup";
import { bookConsultation, bookConsultationDirect, startOverAsNewPatient } from "../actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Locale, Provider } from "@/lib/types";

type Gender = "female" | "male" | "other";

export function BookingForm({
  provider,
  locale,
  hasSession,
  existingPatientName,
  lookupError,
}: {
  provider: Provider;
  locale: Locale;
  hasSession: boolean;
  existingPatientName?: string | null;
  lookupError?: string;
}) {
  const router = useRouter();
  const qualificationResult = useAppStore((state) => state.qualificationResult);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | "">("");

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();

    if (!fullName || !phone || !gender || !dateOfBirth) {
      setError(t("doctor_direct_booking_missing_fields", locale));
      return;
    }

    startTransition(async () => {
      const result = await bookConsultationDirect({
        providerId: provider.id,
        locale,
        fullName,
        phone,
        dateOfBirth,
        gender,
      });
      if (result.ok) {
        router.push(`/consultation/${result.appointmentId}/pay`);
      } else {
        setError(result.message || t("doctor_booking_error", locale));
      }
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

  return (
    <>
      <ReturningPatientLookup
        locale={locale}
        redirectTo={`/doctors/${provider.id}`}
        error={lookupError}
      />
      <form
        onSubmit={handleSubmit}
        className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7"
      >
        <div className="grid gap-4">
          <p className="text-sm font-bold text-[#071923]">{t("doctor_direct_booking_title", locale)}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <BookingField label={t("doctor_direct_booking_name_label", locale)} span2>
              <Input name="fullName" required autoComplete="name" className="rounded-xl bg-[#f8fbfd]" />
            </BookingField>
            <BookingField label={t("doctor_direct_booking_phone_label", locale)}>
              <Input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("doctor_direct_booking_phone_placeholder", locale)}
                required
                className="rounded-xl bg-[#f8fbfd]"
              />
            </BookingField>
            <BookingField label={t("doctor_direct_booking_gender_label", locale)}>
              <Select
                name="gender"
                value={gender}
                onValueChange={(value) => setGender((value as Gender | null) ?? "")}
              >
                <SelectTrigger className="w-full rounded-xl bg-[#f8fbfd]">
                  <SelectValue placeholder={t("doctor_direct_booking_gender_placeholder", locale)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">{t("doctor_direct_booking_gender_female", locale)}</SelectItem>
                  <SelectItem value="male">{t("doctor_direct_booking_gender_male", locale)}</SelectItem>
                  <SelectItem value="other">{t("doctor_direct_booking_gender_other", locale)}</SelectItem>
                </SelectContent>
              </Select>
            </BookingField>
            <BookingField label={t("doctor_direct_booking_dob_label", locale)} span2>
              <DobSelect locale={locale} />
            </BookingField>
          </div>
        </div>

        {qualificationResult && (
          <p className="mt-5 border-t border-[#eef2f3] pt-4 text-xs text-[#60717a]">
            {t("doctor_booking_summary_note", locale)}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-[#fff4f0] px-4 py-3 text-sm text-[#9b2c12]">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="mt-5 h-12 w-full rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
        >
          {pending ? t("doctor_booking_confirm_pending", locale) : t("doctor_booking_confirm_cta", locale)}
          <ArrowRight className="size-4" />
        </Button>

        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#60717a]">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#01b7bb]" />
          {t("doctor_booking_trust_note", locale)}
        </p>
      </form>
    </>
  );
}

function BookingField({
  label,
  span2,
  children,
}: {
  label: string;
  span2?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`grid gap-1.5 text-sm font-semibold text-[#071923] ${span2 ? "sm:col-span-2" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
