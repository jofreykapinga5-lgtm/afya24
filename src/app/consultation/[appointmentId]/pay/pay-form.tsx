"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Phone, Smartphone, TriangleAlert, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cancelSnippePayment,
  checkSnippePaymentStatus,
  initiateSnippePayment,
  type ConsultationPaymentStatus,
} from "../../actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import type { SnippeChannelProvider } from "@/lib/payments/snippe";

const PROVIDERS: { value: SnippeChannelProvider; labelKey: `payment_provider_${SnippeChannelProvider}` }[] = [
  { value: "mpesa", labelKey: "payment_provider_mpesa" },
  { value: "airtel", labelKey: "payment_provider_airtel" },
  { value: "halotel", labelKey: "payment_provider_halotel" },
  { value: "mixx", labelKey: "payment_provider_mixx" },
];

const POLL_INTERVAL_MS = 3000;
const SLOW_NOTICE_AFTER_MS = 3 * 60 * 1000;

type Stage = "form" | "waiting" | "failed";

export function PayForm({
  appointmentId,
  mode,
  locale,
  price,
  currency,
  providerName,
  specialty,
  defaultPhone,
}: {
  appointmentId: string;
  mode: "voice" | "video";
  locale: Locale;
  price: number;
  currency: string;
  providerName: string;
  specialty: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const [channelProvider, setChannelProvider] = useState<SnippeChannelProvider>("mpesa");
  const [phone, setPhone] = useState(defaultPhone);
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);
  const [showSlowNotice, setShowSlowNotice] = useState(false);
  const [pending, startTransition] = useTransition();
  const waitingSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (stage !== "waiting") return;

    waitingSinceRef.current = Date.now();
    let cancelled = false;

    const interval = setInterval(async () => {
      let status: ConsultationPaymentStatus;
      try {
        status = await checkSnippePaymentStatus(appointmentId);
      } catch {
        return; // transient error -- next tick will retry
      }
      if (cancelled) return;

      if (status === "paid") {
        router.push(`/consultation/${appointmentId}?mode=${mode}`);
        return;
      }
      if (status === "failed") {
        setStage("failed");
        return;
      }
      if (waitingSinceRef.current && Date.now() - waitingSinceRef.current > SLOW_NOTICE_AFTER_MS) {
        setShowSlowNotice(true);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stage, appointmentId, mode, router]);

  function handlePay() {
    setError(null);
    if (!phone.trim()) {
      setError(t("payment_phone_label", locale));
      return;
    }

    startTransition(async () => {
      try {
        const result = await initiateSnippePayment({ appointmentId, channelProvider, phone });
        if (result.alreadyPaid) {
          router.push(`/consultation/${appointmentId}?mode=${mode}`);
          return;
        }
        setShowSlowNotice(false);
        setStage("waiting");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("payment_failed_body", locale));
      }
    });
  }

  function handleRetry() {
    setError(null);
    setStage("form");
  }

  function handleCancel() {
    startTransition(async () => {
      try {
        await cancelSnippePayment(appointmentId);
      } catch {
        // Best-effort -- even if this fails, letting the patient back to
        // the form is still better than leaving them stuck on the spinner.
      }
      setStage("form");
    });
  }

  const ModeIcon = mode === "voice" ? Phone : Video;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-sm font-semibold">{t("payment_page_title", locale)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("payment_page_body", locale)}</p>

      <div className="mt-4 rounded-xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb]">
        <p className="text-xs text-muted-foreground">
          {t("payment_summary_label", locale)} {providerName}
          {specialty ? ` · ${specialty}` : ""}
        </p>
        <div className="mt-1.5 flex items-end justify-between gap-3">
          <p className="text-lg font-bold text-primary tabular-nums">
            {currency} {price.toLocaleString()}
          </p>
          <span className="mb-0.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <ModeIcon className="size-3.5 shrink-0" />
            {t(mode === "voice" ? "doctor_booking_mode_voice" : "doctor_booking_mode_video", locale)}
          </span>
        </div>
      </div>

      <div aria-live="polite" key={stage} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
        {stage === "form" ? (
          <>
            <p className="mt-4 text-sm font-semibold">{t("payment_provider_label", locale)}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PROVIDERS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={channelProvider === option.value ? "default" : "outline"}
                  className="h-auto justify-start gap-2 rounded-xl px-3 py-2.5 text-left"
                  onClick={() => setChannelProvider(option.value)}
                >
                  <Smartphone className="size-4 shrink-0" />
                  <span className="text-sm font-semibold">{t(option.labelKey, locale)}</span>
                </Button>
              ))}
            </div>

            <label className="mt-4 block text-sm font-semibold" htmlFor="payment-phone">
              {t("payment_phone_label", locale)}
            </label>
            <div className="relative mt-1.5">
              <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="payment-phone"
                className="h-11 rounded-xl pl-10"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={t("payment_phone_placeholder", locale)}
                inputMode="tel"
              />
            </div>

            {error && <p className="mt-3 text-sm text-urgent">{error}</p>}

            <Button size="lg" className="mt-4 w-full" disabled={pending} onClick={handlePay}>
              {pending ? t("payment_pay_pending", locale) : t("payment_pay_button", locale)}
            </Button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5 shrink-0 text-brand-teal" />
              {t("payment_secure_note", locale)}
            </p>
          </>
        ) : stage === "waiting" ? (
          <div className="mt-5 flex flex-col items-center gap-3 text-center">
            <div className="relative flex size-14 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-ping" />
              <span className="relative flex size-14 items-center justify-center rounded-full bg-primary-soft">
                <Smartphone className="size-6 text-primary" />
              </span>
            </div>
            <div>
              <p className="font-semibold">{t("payment_waiting_title", locale)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("payment_waiting_body", locale)}</p>
            </div>
            {showSlowNotice && (
              <p className="mt-1 rounded-lg bg-pending-soft px-3 py-2 text-xs text-pending">
                {t("payment_taking_longer", locale)}
              </p>
            )}
            <Button variant="ghost" className="mt-1 w-full text-muted-foreground" disabled={pending} onClick={handleCancel}>
              {t("payment_cancel_button", locale)}
            </Button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center gap-3 text-center">
            <TriangleAlert className="size-8 text-urgent" />
            <div>
              <p className="font-semibold">{t("payment_failed_title", locale)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("payment_failed_body", locale)}</p>
            </div>
            <Button className="mt-1 w-full" onClick={handleRetry}>
              {t("payment_retry_button", locale)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
