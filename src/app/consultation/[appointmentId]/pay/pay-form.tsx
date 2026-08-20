"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Copy, Lock, Phone, Smartphone, TriangleAlert } from "lucide-react";
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

const PROVIDERS: {
  value: SnippeChannelProvider;
  labelKey: `payment_provider_${SnippeChannelProvider}`;
  logo: string;
  logoClassName: string;
}[] = [
  { value: "mpesa", labelKey: "payment_provider_mpesa", logo: "/brands/payments/mpesa.svg", logoClassName: "max-h-6" },
  { value: "airtel", labelKey: "payment_provider_airtel", logo: "/brands/payments/airtel-money.png", logoClassName: "max-h-7" },
  { value: "halotel", labelKey: "payment_provider_halotel", logo: "/brands/payments/halopesa.png", logoClassName: "max-h-6" },
  { value: "mixx", labelKey: "payment_provider_mixx", logo: "/brands/payments/mixx-by-yas.svg", logoClassName: "max-h-6" },
];

const POLL_INTERVAL_MS = 3000;
const SLOW_NOTICE_AFTER_MS = 3 * 60 * 1000;

type Stage = "form" | "waiting" | "success" | "failed";

export function PayForm({
  appointmentId,
  locale,
  price,
  currency,
  providerName,
  specialty,
  defaultPhone,
}: {
  appointmentId: string;
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
  const [copied, setCopied] = useState(false);
  // Only exists once payment succeeds -- see the reference-number-after-
  // payment redesign in lib/patient-account.ts's ensurePatientReferenceNumber.
  // No longer a prop: this page can only ever render pre-payment (the server
  // page redirects to /connect once paid), so there'd never be anything to
  // pass in.
  const [paidReferenceNumber, setPaidReferenceNumber] = useState<string | null>(null);
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

      if (status.status === "paid") {
        setPaidReferenceNumber(status.hospitalReferenceNumber);
        setStage("success");
        return;
      }
      if (status.status === "failed") {
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
  }, [stage, appointmentId, router]);

  function handleCopyReference() {
    if (!paidReferenceNumber) return;
    navigator.clipboard
      .writeText(paidReferenceNumber)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Clipboard access can be denied by the browser -- the number is
        // still shown on screen, so this is a nice-to-have, not required.
      });
  }

  function handlePay() {
    setError(null);
    if (!phone.trim()) {
      setError(t("payment_phone_label", locale));
      return;
    }

    startTransition(async () => {
      const result = await initiateSnippePayment({ appointmentId, channelProvider, phone });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.alreadyPaid) {
        setPaidReferenceNumber(result.hospitalReferenceNumber);
        setStage("success");
        return;
      }
      setShowSlowNotice(false);
      setStage("waiting");
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

  return (
    <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7">
      <p className="text-sm font-bold text-[#071923]">{t("payment_page_title", locale)}</p>
      <p className="mt-1 text-sm text-[#60717a]">{t("payment_page_body", locale)}</p>

      <div className="mt-4 rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb]">
        <p className="text-xs text-[#60717a]">
          {t("payment_summary_label", locale)} {providerName}
          {specialty ? ` · ${specialty}` : ""}
        </p>
        <p className="mt-1.5 text-lg font-bold tabular-nums text-[#083273]">
          {currency} {price.toLocaleString()}
        </p>
      </div>

      <div aria-live="polite" key={stage} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
        {stage === "form" ? (
          <>
            <p className="mt-4 text-sm font-bold text-[#071923]">{t("payment_provider_label", locale)}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PROVIDERS.map((option) => {
                const active = channelProvider === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    onClick={() => setChannelProvider(option.value)}
                    className={
                      active
                        ? "h-auto justify-start gap-2 rounded-xl border-transparent bg-[#01b7bb] px-3 py-2.5 text-left text-white hover:bg-[#019ea2]"
                        : "h-auto justify-start gap-2 rounded-xl bg-[#f8fbfd] px-3 py-2.5 text-left text-[#071923] hover:border-[#01b7bb]/40 hover:bg-[#f1fbfa]"
                    }
                  >
                    <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg bg-white px-1.5 shadow-sm ring-1 ring-black/5">
                      <Image
                        src={option.logo}
                        alt=""
                        width={88}
                        height={40}
                        className={`h-auto w-auto max-w-full object-contain ${option.logoClassName}`}
                      />
                    </span>
                    <span className="min-w-0 text-sm font-semibold">{t(option.labelKey, locale)}</span>
                  </Button>
                );
              })}
            </div>

            <label className="mt-4 block text-sm font-bold text-[#071923]" htmlFor="payment-phone">
              {t("payment_phone_label", locale)}
            </label>
            <div className="relative mt-1.5">
              <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8a969c]" />
              <Input
                id="payment-phone"
                className="h-11 rounded-xl bg-[#f8fbfd] pl-10"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={t("payment_phone_placeholder", locale)}
                inputMode="tel"
              />
            </div>

            {error && (
              <p role="alert" className="mt-3 rounded-xl bg-[#fff4f0] px-4 py-3 text-sm text-[#9b2c12]">
                {error}
              </p>
            )}

            <Button
              size="lg"
              disabled={pending}
              onClick={handlePay}
              className="mt-4 h-12 w-full rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
            >
              {pending ? t("payment_pay_pending", locale) : t("payment_pay_button", locale)}
            </Button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#60717a]">
              <Lock className="size-3.5 shrink-0 text-[#01b7bb]" />
              {t("payment_secure_note", locale)}
            </p>
          </>
        ) : stage === "waiting" ? (
          <div className="mt-5 flex flex-col items-center gap-3 text-center">
            <div className="relative flex size-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#01b7bb]/15 motion-safe:animate-ping" />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-[#e8f7f4]">
                <Smartphone className="size-6 text-[#01b7bb]" />
              </span>
            </div>
            <div>
              <p className="font-bold text-[#071923]">{t("payment_waiting_title", locale)}</p>
              <p className="mt-1 text-sm text-[#60717a]">{t("payment_waiting_body", locale)}</p>
            </div>
            {showSlowNotice && (
              <p className="mt-1 rounded-lg bg-pending-soft px-3 py-2 text-xs text-pending">
                {t("payment_taking_longer", locale)}
              </p>
            )}
            <Button variant="ghost" className="mt-1 w-full text-[#60717a]" disabled={pending} onClick={handleCancel}>
              {t("payment_cancel_button", locale)}
            </Button>
          </div>
        ) : stage === "success" ? (
          <div className="mt-5 flex flex-col items-center gap-3 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-[#e8f7f4]">
              <CheckCircle2 className="size-8 text-[#01b7bb]" />
            </span>
            <div>
              <p className="font-bold text-[#071923]">{t("payment_success_title", locale)}</p>
              <p className="mt-1 text-sm text-[#60717a]">{t("payment_success_body", locale)}</p>
            </div>
            {paidReferenceNumber && (
              <div className="mt-1 w-full rounded-2xl bg-[#f8fbfd] px-4 py-3 ring-1 ring-[#dfe8eb]">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a969c]">
                  {t("payment_reference_label", locale)}
                </p>
                <p className="mt-0.5 break-all font-mono text-lg font-bold tabular-nums text-[#083273]">
                  {paidReferenceNumber}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyReference}
                  className="mt-2.5 h-9 w-full gap-1.5 rounded-full border-[#01b7bb]/30 bg-white text-[#087a7b] hover:bg-[#e8f7f4]"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? t("payment_success_copied", locale) : t("payment_success_copy_button", locale)}
                </Button>
              </div>
            )}
            <Button
              onClick={() => router.push(`/consultation/${appointmentId}/connect`)}
              className="mt-1 h-11 w-full rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
            >
              {t("payment_success_continue", locale)}
            </Button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center gap-3 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-[#fff4f0]">
              <TriangleAlert className="size-7 text-[#9b2c12]" />
            </span>
            <div>
              <p className="font-bold text-[#071923]">{t("payment_failed_title", locale)}</p>
              <p className="mt-1 text-sm text-[#60717a]">{t("payment_failed_body", locale)}</p>
            </div>
            <Button
              onClick={handleRetry}
              className="mt-1 h-11 w-full rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
            >
              {t("payment_retry_button", locale)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
