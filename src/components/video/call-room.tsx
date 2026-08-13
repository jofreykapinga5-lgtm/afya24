"use client";

import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Track, VideoPresets } from "livekit-client";
import type { AudioCaptureOptions, RoomOptions, VideoCaptureOptions } from "livekit-client";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { Mic, MicOff, PhoneOff, ShieldCheck, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoTile } from "./video-tile";
import { upgradeToFullAccount } from "@/app/consultation/actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

const AUDIO_CAPTURE_DEFAULTS = {
  autoGainControl: true,
  echoCancellation: true,
  noiseSuppression: true,
  voiceIsolation: true,
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

function CallControls() {
  const locale = useAppStore((state) => state.locale);
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();

  return (
    <div className="flex items-center justify-center gap-4 rounded-full bg-black/50 px-5 py-3 backdrop-blur-md">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-14 rounded-full bg-white/15 text-white hover:bg-white/25"
        onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        aria-label={t(isMicrophoneEnabled ? "video_mute_mic" : "video_unmute_mic", locale)}
      >
        {isMicrophoneEnabled ? <Mic className="size-6" /> : <MicOff className="size-6" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-14 rounded-full bg-white/15 text-white hover:bg-white/25"
        onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
        aria-label={t(isCameraEnabled ? "video_camera_off_action" : "video_camera_on_action", locale)}
      >
        {isCameraEnabled ? <Video className="size-6" /> : <VideoOff className="size-6" />}
      </Button>
      <Button
        type="button"
        size="icon"
        className="size-14 rounded-full bg-urgent text-white hover:bg-urgent/90"
        onClick={() => room.disconnect()}
        aria-label={t("video_leave_call", locale)}
      >
        <PhoneOff className="size-6" />
      </Button>
    </div>
  );
}

function CallStage() {
  const locale = useAppStore((state) => state.locale);
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  });
  const localTrack = tracks.find((track) => track.participant.isLocal);
  const remoteTrack = tracks.find((track) => !track.participant.isLocal);
  const primary = remoteTrack ?? localTrack;
  const elapsed = useElapsedSeconds(Boolean(remoteTrack));

  return (
    <div className="relative flex-1 overflow-hidden bg-slate-950">
      {primary ? (
        <VideoTile trackRef={primary} className="absolute inset-0 size-full rounded-none" />
      ) : null}

      <div className="absolute inset-x-0 top-4 flex justify-center px-4">
        <div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          {remoteTrack ? (
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
      </div>

      {remoteTrack && localTrack ? (
        <div className="absolute right-4 bottom-4 w-24 sm:w-32">
          <VideoTile
            trackRef={localTrack}
            mirrored
            className="aspect-[3/4] w-full rounded-xl border border-white/20 shadow-lg"
          />
        </div>
      ) : null}
    </div>
  );
}

function AccountUpgradeForm({ locale }: { locale: "en" | "sw" }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError(t("consultation_upgrade_length_error", locale));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("consultation_upgrade_mismatch_error", locale));
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await upgradeToFullAccount(password);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create your account.");
      }
    });
  }

  if (success) {
    return (
      <div className="mx-auto grid w-full max-w-sm gap-3 text-center">
        <ShieldCheck className="mx-auto size-8 text-[#087a7b]" />
        <p className="font-semibold">{t("consultation_upgrade_success", locale)}</p>
        <Button className="mt-2" nativeButton={false} render={<Link href="/account/dashboard" />}>
          {t("consultation_upgrade_go_to_account", locale)}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm text-left">
      <div className="text-center">
        <ShieldCheck className="mx-auto size-8 text-[#087a7b]" />
        <p className="mt-2 font-semibold">{t("consultation_upgrade_title", locale)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("consultation_upgrade_body", locale)}</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <div className="space-y-1.5">
          <label htmlFor="upgradePassword" className="text-sm font-medium">
            {t("consultation_upgrade_password_label", locale)}
          </label>
          <Input
            id="upgradePassword"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="upgradePasswordConfirm" className="text-sm font-medium">
            {t("consultation_upgrade_password_confirm_label", locale)}
          </label>
          <Input
            id="upgradePasswordConfirm"
            type="password"
            minLength={8}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        {error && <p className="text-sm text-urgent">{error}</p>}
        <Button type="submit" disabled={pending} className="h-11 w-full">
          {t("consultation_upgrade_cta", locale)}
        </Button>
      </form>
    </div>
  );
}

export function CallRoom({
  serverUrl,
  token,
  initialVideoEnabled = true,
  showAccountUpgrade = false,
}: {
  serverUrl: string;
  token: string;
  initialVideoEnabled?: boolean;
  showAccountUpgrade?: boolean;
}) {
  const locale = useAppStore((state) => state.locale);
  const [ended, setEnded] = useState(false);

  if (ended) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <div>
          <p className="font-semibold">{t("video_call_ended", locale)}</p>
          {!showAccountUpgrade && (
            <p className="text-sm text-muted-foreground">{t("video_close_window", locale)}</p>
          )}
        </div>
        {showAccountUpgrade && <AccountUpgradeForm locale={locale} />}
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      audio={AUDIO_CAPTURE_DEFAULTS}
      video={initialVideoEnabled ? VIDEO_CAPTURE_DEFAULTS : false}
      options={ROOM_OPTIONS}
      onDisconnected={() => setEnded(true)}
      className="flex flex-1 flex-col bg-slate-950"
    >
      <CallStage />
      <div className="flex justify-center px-4 pt-3 pb-6 sm:pb-8">
        <CallControls />
      </div>
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
