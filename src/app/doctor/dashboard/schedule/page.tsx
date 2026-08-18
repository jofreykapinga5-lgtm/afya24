import type { ReactNode } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, type TranslationKey } from "@/lib/i18n";
import { cancelAvailabilitySlot, createAvailabilitySlot } from "../../actions";
import { getDoctorDashboardContext } from "../doctor-context";
import { statusClass } from "../status-class";

type AvailabilitySlot = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  slot_type?: string | null;
  consultation_modes?: string[] | null;
  note?: string | null;
};

const slotTypeKey: Record<string, TranslationKey> = {
  available: "doctor_dashboard_slot_available",
  break: "doctor_dashboard_slot_break",
  time_off: "doctor_dashboard_slot_time_off",
};

const slotStatusKey: Record<string, TranslationKey> = {
  open: "doctor_dashboard_slot_status_open",
  cancelled: "doctor_dashboard_slot_status_cancelled",
};

const orderModeKey: Record<string, TranslationKey> = {
  chat: "account_dashboard_mode_chat",
  voice: "account_dashboard_mode_voice",
  video: "account_dashboard_mode_video",
};

export default async function DoctorSchedulePage() {
  const locale = await getServerLocale();
  const { provider, canManageAvailability, service } = await getDoctorDashboardContext();

  const { data: slots } = provider
    ? await service
        .from("provider_availability_slots")
        .select("id, starts_at, ends_at, status, slot_type, consultation_modes, note")
        .eq("provider_id", provider.id)
        .order("starts_at", { ascending: true })
        .limit(50)
        .returns<AvailabilitySlot[]>()
    : { data: [] as AvailabilitySlot[] };

  const modes = provider?.consultation_modes?.length
    ? provider.consultation_modes
    : ["chat", "voice", "video"];

  return (
    <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#071923]">{t("doctor_dashboard_schedule_title", locale)}</p>
          <p className="mt-1 text-sm text-[#64747c]">
            {t("doctor_dashboard_schedule_body", locale)}
          </p>
        </div>
        <CalendarClock className="size-5 text-[#01b7bb]" />
      </div>

      {canManageAvailability ? (
        <form action={createAvailabilitySlot} className="mt-5 grid gap-3 rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb] lg:grid-cols-[1fr_1fr_0.7fr_1fr_auto] lg:items-end">
          <Field label={t("doctor_dashboard_start_time", locale)}>
            <Input name="startTime" type="time" required className="rounded-xl bg-white" />
          </Field>
          <Field label={t("doctor_dashboard_end_time", locale)}>
            <Input name="endTime" type="time" required className="rounded-xl bg-white" />
          </Field>
          <Field label={t("doctor_dashboard_type_label", locale)}>
            <select
              className="h-8 rounded-xl border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              name="slotType"
              defaultValue="available"
            >
              <option value="available">{t("doctor_dashboard_slot_available", locale)}</option>
              <option value="break">{t("doctor_dashboard_slot_break", locale)}</option>
              <option value="time_off">{t("doctor_dashboard_slot_time_off", locale)}</option>
            </select>
          </Field>
          <Field label={t("doctor_dashboard_note_label", locale)}>
            <Input name="note" placeholder={t("doctor_dashboard_optional", locale)} className="rounded-xl bg-white" />
          </Field>
          <div className="hidden">
            <input name="consultationModes" type="checkbox" value="chat" defaultChecked={modes.includes("chat")} />
            <input name="consultationModes" type="checkbox" value="voice" defaultChecked={modes.includes("voice")} />
            <input name="consultationModes" type="checkbox" value="video" defaultChecked={modes.includes("video")} />
          </div>
          <Button type="submit" className="h-9 rounded-full bg-[#01b7bb] px-4 font-bold text-white hover:bg-[#019ea2]">
            {t("doctor_dashboard_add_block", locale)}
          </Button>
        </form>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#e1e9ec] bg-white">
        {slots && slots.length > 0 ? (
          slots.map((slot) => (
            <div key={slot.id} className="grid gap-3 border-b border-[#e1e9ec] px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-[#071923]">{formatDateRange(slot.starts_at, slot.ends_at)}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(slot.slot_type ?? "available")}`}>
                    {t(slotTypeKey[slot.slot_type ?? "available"] ?? "doctor_dashboard_slot_available", locale)}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(slot.status)}`}>
                    {t(slotStatusKey[slot.status] ?? "doctor_dashboard_slot_status_open", locale)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#64747c]">
                  {(slot.consultation_modes?.length ? slot.consultation_modes : ["chat", "voice", "video"])
                    .map((mode) => t(orderModeKey[mode] ?? "account_dashboard_mode_video", locale))
                    .join(", ")}
                  {slot.note ? ` / ${slot.note}` : ""}
                </p>
              </div>
              {canManageAvailability && slot.status !== "cancelled" ? (
                <form action={cancelAvailabilitySlot}>
                  <input type="hidden" name="slotId" value={slot.id} />
                  <Button type="submit" size="sm" variant="outline" className="rounded-full bg-white">
                    {t("doctor_dashboard_cancel_button", locale)}
                  </Button>
                </form>
              ) : null}
            </div>
          ))
        ) : (
          <p className="px-4 py-8 text-center text-sm text-[#64747c]">
            {t("doctor_dashboard_no_schedule_blocks", locale)}
          </p>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-bold text-[#071923]">{label}</span>
      {children}
    </label>
  );
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleString("en-TZ", {
    dateStyle: "medium",
    timeStyle: "short",
  })} to ${endDate.toLocaleTimeString("en-TZ", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
