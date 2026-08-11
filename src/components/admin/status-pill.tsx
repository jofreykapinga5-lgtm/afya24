import { cn } from "@/lib/utils";

export type StatusTone = "positive" | "info" | "pending" | "urgent" | "neutral";

const toneClass: Record<StatusTone, string> = {
  positive: "bg-primary-soft text-primary border-primary/30",
  info: "bg-info-soft text-info border-info/30",
  pending: "bg-pending-soft text-pending border-pending/30",
  urgent: "bg-urgent-soft text-urgent border-urgent/30",
  neutral: "bg-secondary text-muted-foreground border-border",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
