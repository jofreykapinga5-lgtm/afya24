import Link from "next/link";
import { CalendarClock, ShieldCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, appointmentStatusKey } from "@/lib/i18n";
import type { ConsultationMode } from "@/lib/types";
import { getPatientDashboardContext } from "./patient-context";
import { calculateAge, formatDateTime, statusClass, InfoRow, MiniStat } from "./dashboard-utils";

type NextAppointment = {
  id: string;
  scheduled_at: string;
  status: string;
  providers: { full_name: string; specialty: string } | null;
  consultation_orders: { consultation_mode: ConsultationMode }[] | null;
};

export default async function AccountDashboardOverviewPage() {
  const locale = await getServerLocale();
  const { user, patient, supabase } = await getPatientDashboardContext();

  const [{ count: visitsCount }, { data: nextAppointmentRows }] = await Promise.all([
    patient
      ? supabase.from("appointments").select("id", { count: "exact", head: true }).eq("patient_id", patient.id)
      : Promise.resolve({ count: 0 }),
    patient
      ? supabase
          .from("appointments")
          .select("id, scheduled_at, status, providers(full_name, specialty), consultation_orders(consultation_mode)")
          .eq("patient_id", patient.id)
          .in("status", ["waiting", "scheduled", "in_progress"])
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .returns<NextAppointment[]>()
      : Promise.resolve({ data: [] as NextAppointment[] }),
  ]);

  const patientReference = patient?.hospital_reference_number ?? "—";
  const patientPhone = patient?.phone ?? user.email ?? "—";
  const patientAge = calculateAge(patient?.date_of_birth ?? null);
  const patientInitial = (patient?.full_name ?? user.email ?? "P").slice(0, 1).toUpperCase();
  const nextAppointment = nextAppointmentRows?.[0] ?? null;

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#e8f7f4] text-3xl font-bold text-[#087a7b]">
              {patientInitial}
            </div>
            <div className="mt-4 text-center">
              <p className="font-bold text-[#071923]">{patient?.full_name ?? user.email ?? "Patient"}</p>
              <p className="mt-1 text-sm text-[#64747c]">{patientPhone}</p>
              <p className="mt-2 rounded-full bg-[#f4f8f9] px-3 py-1.5 text-xs font-bold text-[#083273]">
                {patientReference}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <MiniStat label={t("account_dashboard_stat_visits", locale)} value={String(visitsCount ?? 0)} />
              <MiniStat label={t("account_dashboard_stat_age", locale)} value={patientAge !== null ? String(patientAge) : "—"} />
              <MiniStat label={t("account_dashboard_stat_sex", locale)} value={patient?.gender ?? "—"} />
            </div>
          </article>

          <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_general_info_title", locale)}</p>
                <p className="mt-1 text-sm text-[#64747c]">{t("account_dashboard_general_info_body", locale)}</p>
              </div>
              <span className="rounded-full bg-[#e8f7f4] px-3 py-1 text-xs font-bold text-[#087a7b]">
                {t("account_dashboard_active_badge", locale)}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoRow label={t("account_dashboard_reference_number_label", locale)} value={patientReference} />
              <InfoRow label={t("account_dashboard_phone_label", locale)} value={patientPhone} />
              <InfoRow
                label={t("account_dashboard_dob_label", locale)}
                value={patient?.date_of_birth ?? t("account_dashboard_not_recorded", locale)}
              />
              <InfoRow label={t("account_dashboard_language_label", locale)} value={locale === "sw" ? "Kiswahili" : "English"} />
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_next_session_title", locale)}</p>
                <p className="mt-1 text-sm text-[#64747c]">{t("account_dashboard_next_session_body", locale)}</p>
              </div>
              <CalendarClock className="size-5 text-[#01b7bb]" />
            </div>
            <div className="mt-5 rounded-2xl bg-[#f4f8fb] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#071923]">
                    {nextAppointment?.providers?.specialty ?? t("account_dashboard_general_consultation_fallback", locale)}
                  </p>
                  <p className="mt-1 text-sm text-[#64747c]">
                    {nextAppointment?.providers?.full_name ?? t("account_dashboard_available_doctor_fallback", locale)}
                    {" · "}
                    {nextAppointment
                      ? formatDateTime(nextAppointment.scheduled_at, locale)
                      : t("account_dashboard_choose_a_time", locale)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(nextAppointment?.status ?? "scheduled")}`}>
                  {t(
                    appointmentStatusKey[(nextAppointment?.status ?? "scheduled") as keyof typeof appointmentStatusKey],
                    locale
                  )}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  className="h-10 rounded-full bg-[#01b7bb] px-4 font-bold text-white hover:bg-[#019ea2]"
                  nativeButton={false}
                  render={
                    <Link
                      href={
                        nextAppointment
                          ? `/consultation/${nextAppointment.id}?mode=${nextAppointment.consultation_orders?.[0]?.consultation_mode ?? "video"}`
                          : "/doctors"
                      }
                    />
                  }
                >
                  <Video className="size-4" />
                  {t("lookup_join_call_cta", locale)}
                </Button>
                <Button
                  variant="outline"
                  className="h-10 rounded-full bg-white px-4 font-bold text-[#083273]"
                  nativeButton={false}
                  render={<Link href="/doctors" />}
                >
                  {t("account_dashboard_nav_book", locale)}
                </Button>
              </div>
            </div>
          </article>

          <article className="rounded-[1.35rem] bg-[#e8f7f4] p-5 text-[#071923] shadow-[0_14px_40px_-35px_rgba(8,50,115,0.45)] ring-1 ring-[#ccece7]">
            <p className="text-sm font-bold text-[#083273]">{t("account_dashboard_care_summary_title", locale)}</p>
            <p className="mt-3 text-sm leading-6 text-[#4d5960]">{t("account_dashboard_care_summary_empty", locale)}</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#087a7b]">
              <ShieldCheck className="size-4" />
              {t("account_dashboard_doctor_signoff_required", locale)}
            </div>
          </article>
        </section>
    </div>
  );
}
