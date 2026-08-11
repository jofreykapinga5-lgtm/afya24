"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookConsultation } from "../actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { ConsultationMode, Locale, Provider } from "@/lib/types";

export function BookingForm({ provider, locale }: { provider: Provider; locale: Locale }) {
  const router = useRouter();
  const qualificationResult = useAppStore((state) => state.qualificationResult);
  const [mode, setMode] = useState<ConsultationMode>(
    provider.consultationModes.includes("video")
      ? "video"
      : (provider.consultationModes[0] ?? "video")
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        const appointmentId = await bookConsultation({
          providerId: provider.id,
          consultationMode: mode,
          locale,
          qualification: qualificationResult,
        });
        router.push(`/consultation/${appointmentId}?mode=${mode}`);
      } catch {
        setError(t("doctor_booking_error", locale));
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-sm font-semibold">{t("doctor_booking_choose_mode", locale)}</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant={mode === "voice" ? "default" : "outline"}
          className="h-12 gap-2"
          onClick={() => setMode("voice")}
        >
          <Phone className="size-4" />
          {t("doctor_booking_mode_voice", locale)}
        </Button>
        <Button
          type="button"
          variant={mode === "video" ? "default" : "outline"}
          className="h-12 gap-2"
          onClick={() => setMode("video")}
        >
          <Video className="size-4" />
          {t("doctor_booking_mode_video", locale)}
        </Button>
      </div>

      {qualificationResult && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("doctor_booking_summary_note", locale)}
        </p>
      )}

      {error && <p className="mt-3 text-sm text-urgent">{error}</p>}

      <Button size="lg" className="mt-4 w-full" disabled={pending} onClick={handleConfirm}>
        {t("doctor_booking_confirm_cta", locale)}
      </Button>
    </div>
  );
}
