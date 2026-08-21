"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { CallRoom } from "@/components/video/call-room";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

type JoinInfo = {
  serverUrl: string;
  token: string;
  role: "patient" | "provider";
  patientHasFullAccount: boolean;
};

// Carries the API's error `code` ("PAYMENT_REQUIRED" and "WAITING_TURN" are
// meaningful client-side) so the UI can offer a real next step instead of a
// dead-end error message -- see api/video/room/route.ts.
class JoinRoomError extends Error {
  code?: string;
  position?: number;
  constructor(message: string, code?: string, position?: number) {
    super(message);
    this.code = code;
    this.position = position;
  }
}

const WAITING_TURN_POLL_MS = 4000;
const READY_TURN_SECONDS = 60;

export default function ConsultationPage(props: {
  params: Promise<{ appointmentId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center px-4 py-20">
          <p className="text-sm text-muted-foreground">…</p>
        </main>
      }
    >
      <ConsultationPageInner {...props} />
    </Suspense>
  );
}

function ConsultationPageInner({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const locale = useAppStore((state) => state.locale);
  const searchParams = useSearchParams();
  // Spoofable via URL, harmless -- only sets this participant's own local
  // default camera state, which CallControls already lets them toggle.
  const initialVideoEnabled = searchParams.get("mode") !== "voice";
  const [join, setJoin] = useState<JoinInfo | null>(null);
  const [error, setError] = useState<JoinRoomError | null>(null);
  const [waitPosition, setWaitPosition] = useState<number | null>(null);
  // True once a blocked patient's turn has come up -- distinct from `join`
  // being set, because a patient who was never blocked should still
  // auto-connect exactly as before, while one who waited gets a deliberate
  // "Join now" click instead of suddenly grabbing their camera/mic.
  const [readyToJoin, setReadyToJoin] = useState(false);
  const [manuallyJoining, setManuallyJoining] = useState(false);
  const [readySeconds, setReadySeconds] = useState(READY_TURN_SECONDS);
  const [turnExpired, setTurnExpired] = useState(false);
  const [queueAttemptVersion, setQueueAttemptVersion] = useState(0);
  const readyDeadlineRef = useRef(0);

  // Also used by CallRoom to get a fresh token when reconnecting after the
  // network drops the call -- the room persists (see
  // getOrCreateRoomForAppointment), so this is just re-authenticating, not
  // recreating anything.
  async function requestJoinInfo(): Promise<JoinInfo> {
    const response = await fetch("/api/video/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, locale }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new JoinRoomError(data.error ?? t("consultation_couldnt_start", locale), data.code, data.position);
    }
    return data as JoinInfo;
  }

  async function requestQueueCheck(): Promise<void> {
    const response = await fetch("/api/video/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, locale, queueCheckOnly: true }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new JoinRoomError(data.error ?? t("consultation_couldnt_start", locale), data.code, data.position);
    }
  }

  useEffect(() => {
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | undefined;
    let hasBeenBlocked = false;

    function attempt() {
      const request = hasBeenBlocked ? requestQueueCheck() : requestJoinInfo();
      request
        .then((data) => {
          if (cancelled) return;
          if (hasBeenBlocked) {
            // A queue check deliberately returns no LiveKit token. The
            // patient receives one only after pressing Join now and passing
            // a fresh server-side turn check.
            setWaitPosition(null);
            setTurnExpired(false);
            setReadySeconds(READY_TURN_SECONDS);
            setReadyToJoin(true);
          } else {
            setJoin(data as JoinInfo);
          }
          if (pollId) clearInterval(pollId);
        })
        .catch((err: JoinRoomError) => {
          if (cancelled) return;
          if (err.code === "WAITING_TURN") {
            hasBeenBlocked = true;
            setWaitPosition(err.position ?? null);
            if (!pollId) pollId = setInterval(attempt, WAITING_TURN_POLL_MS);
          } else {
            if (pollId) clearInterval(pollId);
            setError(err);
          }
        });
    }

    attempt();

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, queueAttemptVersion]);

  useEffect(() => {
    if (!readyToJoin) return;

    const deadline = Date.now() + READY_TURN_SECONDS * 1000;
    readyDeadlineRef.current = deadline;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setReadySeconds(remaining);
      if (remaining === 0) {
        setReadyToJoin(false);
        setTurnExpired(true);
      }
    };

    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [readyToJoin]);

  async function handleManualJoin() {
    if (Date.now() >= readyDeadlineRef.current) {
      setReadyToJoin(false);
      setTurnExpired(true);
      return;
    }

    setManuallyJoining(true);
    try {
      const data = await requestJoinInfo();
      setJoin(data);
      setReadyToJoin(false);
    } catch (err) {
      const joinError = err as JoinRoomError;
      setReadyToJoin(false);
      if (joinError.code === "WAITING_TURN") {
        setWaitPosition(joinError.position ?? null);
        setQueueAttemptVersion((value) => value + 1);
      } else {
        setError(joinError);
      }
    } finally {
      setManuallyJoining(false);
    }
  }

  if (error) {
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] w-full flex-1 flex-col items-center justify-center gap-3 bg-[#f7fbfb] px-4 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#fff4f0]">
          <TriangleAlert className="size-7 text-[#9b2c12]" />
        </span>
        <div className="mx-auto max-w-md">
          <p className="font-bold text-[#071923]">{t("consultation_couldnt_join", locale)}</p>
          <p className="mt-1 text-sm text-[#60717a]">{error.message}</p>
        </div>
        {error.code === "PAYMENT_REQUIRED" && (
          <Button
            className="mt-2 h-11 rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
            nativeButton={false}
            render={<Link href={`/consultation/${appointmentId}/pay`} />}
          >
            {t("payment_complete_link", locale)}
          </Button>
        )}
      </main>
    );
  }

  if (waitPosition !== null) {
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] w-full flex-1 flex-col items-center justify-center gap-3 bg-[#f7fbfb] px-4 py-20 text-center">
        <span className="relative flex size-14 items-center justify-center rounded-full bg-[#e8f7f4]">
          <span className="absolute inset-0 rounded-full bg-[#01b7bb]/20 motion-safe:animate-ping" />
          <span className="relative text-lg font-bold text-[#087a7b]">{waitPosition}</span>
        </span>
        <div className="mx-auto max-w-md">
          <p className="font-bold text-[#071923]">{t("consultation_waiting_turn_title", locale)}</p>
          <p className="mt-1 text-sm text-[#60717a]">
            {t("consultation_waiting_turn_position", locale).replace("{n}", String(waitPosition))}
          </p>
        </div>
        <Button
          type="button"
          disabled
          className="mt-2 h-11 rounded-full bg-[#e5eef0] font-bold text-[#8a9aa2]"
        >
          {t("consultation_join_now_cta", locale)}
        </Button>
      </main>
    );
  }

  if (readyToJoin && !manuallyJoining) {
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] w-full flex-1 flex-col items-center justify-center gap-3 bg-[#f7fbfb] px-4 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#e8f7f4] text-[#01b7bb]">
          <ShieldCheck className="size-7" />
        </span>
        <div className="mx-auto max-w-md">
          <p className="font-bold text-[#071923]">{t("consultation_waiting_turn_ready", locale)}</p>
          <p className="mt-1 text-sm text-[#60717a]">
            {t("consultation_waiting_turn_countdown", locale).replace("{seconds}", String(readySeconds))}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleManualJoin}
          className="mt-2 h-11 rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
        >
          {t("consultation_join_now_cta", locale)}
        </Button>
      </main>
    );
  }

  if (turnExpired) {
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] w-full flex-1 flex-col items-center justify-center gap-3 bg-[#f7fbfb] px-4 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#fff6df] text-[#9a6500]">
          <TriangleAlert className="size-7" />
        </span>
        <div className="mx-auto max-w-md">
          <p className="font-bold text-[#071923]">{t("consultation_waiting_turn_expired", locale)}</p>
          <p className="mt-1 text-sm text-[#60717a]">{t("consultation_waiting_turn_expired_body", locale)}</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setTurnExpired(false);
            setQueueAttemptVersion((value) => value + 1);
          }}
          className="mt-2 h-11 rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2]"
        >
          {t("consultation_waiting_turn_rejoin", locale)}
        </Button>
      </main>
    );
  }

  if (!join) {
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] flex-1 items-center justify-center bg-[#f7fbfb] px-4 py-20">
        <div className="flex items-center gap-3 text-sm text-[#60717a]">
          <span className="relative flex size-8 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-[#01b7bb]/20 motion-safe:animate-ping" />
            <span className="relative size-2.5 rounded-full bg-[#01b7bb]" />
          </span>
          {t("consultation_connecting", locale)}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col">
      <CallRoom
        serverUrl={join.serverUrl}
        token={join.token}
        queueAppointmentId={join.role === "patient" ? appointmentId : undefined}
        initialVideoEnabled={initialVideoEnabled}
        showAccountUpgrade={join.role === "patient" && !join.patientHasFullAccount}
        onReconnect={requestJoinInfo}
      />
    </main>
  );
}
