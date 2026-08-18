import { getServerLocale } from "@/lib/locale-cookie";
import { getDoctorDashboardContext } from "../doctor-context";
import { ScheduleManager, type AvailabilitySlot } from "./schedule-manager";

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
    <ScheduleManager
      slots={slots ?? []}
      modes={modes}
      canManageAvailability={canManageAvailability}
      locale={locale}
    />
  );
}
