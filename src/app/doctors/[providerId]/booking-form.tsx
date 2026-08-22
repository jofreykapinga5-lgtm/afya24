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
      try {
        const appointmentId = await bookConsultation({
          providerId: provider.id,
          locale,
          qualification: qualificationResult,
        });
        router.push(`/consultation/${appointmentId}/pay`);
      } catch (err) {
        // Show the real reason instead of a generic "try again" -- the fix
        // is usually specific (session expired, no doctors available, a
        // database error) and "try again" alone won't help when the same
        // click will just fail the same way again.
        setError(err instanceof Error ? err.message : t("doctor_booking_error", locale));
      }
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (hasSession) {
      bookWithSession();
      return;
    }

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();

    if (!fullName || !phone || !gender || !dateOfBirth) {
      setError(t("doctor_direct_booking_missing_fields", locale));
      return;
    }

    startTransition(async () => {
      try {
        const appointmentId = await bookConsultationDirect({
          providerId: provider.id,
          locale,
          fullName,
          phone,
          dateOfBirth,
          gender,
        });
        router.push(`/consultation/${appointmentId}/pay`);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("doctor_booking_error", locale));
      }
    });
  }

  return (
    <>
      {!hasSession && (
        <ReturningPatientLookup
          locale={locale}
          redirectTo={`/doctors/${provider.id}`}
          error={lookupError}
        />
      )}
      <form
        onSubmit={handleSubmit}
        className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7"
      >
        {hasSession && existingPatientName && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-[#f4f8f9] px-4 py-3 text-sm font-semibold text-[#071923]">
            <span className="flex min-w-0 items-center gap-2.5">
              <UserRound className="size-4 shrink-0 text-[#01b7bb]" />
              <span className="truncate">
                {t("doctor_booking_continuing_as", locale)} {existingPatientName}
              </span>
            </span>
            <form action={startOverAsNewPatient.bind(null, provider.id)}>
              <button
                type="submit"
                className="shrink-0 rounded-full text-xs font-semibold text-[#60717a] underline decoration-dotted underline-offset-2 outline-none hover:text-[#083273] focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {t("doctor_booking_not_you", locale)}
              </button>
            </form>
          </div>
        )}

        {!hasSession && (
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
        )}

        {qualificationResult && (
          <p className={!hasSession ? "mt-5 border-t border-[#eef2f3] pt-4 text-xs text-[#60717a]" : "text-xs text-[#60717a]"}>
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
