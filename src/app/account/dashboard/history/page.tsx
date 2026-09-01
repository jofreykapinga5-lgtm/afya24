import { History } from "lucide-react";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, appointmentStatusKey } from "@/lib/i18n";
import type { ConsultationMode } from "@/lib/types";
import { getPatientDashboardContext } from "../patient-context";
import { formatDateTime, modeIcon, orderModeKey, statusClass } from "../dashboard-utils";

type DbAppointment = {
  id: string;
  scheduled_at: string;
  status: string;
  providers: { full_name: string; specialty: string } | null;
  consultation_orders: { consultation_mode: ConsultationMode }[] | null;
};

export default async function AccountDashboardHistoryPage() {
  const locale = await getServerLocale();
  const { patient, supabase } = await getPatientDashboardContext();

  const { data: appointmentRows } = patient
    ? await supabase
        .from("appointments")
        .select("id, scheduled_at, status, providers(full_name, specialty), consultation_orders(consultation_mode)")
        .eq("patient_id", patient.id)
        .order("scheduled_at", { ascending: false })
        .returns<DbAppointment[]>()
    : { data: [] as DbAppointment[] };

  const appointments = appointmentRows ?? [];

  return (
    <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_session_history_title", locale)}</p>
          <p className="mt-1 text-sm text-[#64747c]">{t("account_dashboard_session_history_body", locale)}</p>
        </div>
        <History className="size-5 text-[#01b7bb]" />
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#e1e9ec]">
        {appointments.length > 0 ? (
          appointments.map((appointment) => {
            const mode = appointment.consultation_orders?.[0]?.consultation_mode ?? "video";
            const ModeIcon = modeIcon[mode];
            return (
              <div
                key={appointment.id}
                className="grid gap-3 border-b border-[#e1e9ec] bg-white p-4 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div>
                  <p className="font-semibold text-[#071923]">
                    {appointment.providers?.specialty ?? t("account_dashboard_consultation_fallback", locale)}
                  </p>
                  <p className="mt-1 text-sm text-[#64747c]">
                    {appointment.providers?.full_name ?? t("account_dashboard_doctor_fallback", locale)} ·{" "}
                    {formatDateTime(appointment.scheduled_at, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#083273]">
                  <ModeIcon className="size-4 text-[#01b7bb]" />
                  {t(orderModeKey[mode], locale)}
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusClass(appointment.status)}`}>
                  {t(appointmentStatusKey[appointment.status as keyof typeof appointmentStatusKey], locale)}
                </span>
              </div>
            );
          })
        ) : (
          <p className="px-4 py-8 text-center text-sm text-[#64747c]">{t("account_dashboard_no_visits_yet", locale)}</p>
        )}
      </div>
    </section>
  );
}
