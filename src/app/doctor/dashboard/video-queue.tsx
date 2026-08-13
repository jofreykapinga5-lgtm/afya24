"use client";

import { useEffect, useState, useTransition } from "react";
import { FileAudio, FileText, ImageIcon, Paperclip, UserRound, UsersRound, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinWaitingAppointment } from "../actions";

type QueueItem = {
  id: string;
  scheduledAt: string;
  status: string;
  patientName: string;
  patientReference: string;
  urgencyLevel: string;
  summaryText: string;
  patientOnline: boolean;
  files: { id: string; name: string; kind: string; url: string | null }[];
};

function urgencyClass(level: string) {
  if (level === "emergency" || level === "high") return "bg-[#fdecec] text-[#b42318]";
  if (level === "moderate") return "bg-[#fff6df] text-[#9a6500]";
  return "bg-[#e8f7f4] text-[#087a7b]";
}

function AttachmentKindIcon({ kind }: { kind: string }) {
  if (kind === "image") return <ImageIcon className="size-3.5" />;
  if (kind === "audio") return <FileAudio className="size-3.5" />;
  return <FileText className="size-3.5" />;
}

export function DoctorVideoQueue({ initialItems }: { initialItems: QueueItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function refreshQueue() {
      try {
        const response = await fetch("/api/doctor/video-queue", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { items?: QueueItem[] };
        if (!cancelled) setItems(data.items ?? []);
      } catch {
        // Keep the last known queue on transient network errors.
      }
    }

    refreshQueue();
    const intervalId = window.setInterval(refreshQueue, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section id="patients" className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#071923]">Patient queue</p>
          <p className="mt-1 text-sm text-[#64747c]">Live video calls waiting to connect with you.</p>
        </div>
        <UsersRound className="size-5 text-[#01b7bb]" />
      </div>

      <div className="mt-4 grid gap-3">
        {items.length > 0 ? (
          items.map((appointment) => (
            <div key={appointment.id} className="rounded-2xl bg-[#f8fbfd] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[#e8f7f4] text-sm font-bold text-[#087a7b]">
                    <UserRound className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#071923]">{appointment.patientName}</p>
                    <p className="mt-0.5 text-xs text-[#64747c]">{appointment.patientReference}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  {appointment.files.length > 0 ? (
                    <span
                      className="flex items-center gap-1 rounded-full bg-[#eef4ff] px-2 py-1 text-[11px] font-bold text-[#083273]"
                      title={`${appointment.files.length} attachment${appointment.files.length > 1 ? "s" : ""}`}
                    >
                      <Paperclip className="size-3" />
                      {appointment.files.length}
                    </span>
                  ) : null}
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${urgencyClass(appointment.urgencyLevel)}`}>
                    {appointment.urgencyLevel}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      appointment.patientOnline
                        ? "bg-[#e8f7f4] text-[#087a7b]"
                        : "bg-[#fdecec] text-[#b42318]"
                    }`}
                  >
                    {appointment.patientOnline ? "Patient online" : "Patient off"}
                  </span>
                </div>
              </div>

              {appointment.summaryText ? (
                <p className="mt-2 line-clamp-2 text-xs text-[#64747c]">{appointment.summaryText}</p>
              ) : null}

              {appointment.files.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {appointment.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.url ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      title={file.name}
                      className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#087a7b] ring-1 ring-[#dfe8eb] hover:bg-[#e8f7f4]"
                    >
                      <AttachmentKindIcon kind={file.kind} />
                      <span className="max-w-24 truncate">{file.name}</span>
                    </a>
                  ))}
                </div>
              ) : null}

              <form
                action={(formData) => {
                  startTransition(async () => {
                    await joinWaitingAppointment(formData);
                  });
                }}
                className="mt-3"
              >
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <input type="hidden" name="mode" value="video" />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!appointment.patientOnline || pending}
                  className="w-full gap-2 rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2] disabled:bg-[#e5eef0] disabled:text-[#8a9aa2]"
                >
                  <Video className="size-4" />
                  Join call
                </Button>
              </form>
            </div>
          ))
        ) : (
          <p className="px-1 py-6 text-center text-sm text-[#64747c]">
            No active video calls right now.
          </p>
        )}
      </div>
    </section>
  );
}
