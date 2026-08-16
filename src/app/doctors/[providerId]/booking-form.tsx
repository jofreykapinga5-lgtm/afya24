"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { bookConsultation, bookConsultationDirect } from "../actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Locale, Provider } from "@/lib/types";

type Gender = "female" | "male" | "other";

export function BookingForm({
  provider,
  locale,
  hasSession,
}: {
  provider: Provider;
  locale: Locale;
  hasSession: boolean;
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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
      {!hasSession && (
        <div>
          <p className="text-sm font-semibold">{t("doctor_direct_booking_title", locale)}</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm sm:col-span-2">
              <span className="font-medium">{t("doctor_direct_booking_name_label", locale)}</span>
              <Input name="fullName" required autoComplete="name" />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">{t("doctor_direct_booking_phone_label", locale)}</span>
              <Input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("doctor_direct_booking_phone_placeholder", locale)}
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">{t("doctor_direct_booking_gender_label", locale)}</span>
              <Select
                name="gender"
                value={gender}
                onValueChange={(value) => setGender((value as Gender | null) ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("doctor_direct_booking_gender_placeholder", locale)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">{t("doctor_direct_booking_gender_female", locale)}</SelectItem>
                  <SelectItem value="male">{t("doctor_direct_booking_gender_male", locale)}</SelectItem>
                  <SelectItem value="other">{t("doctor_direct_booking_gender_other", locale)}</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <div className="grid gap-1.5 text-sm sm:col-span-2">
              <span className="font-medium">{t("doctor_direct_booking_dob_label", locale)}</span>
              <DobSelect locale={locale} />
            </div>
          </div>
        </div>
      )}

      {qualificationResult && (
        <p className={!hasSession ? "mt-4 text-xs text-muted-foreground" : "text-xs text-muted-foreground"}>
          {t("doctor_booking_summary_note", locale)}
        </p>
      )}

      {error && <p className="mt-3 text-sm text-urgent">{error}</p>}

      <Button type="submit" size="lg" className="mt-4 w-full" disabled={pending}>
        {t("doctor_booking_confirm_cta", locale)}
      </Button>
    </form>
  );
}
