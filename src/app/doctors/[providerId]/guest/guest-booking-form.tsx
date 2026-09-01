"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bookAsGuest } from "../../actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function GuestBookingForm({ providerId, locale }: { providerId: string; locale: Locale }) {
  const router = useRouter();
  const qualificationResult = useAppStore((state) => state.qualificationResult);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!fullName || !phone) {
      setError(t("error_fill_all_fields", locale));
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await bookAsGuest({
        fullName,
        phone,
        providerId,
        locale,
        qualification: qualificationResult,
      });
      if (result.ok) {
        router.push(`/consultation/${result.appointmentId}/pay`);
      } else {
        setError(result.message || t("doctor_booking_error", locale));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <label className="grid gap-1.5 text-sm font-semibold">
        <span>{t("guest_booking_full_name_label", locale)}</span>
        <Input name="fullName" required autoComplete="name" />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        <span>{t("guest_booking_phone_label", locale)}</span>
        <Input name="phone" type="tel" required autoComplete="tel" placeholder="+255712345678" />
      </label>

      {error ? (
        <p role="alert" className="rounded-xl bg-[#fff4f0] px-4 py-3 text-sm text-[#9b2c12]">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
      >
        {pending ? t("common_please_wait", locale) : t("guest_booking_submit", locale)}
        <ArrowRight className="size-4" />
      </Button>

      <p className="flex items-start gap-2 text-xs leading-5 text-[#60717a]">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#01b7bb]" />
        {t("doctor_booking_trust_note", locale)}
      </p>
    </form>
  );
}
