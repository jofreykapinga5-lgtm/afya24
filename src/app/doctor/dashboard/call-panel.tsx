"use client";

import { useEffect, useRef, useState } from "react";
import { Check, PhoneOff, ShieldCheck, TriangleAlert } from "lucide-react";
import { CallRoom } from "@/components/video/call-room";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveDoctorNotes } from "../actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type JoinInfo = { serverUrl: string; token: string };

const NOTES_SAVE_DEBOUNCE_MS = 1200;
const VIDEO_HEIGHT_CLASS = "h-64";

// Lives at the dashboard's #notes anchor -- idle by default (the same
// placeholder card this section always showed), and swaps to a live call +
// notes view once a doctor joins from DoctorVideoQueue. Deliberately
// embedded here rather than the full-screen /consultation page: a doctor
// needs the rest of the dashboard (and somewhere to actually write) usable
// at the same time as the call, unlike a patient's single-purpose visit.
export function DoctorCallPanel() {
  const locale = useAppStore((state) => state.locale);
  const activeCall = useAppStore((state) => state.activeDoctorCall);
  const setActiveDoctorCall = useAppStore((state) => state.setActiveDoctorCall);

  if (!activeCall) {
    return (
      <section
        id="notes"
        className="rounded-[1.35rem] bg-[#e8f7f4] p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.45)] ring-1 ring-[#ccece7]"
      >
        <p className="text-sm font-bold text-[#083273]">{t("doctor_dashboard_workspace_title", locale)}</p>
        <p className="mt-3 text-sm leading-6 text-[#4d5960]">
          {t("doctor_dashboard_workspace_body", locale)}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#087a7b]">
          <ShieldCheck className="size-4" />
          {t("doctor_dashboard_approval_required", locale)}
        </div>
      </section>
    );
  }

  return (
    <ActiveCallPanel
      // Remounts (fresh join request, fresh local state) if the doctor
      // switches straight from one active call to another.
      key={activeCall.appointmentId}
      appointmentId={activeCall.appointmentId}
      patientName={activeCall.patientName}
      initialNotes={activeCall.doctorNotes}
      locale={locale}
      onClose={() => setActiveDoctorCall(null)}
    />
  );
}

function ActiveCallPanel({
  appointmentId,
  patientName,
  initialNotes,
  locale,
  onClose,
}: {
  appointmentId: string;
  patientName: string;
  initialNotes: string;
  locale: Locale;
  onClose: () => void;
}) {
  const [join, setJoin] = useState<JoinInfo | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [notes, setNotes] = useState(initialNotes);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const notesRef = useRef(initialNotes);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function requestJoinInfo(): Promise<JoinInfo> {
    const response = await fetch("/api/video/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, locale }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? t("consultation_couldnt_start", locale));
    }
    return data as JoinInfo;
  }

  useEffect(() => {
    let cancelled = false;
    requestJoinInfo()
      .then((data) => {
        if (!cancelled) setJoin(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setJoinError(err.message);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  function flushNotes(value: string) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    startSave(value);
  }

  function startSave(value: string) {
    setSaveState("saving");
    saveDoctorNotes(appointmentId, value).then((result) => {
      setSaveState(result.ok ? "saved" : "idle");
    });
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    notesRef.current = value;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => startSave(value), NOTES_SAVE_DEBOUNCE_MS);
  }

  function handleClose() {
    // A pending debounced save shouldn't get dropped just because the
    // doctor closes the panel a beat after their last keystroke.
    flushNotes(notesRef.current);
    onClose();
  }

  return (
    <section className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className={`flex ${VIDEO_HEIGHT_CLASS} flex-col overflow-hidden bg-slate-950`}>
        {joinError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <TriangleAlert className="size-6 text-[#ff8a75]" />
            <p className="text-sm font-semibold text-white">{t("consultation_couldnt_join", locale)}</p>
            <p className="text-xs text-white/60">{joinError}</p>
          </div>
        ) : !join ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="relative flex size-8 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-[#01b7bb]/20 motion-safe:animate-ping" />
                <span className="relative size-2.5 rounded-full bg-[#01b7bb]" />
              </span>
              {t("consultation_connecting", locale)}
            </div>
          </div>
        ) : (
          <CallRoom serverUrl={join.serverUrl} token={join.token} onReconnect={requestJoinInfo} />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-[#eef2f3] px-5 py-3">
        <p className="min-w-0 truncate text-sm font-bold text-[#071923]">
          {t("doctor_call_panel_with", locale)} {patientName}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleClose}
          className="h-8 shrink-0 gap-1.5 rounded-full border-[#dfe8eb] bg-white text-[#60717a] hover:border-urgent/30 hover:bg-[#fff4f0] hover:text-[#9b2c12]"
        >
          <PhoneOff className="size-3.5" />
          {t("doctor_call_panel_close", locale)}
        </Button>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="doctor-call-notes" className="text-sm font-bold text-[#071923]">
            {t("doctor_call_panel_notes_label", locale)}
          </label>
          <span className="flex items-center gap-1 text-xs text-[#8a969c]">
            {saveState === "saving" && t("doctor_call_panel_saving", locale)}
            {saveState === "saved" && (
              <>
                <Check className="size-3.5 text-[#01b7bb]" />
                {t("doctor_call_panel_saved", locale)}
              </>
            )}
          </span>
        </div>
        <Textarea
          id="doctor-call-notes"
          value={notes}
          onChange={(event) => handleNotesChange(event.target.value)}
          placeholder={t("doctor_call_panel_notes_placeholder", locale)}
          className="mt-2 min-h-32 rounded-2xl bg-[#f8fbfd]"
        />
      </div>
    </section>
  );
}
