"use client";

import { CheckCircle2, Phone, UserRound, Video } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export interface CompletedItem {
  id: string;
  patientName: string;
  patientReference: string;
  consultationMode: "voice" | "video";
  completedAt: string;
}

export function DoctorCompletedList({ items }: { items: CompletedItem[] }) {
  const locale = useAppStore((state) => state.locale);

  return (
    <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#071923]">{t("doctor_completed_title", locale)}</p>
          <p className="mt-1 text-sm text-[#64747c]">{t("doctor_completed_body", locale)}</p>
        </div>
        <CheckCircle2 className="size-5 text-[#01b7bb]" />
      </div>

      <div className="mt-4 grid gap-3">
        {items.length > 0 ? (
          items.map((appointment) => (
            <div key={appointment.id} className="rounded-2xl bg-[#f8fbfd] p-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f7f4] text-sm font-bold text-[#087a7b]">
                  <UserRound className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#071923]">{appointment.patientName}</p>
                  <p className="mt-0.5 text-xs text-[#64747c]">{appointment.patientReference}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#e8f7f4] px-2.5 py-1 text-[11px] font-bold text-[#087a7b]">
                  {appointment.consultationMode === "voice" ? (
                    <Phone className="size-3" />
                  ) : (
                    <Video className="size-3" />
                  )}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#64747c]">
                {t("doctor_completed_at_label", locale)}{" "}
                {/* Pinned timeZone -- without it this renders differently
                    between the server (UTC on Vercel) and a Tanzanian
                    browser's local time, a hydration mismatch this app has
                    already been bitten by elsewhere. */}
                {new Date(appointment.completedAt).toLocaleString(locale === "sw" ? "sw-TZ" : "en-TZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Africa/Dar_es_Salaam",
                })}
              </p>
            </div>
          ))
        ) : (
          <p className="px-1 py-6 text-center text-sm text-[#64747c]">{t("doctor_completed_empty", locale)}</p>
        )}
      </div>
    </section>
  );
}
