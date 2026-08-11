import { MessageCircle, Phone, Video } from "lucide-react";
import type { ConsultationMode } from "@/lib/types";

const modeIcon: Record<ConsultationMode, typeof MessageCircle> = {
  chat: MessageCircle,
  voice: Phone,
  video: Video,
};

export function ConsultationModeIcons({ modes }: { modes: ConsultationMode[] }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {modes.map((mode) => {
        const Icon = modeIcon[mode];
        return (
          <span
            key={mode}
            title={mode}
            className="inline-flex size-6 items-center justify-center rounded-full bg-secondary"
          >
            <Icon className="size-3.5" />
          </span>
        );
      })}
    </div>
  );
}
