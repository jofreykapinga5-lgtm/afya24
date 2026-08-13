"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookConsultation } from "../actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { ConsultationMode, Locale, Provider } from "@/lib/types";

const callModeCopy: Record<"voice" | "video", { titleKey: "doctor_booking_mode_voice" | "doctor_booking_mode_video"; detail: string }> = {
  voice: {
    titleKey: "doctor_booking_mode_voice",
    detail: "LiveKit audio call, camera stays off.",
  },
  video: {
    titleKey: "doctor_booking_mode_video",
    detail: "LiveKit video call with audio.",
  },
};

export function BookingForm({ provider, locale }: { provider: Provider; locale: Locale }) {
  const router = useRouter();
  const qualificationResult = useAppStore((state) => state.qualificationResult);
  const availableCallModes = provider.consultationModes.filter(
    (providerMode): providerMode is "voice" | "video" => providerMode === "voice" || providerMode === "video"
  );
  const [mode, setMode] = useState<ConsultationMode>(
    availableCallModes.includes("video")
      ? "video"
      : (availableCallModes[0] ?? "video")
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    if (availableCallModes.length === 0) {
      setError("This doctor is not accepting voice or video calls right now.");
      return;
    }
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

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {availableCallModes.length > 0 ? availableCallModes.map((callMode) => {
          const Icon = callMode === "voice" ? Phone : Video;
          const copy = callModeCopy[callMode];

          return (
            <Button
              key={callMode}
              type="button"
              variant={mode === callMode ? "default" : "outline"}
              className="h-auto justify-start gap-3 rounded-xl px-4 py-3 text-left"
              onClick={() => setMode(callMode)}
            >
              <Icon className="size-4 shrink-0" />
              <span>
                <span className="block font-semibold">{t(copy.titleKey, locale)}</span>
                <span className="block text-xs opacity-75">{copy.detail}</span>
              </span>
            </Button>
          );
        }) : (
          <p className="rounded-xl bg-[#f8fbfd] px-4 py-3 text-sm text-muted-foreground ring-1 ring-[#dfe8eb]">
            This doctor is not accepting voice or video calls right now.
          </p>
        )}
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
