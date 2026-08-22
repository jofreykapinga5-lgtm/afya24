"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ConnectionQuality, ConnectionState, DisconnectReason, Track, VideoPresets } from "livekit-client";
import type { AudioCaptureOptions, RoomConnectOptions, RoomOptions, VideoCaptureOptions } from "livekit-client";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionQualityIndicator,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { Mic, MicOff, PhoneOff, ShieldCheck, TriangleAlert, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoTile } from "./video-tile";
import { upgradeToFullAccount } from "@/app/consultation/actions";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const AUDIO_CAPTURE_DEFAULTS = {
  autoGainControl: true,
  echoCancellation: true,
  noiseSuppression: true,
} satisfies AudioCaptureOptions;

const VIDEO_CAPTURE_DEFAULTS = {
  facingMode: "user",
  resolution: VideoPresets.h540.resolution,
} satisfies VideoCaptureOptions;

const ROOM_OPTIONS = {
  adaptiveStream: true,
  dynacast: true,
  audioCaptureDefaults: AUDIO_CAPTURE_DEFAULTS,
  videoCaptureDefaults: VIDEO_CAPTURE_DEFAULTS,
  publishDefaults: {
    dtx: true,
    red: true,
    simulcast: true,
    videoEncoding: VideoPresets.h540.encoding,
    videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
    degradationPreference: "balanced",
  },
} satisfies RoomOptions;

// Defaults (15s each) assume decent connectivity; patients here are
// explicitly expected to be on variable-quality mobile networks (see
// DESIGN.md), so both the initial join and any automatic reconnect attempt
// get more room before LiveKit gives up.
const CONNECT_OPTIONS = {
  peerConnectionTimeout: 30_000,
  websocketTimeout: 30_000,
} satisfies RoomConnectOptions;

// LiveKit already retries a dropped connection automatically for close to a
// minute (see DefaultReconnectPolicy) -- the gap was that nothing told the
// user this was happening, so a network blip looked like a frozen/broken
// call instead of "hang on, reconnecting."
function isReconnectingState(state: ConnectionState) {
  return state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting;
}

function useElapsedSeconds(active: boolean) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  return seconds;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function CallControls({ onHangup }: { onHangup?: () => void }) {
  const locale = useAppStore((state) => state.locale);
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const connectionState = useConnectionState();
  // Publishing a track before the underlying connection has fully come up
  // rejects with "publishing rejected as engine not connected within
  // timeout" -- seen in production as a real patient rage-clicking a
  // mic/camera toggle that silently did nothing right after joining.
  // Disabling until Connected removes the race instead of just swallowing
  // the failure after the fact; the .catch() below is a second line of
  // defense for the rare drop mid-toggle (e.g. a reconnect starting the
  // instant the button is pressed).
  const controlsReady = connectionState === ConnectionState.Connected;

  return (
    <div className="flex items-center justify-center gap-4 rounded-full bg-black/50 px-5 py-3 backdrop-blur-md">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!controlsReady}
        className="size-14 rounded-full bg-white/15 text-white hover:bg-white/25"
        onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled).catch(() => {})}
        aria-label={t(isMicrophoneEnabled ? "video_mute_mic" : "video_unmute_mic", locale)}
      >
        {isMicrophoneEnabled ? <Mic className="size-6" /> : <MicOff className="size-6" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!controlsReady}
        className="size-14 rounded-full bg-white/15 text-white hover:bg-white/25"
        onClick={() => void localParticipant.setCameraEnabled(!isCameraEnabled).catch(() => {})}
        aria-label={t(isCameraEnabled ? "video_camera_off_action" : "video_camera_on_action", locale)}
      >
        {isCameraEnabled ? <Video className="size-6" /> : <VideoOff className="size-6" />}
      </Button>
      <Button
        type="button"
        size="icon"
        className="size-14 rounded-full bg-urgent text-white hover:bg-urgent/90"
        // The doctor's dashboard panel needs its own end-of-call bookkeeping
        // (mark the appointment completed so patient-history picks it up
        // next visit, flush notes, collapse the panel) -- see call-panel.tsx.
        // Falling back to a plain room.disconnect() keeps the patient's
        // full-screen page (which has no such bookkeeping) unaffected.
        onClick={() => (onHangup ? onHangup() : room.disconnect())}
        aria-label={t("video_leave_call", locale)}
      >
        <PhoneOff className="size-6" />
      </Button>
    </div>
  );
}

