"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, PhoneOff, Save, ShieldCheck, TriangleAlert } from "lucide-react";
import { CallRoom } from "@/components/video/call-room";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { endDoctorCall, saveDoctorNotes } from "../actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type JoinInfo = { serverUrl: string; token: string };

const NOTES_SAVE_DEBOUNCE_MS = 1200;
// Height used to be pure aspect-video (16:9 of the panel's width), which
// looked right on a fully maximized wide monitor but shrank to a sliver on
// the dashboard's fixed 380px-sidebar grid whenever the browser window
// itself wasn't very wide -- the video, the doctor's primary focus while a
// call is active, ended up smaller than the patient-history list beside it.
// Driving height off the viewport instead (capped both ends) keeps the call
// consistently prominent regardless of window width; VideoTile's
// object-cover already crops any resulting shape cleanly, so this doesn't
// reintroduce the old wide-panel distortion the aspect-video switch fixed.
// The dashboard shell drops its sidebar/header while a call is active (see
// dashboard-shell.tsx's inCallFocusMode), freeing real space this claims.
const VIDEO_WRAPPER_CLASS = "mx-auto w-full max-w-5xl h-[min(72vh,42rem)] min-h-[260px]";

// Lives on the dashboard's dedicated /doctor/dashboard/patients page --
// idle by default (the same placeholder card this section always showed),
// and swaps to a live call + notes view once a doctor joins from
// DoctorVideoQueue. Deliberately embedded here rather than the full-screen
// /consultation page: a doctor needs the rest of the dashboard (and
// somewhere to actually write) usable at the same time as the call, unlike
// a patient's single-purpose visit.
export function DoctorCallPanel() {
  const locale = useAppStore((state) => state.locale);
  const activeCall = useAppStore((state) => state.activeDoctorCall);
  const setActiveDoctorCall = useAppStore((state) => state.setActiveDoctorCall);

  if (!activeCall) {
    return (
      <section id="doctor-call-panel" className="rounded-[1.35rem] bg-[#e8f7f4] p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.45)] ring-1 ring-[#ccece7]">
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
      patientId={activeCall.patientId}
      patientName={activeCall.patientName}
      initialNotes={activeCall.doctorNotes}
      locale={locale}
      onClose={() => setActiveDoctorCall(null)}
    />
  );
}

type PatientVisit = {
  id: string;
  scheduledAt: string;
  providerName: string;
  doctorNotes: string;
  summaryText: string;
  urgencyLevel: string;
};

// The reference-number-as-patient-file feature: any doctor picking up a
// returning patient sees every past completed visit's notes here, so care
// continues where the last doctor left off instead of starting from zero.
function PatientHistory({
  patientId,
  excludeAppointmentId,
  locale,
}: {
  patientId: string;
  excludeAppointmentId: string;
  locale: Locale;
}) {
  const [visits, setVisits] = useState<PatientVisit[] | null>(null);
  // Collapsed by default -- during a live call the video and notes are what
  // matter, not a running history dump underneath them. Still one click
  // away rather than gone, since checking a returning patient's last visit
  // mid-consult is a real clinical need, just not the default view.
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/doctor/patient-history?patientId=${encodeURIComponent(patientId)}&excludeAppointmentId=${encodeURIComponent(excludeAppointmentId)}`,
      { cache: "no-store" }
    )
      .then((response) => response.json())
      .then((data: { visits?: PatientVisit[] }) => {
        if (!cancelled) setVisits(data.visits ?? []);
      })
      .catch(() => {
        if (!cancelled) setVisits([]);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, excludeAppointmentId]);

  return (
    <div className="border-b border-[#eef2f3] p-5">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between text-left"
      >
        <p className="text-sm font-bold text-[#071923]">{t("doctor_call_panel_history_title", locale)}</p>
        {expanded ? (
          <ChevronDown className="size-4 shrink-0 text-[#8a969c]" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-[#8a969c]" />
        )}
      </button>

      {!expanded ? null : visits === null ? (
        <p className="mt-2 text-xs text-[#8a969c]">{t("doctor_call_panel_history_loading", locale)}</p>
      ) : visits.length === 0 ? (
        <p className="mt-2 text-xs text-[#8a969c]">{t("doctor_call_panel_history_empty", locale)}</p>
      ) : (
        <div className="mt-2 max-h-64 divide-y divide-[#eef2f3] overflow-y-auto rounded-2xl bg-[#f8fbfd] p-1">
          {visits.map((visit) => (
            <div key={visit.id} className="px-3 py-2.5">
              <p className="text-xs font-semibold text-[#60717a]">
                {new Date(visit.scheduledAt).toLocaleDateString(locale === "sw" ? "sw-TZ" : "en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "Africa/Dar_es_Salaam",
                })}{" "}
                {t("doctor_call_panel_history_with", locale)} {visit.providerName}
              </p>
              <p className="mt-1 text-sm text-[#071923]">
                {visit.doctorNotes || t("doctor_call_panel_history_notes_empty", locale)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveCallPanel({
  appointmentId,
  patientId,
  patientName,
  initialNotes,
  locale,
  onClose,
}: {
  appointmentId: string;
  patientId: string;
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
    saveDoctorNotes(appointmentId, value)
      .then((result) => {
        setSaveState(result.ok ? "saved" : "idle");
      })
      .catch(() => {
        // The action itself already returns {ok:false} for a normal
        // failure (handled above) -- this only catches the rarer case of
        // the request dispatch itself failing (a real network drop
        // mid-save, plausible on the variable mobile connections this app
        // targets). Without it, that case was an unhandled rejection and
        // left saveState stuck on "saving" forever with no indication
        // anything went wrong.
        setSaveState("idle");
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
    // Fire-and-forget: marks the appointment completed so the patient-side
    // queue countdown sees this doctor as free for the next waiting patient.
    // The panel closes immediately either way -- there's nothing useful to
    // do locally if this fails, and it's a fully server-scoped update.
    void endDoctorCall(appointmentId);
    onClose();
  }

  return (
    <section id="doctor-call-panel" className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className={`flex ${VIDEO_WRAPPER_CLASS} flex-col overflow-hidden bg-slate-950`}>
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
          <CallRoom
            serverUrl={join.serverUrl}
            token={join.token}
            onReconnect={requestJoinInfo}
            onHangup={handleClose}
          />
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

      <PatientHistory patientId={patientId} excludeAppointmentId={appointmentId} locale={locale} />

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
        <Button
          type="button"
          size="sm"
          disabled={saveState === "saving"}
          onClick={() => flushNotes(notesRef.current)}
          className="mt-3 gap-1.5 rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2]"
        >
          <Save className="size-3.5" />
          {t("doctor_call_panel_save_button", locale)}
        </Button>
      </div>
    </section>
  );
}
