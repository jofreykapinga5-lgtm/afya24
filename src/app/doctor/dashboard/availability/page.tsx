import { Clock } from "lucide-react";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { getDoctorDashboardContext } from "../doctor-context";
import { DoctorAvailabilityForm } from "../availability-form";

export default async function DoctorAvailabilityPage() {
  const locale = await getServerLocale();
  const { provider, canManageAvailability } = await getDoctorDashboardContext();

  const modes = provider?.consultation_modes?.length
    ? provider.consultation_modes
    : ["chat", "voice", "video"];

  return (
    <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#071923]">{t("doctor_dashboard_availability_controls_title", locale)}</p>
          <p className="mt-1 text-sm text-[#64747c]">
            {t("doctor_dashboard_availability_controls_body", locale)}
          </p>
        </div>
        <Clock className="size-5 text-[#01b7bb]" />
      </div>

      {canManageAvailability ? (
        <DoctorAvailabilityForm
          availableNow={Boolean(provider?.available_now)}
          availabilityNote={provider?.availability_note ?? ""}
          modes={modes}
        />
      ) : (
        <div className="mt-5 rounded-2xl bg-[#fff6df] p-4 text-sm text-[#9a6500]">
          {t("doctor_dashboard_profile_inactive_note", locale)}
        </div>
      )}
    </section>
  );
}