function CallStage({ onHangup }: { onHangup?: () => void }) {
  const locale = useAppStore((state) => state.locale);
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  });
  const localTrack = tracks.find((track) => track.participant.isLocal);
  const remoteTrack = tracks.find((track) => !track.participant.isLocal);
  const primary = remoteTrack ?? localTrack;
  const elapsed = useElapsedSeconds(Boolean(remoteTrack));
  const connectionState = useConnectionState();
  const reconnecting = isReconnectingState(connectionState);
  // useConnectionQualityIndicator() with no argument needs a ParticipantContext
  // to fall back to -- CallStage doesn't render inside one (it's a direct
  // LiveKitRoom child, not wrapped in <ParticipantTile>), so it throws
  // "No participant provided" without passing one explicitly.
  const { localParticipant } = useLocalParticipant();
  const { quality } = useConnectionQualityIndicator({ participant: localParticipant });
  const poorConnection =
    !reconnecting && (quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost);

  return (
    <div className="relative flex-1 overflow-hidden bg-slate-950">
      {primary ? (
        <VideoTile
          trackRef={primary}
          className={cn("absolute inset-0 size-full rounded-none transition-opacity", reconnecting && "opacity-40")}
        />
      ) : null}

      <div className="absolute inset-x-0 top-4 flex flex-col items-center gap-2 px-4">
        <div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          {reconnecting ? (
            <>
              <span className="size-3 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {t("video_reconnecting", locale)}
            </>
          ) : remoteTrack ? (
            <>
              <span className="max-w-40 truncate">
                {remoteTrack.participant.name || remoteTrack.participant.identity}
              </span>
              <span className="text-white/60 tabular-nums">{formatDuration(elapsed)}</span>
            </>
          ) : (
            <>
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              {t("video_waiting_for_other", locale)}
            </>
          )}
        </div>

        {poorConnection ? (
          <div className="flex items-center gap-1.5 rounded-full bg-urgent/85 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            <TriangleAlert className="size-3" />
            {t("video_poor_connection", locale)}
          </div>
        ) : null}
      </div>

      {remoteTrack && localTrack ? (
        <div className="absolute right-4 bottom-28 w-24 sm:right-6 sm:bottom-32 sm:w-32">
          <VideoTile
            trackRef={localTrack}
            mirrored
            className="aspect-[3/4] w-full rounded-xl border border-white/20 shadow-lg"
          />
        </div>
      ) : null}

      {/* Overlaid on the video itself (translucent pill, same treatment as
          the status bar above) rather than stacked below it in a separate
          row -- a fixed-height controls row competing for space with the
          video inside a height-capped wrapper was cropping into the
          patient's frame instead of just sitting below it. */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4 sm:bottom-6">
        <CallControls onHangup={onHangup} />
      </div>
    </div>
  );
}

function AccountUpgradeForm({ locale }: { locale: "en" | "sw" }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCreateAccount() {
    setError(null);
    startTransition(async () => {
      const result = await upgradeToFullAccount();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess(true);
    });
  }

  // This upgrade is a convenience, not a requirement -- the patient's
  // reference number already works for returning later on its own (see
  // USER-FLOWS.md: patients don't need an account in v1). Without a way out
  // here, this screen was the only thing shown after a call ended, reading
  // as a mandatory second step instead of an optional offer.
  if (skipped) {
    return (
      <p className="text-sm text-[#60717a]">{t("video_close_window", locale)}</p>
    );
  }

  if (success) {
    return (
      <div className="mx-auto grid w-full max-w-sm gap-3 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#e8f7f4] text-[#01b7bb]">
          <ShieldCheck className="size-7" />
        </span>
        <p className="font-bold text-[#071923]">{t("consultation_upgrade_success", locale)}</p>
        <Button
          className="mt-2 h-11 rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
          nativeButton={false}
          render={<Link href="/account/dashboard" />}
        >
          {t("consultation_upgrade_go_to_account", locale)}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm rounded-[1.75rem] bg-white p-6 text-left shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0]">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#e8f7f4] text-[#01b7bb]">
          <ShieldCheck className="size-7" />
        </span>
        <p className="mt-3 font-bold text-[#071923]">{t("consultation_upgrade_title", locale)}</p>
        <p className="mt-1 text-sm text-[#60717a]">{t("consultation_upgrade_body", locale)}</p>
      </div>
      <div className="mt-4 grid gap-3">
        {error && (
          <p role="alert" className="rounded-xl bg-[#fff4f0] px-4 py-3 text-sm text-[#9b2c12]">
            {error}
          </p>
        )}
        <Button
          type="button"
          disabled={pending}
          onClick={handleCreateAccount}
          className="h-11 w-full rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
        >
          {t("consultation_upgrade_cta", locale)}
        </Button>
        <button
          type="button"
          onClick={() => setSkipped(true)}
          className="text-center text-sm font-semibold text-[#60717a] outline-none hover:text-[#083273] focus-visible:underline"
        >
          {t("consultation_upgrade_skip", locale)}
        </button>
      </div>
    </div>
  );
}

