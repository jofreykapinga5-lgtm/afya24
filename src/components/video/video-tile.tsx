"use client";

import { VideoTrack, isTrackReference, type TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export function VideoTile({
  trackRef,
  className,
  mirrored = false,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  className?: string;
  mirrored?: boolean;
}) {
  const locale = useAppStore((state) => state.locale);

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900", className)}>
      {isTrackReference(trackRef) ? (
        <VideoTrack
          trackRef={trackRef}
          className={cn("size-full object-cover", mirrored && "-scale-x-100")}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-sm text-white/60">
          {t("video_camera_off_label", locale)}
        </div>
      )}
    </div>
  );
}
