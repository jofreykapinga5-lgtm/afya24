import { getServerLocale } from "@/lib/locale-cookie";
import { t, adminPaymentStatusKey } from "@/lib/i18n";
import { getPatientDashboardContext } from "../patient-context";
import { formatDateTime, statusClass } from "../dashboard-utils";

type DbAppointment = {
  id: string;
  scheduled_at: string;
  payment_status: string;
  price: number | string | null;
  currency: string | null;
};

export default async function AccountDashboardPaymentsPage() {
  const locale = await getServerLocale();
  const { patient, supabase } = await getPatientDashboardContext();

  const { data: appointmentRows } = patient
    ? await supabase
        .from("appointments")
        .select("id, scheduled_at, payment_status, price, currency")
        .eq("patient_id", patient.id)
        .order("scheduled_at", { ascending: false })
        .returns<DbAppointment[]>()
    : { data: [] as DbAppointment[] };

  const appointments = appointmentRows ?? [];
  const paidTotal = appointments
    .filter((appointment) => appointment.payment_status === "paid")
    .reduce((sum, appointment) => sum + Number(appointment.price ?? 0), 0);

  return (
    <section className="mx-auto max-w-2xl rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_nav_payments", locale)}</p>
        <p className="text-sm font-bold text-[#083273]">TZS {paidTotal.toLocaleString("en-TZ")}</p>
      </div>
      <div className="mt-4 grid gap-3">
        {appointments.length > 0 ? (
          appointments.map((appointment) => (
            <div key={appointment.id} className="rounded-2xl bg-[#f8fbfd] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#071923]">
                  {appointment.currency ?? "TZS"} {appointment.price ?? 0}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(appointment.payment_status)}`}>
                  {t(
                    adminPaymentStatusKey[appointment.payment_status as keyof typeof adminPaymentStatusKey] ??
                      adminPaymentStatusKey.pending,
                    locale
                  )}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#64747c]">{formatDateTime(appointment.scheduled_at, locale)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#64747c]">{t("account_dashboard_no_payments_yet", locale)}</p>
        )}
      </div>
    </section>
  );
}
