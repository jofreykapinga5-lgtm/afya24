"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Phone, PhoneCall, MessageCircle, Video } from "lucide-react";
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
    <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7">
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#e8f7f4] px-3 py-1 text-xs font-bold text-[#087a7b]">
        <CircleCheck className="size-3.5" />
        {t("connect_payment_confirmed_badge", locale)}
      </span>
      <p className="text-sm font-bold text-[#071923]">{t("connect_title", locale)}</p>
      <p className="mt-1 text-sm text-[#60717a]">
        {t("connect_body", locale)}
        {providerName ? ` ${providerName}.` : ""}
      </p>

      {hasAnyOption ? (
        <div className="mt-4 grid gap-2.5">
          {canVoice && (
            <ConnectOption
              icon={<Phone className="size-4.5" />}
              title={t("doctor_booking_mode_voice", locale)}
              detail={t("connect_option_voice_detail", locale)}
              disabled={pending}
              onClick={() => joinInApp("voice")}
            />
          )}
          {canVideo && (
            <ConnectOption
              icon={<Video className="size-4.5" />}
              title={t("doctor_booking_mode_video", locale)}
              detail={t("connect_option_video_detail", locale)}
              disabled={pending}
              onClick={() => joinInApp("video")}
            />
          )}
          {telHref && (
            <ConnectOption
              icon={<PhoneCall className="size-4.5" />}
              title={t("connect_option_call_title", locale)}
              detail={t("connect_option_call_detail", locale)}
              href={telHref}
            />
          )}
          {whatsappHref && (
            <ConnectOption
              icon={<MessageCircle className="size-4.5" />}
              iconClassName="bg-[#e6f9ee] text-[#25D366]"
              title={t("connect_option_whatsapp_title", locale)}
              detail={t("connect_option_whatsapp_detail", locale)}
              href={whatsappHref}
              external
            />
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-pending-soft px-4 py-3 text-sm text-pending">
          <p className="font-semibold">{t("connect_no_options_title", locale)}</p>
          <p className="mt-0.5 opacity-90">{t("connect_no_options_body", locale)}</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-[#fff4f0] px-4 py-3 text-sm text-[#9b2c12]">
          {error}
        </p>
      )}
    </div>
  );
}

function ConnectOption({
  icon,
  iconClassName,
  title,
  detail,
  disabled,
  onClick,
  href,
  external,
}: {
  icon: React.ReactNode;
  iconClassName?: string;
  title: string;
  detail: string;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName ?? "bg-[#e8f7f4] text-[#01b7bb]"}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-[#071923]">{title}</span>
        <span className="block text-xs text-[#60717a]">{detail}</span>
      </span>
    </>
  );

  const className =
    "flex w-full items-center gap-3.5 rounded-2xl bg-[#f8fbfd] p-3.5 text-left outline-none ring-1 ring-[#dfe8eb] transition-all duration-200 hover:-translate-y-0.5 hover:ring-[#01b7bb]/50 active:translate-y-0 active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/40 disabled:pointer-events-none disabled:opacity-50";

  if (href) {
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}
