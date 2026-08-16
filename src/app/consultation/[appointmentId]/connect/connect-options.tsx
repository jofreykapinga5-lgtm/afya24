"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneCall, MessageCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { selectConnectionMode } from "../../actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function ConnectOptions({
  appointmentId,
  locale,
  providerName,
  canVoice,
  canVideo,
  providerPhone,
}: {
  appointmentId: string;
  locale: Locale;
  providerName: string;
  canVoice: boolean;
  canVideo: boolean;
  providerPhone: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function joinInApp(mode: "voice" | "video") {
    setError(null);
    startTransition(async () => {
      try {
        await selectConnectionMode(appointmentId, mode);
        router.push(`/consultation/${appointmentId}?mode=${mode}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("doctor_booking_error", locale));
      }
    });
  }

  const telHref = providerPhone ? `tel:${providerPhone}` : null;
  const whatsappHref = providerPhone ? `https://wa.me/${providerPhone.replace(/^\+/, "")}` : null;
  const hasAnyOption = canVoice || canVideo || Boolean(providerPhone);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-sm font-semibold">{t("connect_title", locale)}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("connect_body", locale)}
        {providerName ? ` ${providerName}.` : ""}
      </p>

      {hasAnyOption ? (
        <div className="mt-4 grid gap-2">
          {canVoice && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="h-auto justify-start gap-3 rounded-xl px-4 py-3 text-left"
              onClick={() => joinInApp("voice")}
            >
              <Phone className="size-4 shrink-0" />
              <span>
                <span className="block font-semibold">{t("doctor_booking_mode_voice", locale)}</span>
                <span className="block text-xs opacity-75">{t("connect_option_voice_detail", locale)}</span>
              </span>
            </Button>
          )}
          {canVideo && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="h-auto justify-start gap-3 rounded-xl px-4 py-3 text-left"
              onClick={() => joinInApp("video")}
            >
              <Video className="size-4 shrink-0" />
              <span>
                <span className="block font-semibold">{t("doctor_booking_mode_video", locale)}</span>
                <span className="block text-xs opacity-75">{t("connect_option_video_detail", locale)}</span>
              </span>
            </Button>
          )}
          {telHref && (
            <Button
              type="button"
              variant="outline"
              nativeButton={false}
              className="h-auto justify-start gap-3 rounded-xl px-4 py-3 text-left"
              render={<a href={telHref} />}
            >
              <PhoneCall className="size-4 shrink-0" />
              <span>
                <span className="block font-semibold">{t("connect_option_call_title", locale)}</span>
                <span className="block text-xs opacity-75">{t("connect_option_call_detail", locale)}</span>
              </span>
            </Button>
          )}
          {whatsappHref && (
            <Button
              type="button"
              variant="outline"
              nativeButton={false}
              className="h-auto justify-start gap-3 rounded-xl px-4 py-3 text-left"
              render={<a href={whatsappHref} target="_blank" rel="noreferrer" />}
            >
              <MessageCircle className="size-4 shrink-0 text-[#25D366]" />
              <span>
                <span className="block font-semibold">{t("connect_option_whatsapp_title", locale)}</span>
                <span className="block text-xs opacity-75">{t("connect_option_whatsapp_detail", locale)}</span>
              </span>
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-pending-soft px-4 py-3 text-sm text-pending">
          <p className="font-semibold">{t("connect_no_options_title", locale)}</p>
          <p className="mt-0.5 opacity-90">{t("connect_no_options_body", locale)}</p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-urgent">{error}</p>}
    </div>
  );
}