export function CallRoom({
  serverUrl,
  token,
  queueAppointmentId,
  initialVideoEnabled = true,
  showAccountUpgrade = false,
  onReconnect,
  onHangup,
}: {
  serverUrl: string;
  token: string;
  queueAppointmentId?: string;
  initialVideoEnabled?: boolean;
  showAccountUpgrade?: boolean;
  // Re-requests a fresh join token for this same appointment (the parent
  // page owns that fetch). Absent for the very rare caller that can't offer
  // one -- the ended screen just skips the reconnect button in that case.
  onReconnect?: () => Promise<{ serverUrl: string; token: string }>;
  // Runs instead of a plain room.disconnect() when the in-call hangup
  // button is pressed -- see CallControls' comment on why the doctor's
  // dashboard needs this and the patient's page doesn't pass it.
  onHangup?: () => void;
}) {
  const locale = useAppStore((state) => state.locale);
  const [connection, setConnection] = useState({ serverUrl, token, attempt: 0 });
  const [ended, setEnded] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState<DisconnectReason | undefined>(undefined);
  const [reconnectPending, setReconnectPending] = useState(false);
  const [reconnectError, setReconnectError] = useState<string | null>(null);

  // A manual hangup (the PhoneOff button, or the other side leaving)
  // reports CLIENT_INITIATED; everything else here is the network dropping
  // the connection out from under the call. Those two cases need very
  // different messaging -- "call ended" reads as broken when what actually
  // happened is the signal died mid-consultation.
  const droppedByNetwork = ended && disconnectReason !== DisconnectReason.CLIENT_INITIATED;

  useEffect(() => {
    if (!queueAppointmentId || ended) return;

    const heartbeat = () => {
      void fetch("/api/video/queue-heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: queueAppointmentId }),
      });
    };

    heartbeat();
    const intervalId = window.setInterval(heartbeat, 8_000);
    return () => window.clearInterval(intervalId);
  }, [queueAppointmentId, ended]);

  async function handleReconnect() {
    if (!onReconnect) return;
    setReconnectPending(true);
    setReconnectError(null);
    try {
      const fresh = await onReconnect();
      setConnection((current) => ({ ...fresh, attempt: current.attempt + 1 }));
      setDisconnectReason(undefined);
      setEnded(false);
    } catch (err) {
      setReconnectError(err instanceof Error ? err.message : t("video_reconnect_failed", locale));
    } finally {
      setReconnectPending(false);
    }
  }

  if (ended) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#f7fbfb] px-4 py-10 text-center">
        <div>
          <p className="font-bold text-[#071923]">
            {droppedByNetwork ? t("video_connection_lost_title", locale) : t("video_call_ended", locale)}
          </p>
          {droppedByNetwork ? (
            <p className="mt-1 max-w-sm text-sm text-[#60717a]">
              {t("video_connection_lost_body", locale)}
            </p>
          ) : (
            !showAccountUpgrade && (
              <p className="text-sm text-[#60717a]">{t("video_close_window", locale)}</p>
            )
          )}
        </div>

        {droppedByNetwork && onReconnect ? (
          <div className="grid gap-2">
            <Button
              onClick={handleReconnect}
              disabled={reconnectPending}
              className="h-11 rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
            >
              {reconnectPending ? t("video_reconnecting_action", locale) : t("video_reconnect_action", locale)}
            </Button>
            {reconnectError ? <p className="text-sm text-urgent">{reconnectError}</p> : null}
          </div>
        ) : null}

        {!droppedByNetwork && showAccountUpgrade && <AccountUpgradeForm locale={locale} />}
      </div>
    );
  }

  return (
    <LiveKitRoom
      key={connection.attempt}
      serverUrl={connection.serverUrl}
      token={connection.token}
      connect
      audio={AUDIO_CAPTURE_DEFAULTS}
      video={initialVideoEnabled ? VIDEO_CAPTURE_DEFAULTS : false}
      options={ROOM_OPTIONS}
      connectOptions={CONNECT_OPTIONS}
      onDisconnected={(reason) => {
        setDisconnectReason(reason);
        setEnded(true);
      }}
      className="flex flex-1 flex-col bg-slate-950"
    >
      <CallStage onHangup={onHangup} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
