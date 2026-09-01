import { FileAudio, FileText, HeartPulse, ImageIcon, MessageCircle, Video } from "lucide-react";
import type { ConsultationMode, Locale } from "@/lib/types";

// Shared by every page under /account/dashboard that renders a status pill,
// a visit/order timestamp, or a patient's age -- split out here (rather than
// duplicated per page) once the dashboard stopped being one file.
export const orderModeKey = {
  chat: "account_dashboard_mode_chat",
  voice: "account_dashboard_mode_voice",
  video: "account_dashboard_mode_video",
} as const;

export const fulfillmentMethodKey = {
  pickup: "checkout_pickup",
  delivery: "checkout_delivery",
} as const;

export const fileKindKey = {
  image: "account_dashboard_file_kind_image",
  audio: "account_dashboard_file_kind_audio",
} as const;

export const modeIcon: Record<ConsultationMode, typeof MessageCircle> = {
  chat: MessageCircle,
  voice: HeartPulse,
  video: Video,
};

export function attachmentIcon(kind: string | null) {
  if (kind === "image") return ImageIcon;
  if (kind === "audio") return FileAudio;
  return FileText;
}

export function statusClass(status: string) {
  if (status === "paid" || status === "scheduled" || status === "completed" || status === "delivered") {
    return "bg-[#e8f7f4] text-[#087a7b]";
  }
  if (status === "waiting" || status === "pending" || status === "preparing" || status === "instructions_sent") {
    return "bg-[#fff6df] text-[#9a6500]";
  }
  if (status === "failed" || status === "cancelled") {
    return "bg-[#fdecec] text-[#b42318]";
  }
  return "bg-[#eef4ff] text-[#083273]";
}

export function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function formatDateTime(iso: string, locale: Locale) {
  return new Date(iso).toLocaleString(locale === "sw" ? "sw-TZ" : "en-TZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Dar_es_Salaam",
  });
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fbfd] px-2 py-3">
      <p className="text-sm font-bold capitalize text-[#071923]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#64747c]">{label}</p>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fbfd] p-3">
      <p className="text-xs font-semibold text-[#64747c]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#071923]">{value}</p>
    </div>
  );
}
