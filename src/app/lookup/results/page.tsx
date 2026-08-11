import Link from "next/link";
import { ArrowLeft, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, appointmentStatusKey } from "@/lib/i18n";
import { endPatientSession } from "../actions";

export default async function LookupResultsPage() {
  const locale = await getServerLocale();
  const session = await getPatientSession();

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">{t("lookup_expired_title", locale)}</h1>
        <p className="text-sm text-muted-foreground">{t("lookup_expired_body", locale)}</p>
        <Link
          href="/lookup"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("lookup_back_to_lookup", locale)}
        </Link>
      </main>
    );
  }

  const supabase = createServiceClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("full_name, hospital_reference_number")
    .eq("id", session.patientId)
    .maybeSingle();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, scheduled_at, status, consultation_mode:consultation_orders(consultation_mode)")
    .eq("patient_id", session.patientId)
    .order("scheduled_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-3.5" />
          {t("back_to_home", locale)}
        </Link>
        <form action={endPatientSession}>
          <Button type="submit" variant="outline" className="h-9 rounded-lg">
            {t("lookup_end_session", locale)}
          </Button>
        </form>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight">{patient?.full_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dashboard_reference_prefix", locale)} {patient?.hospital_reference_number}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">{t("dashboard_appointments", locale)}</h2>
        {appointments && appointments.length > 0 ? (
          <ul className="mt-4 divide-y divide-border">
            {appointments.map((appointment) => {
              const canJoin = appointment.status === "waiting" || appointment.status === "in_progress";
              const mode = appointment.consultation_mode?.[0]?.consultation_mode ?? "video";
              return (
                <li key={appointment.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <span className="text-sm">
                      {new Date(appointment.scheduled_at).toLocaleString(
                        locale === "sw" ? "sw-TZ" : "en-TZ",
                        { dateStyle: "medium", timeStyle: "short" }
                      )}
                    </span>
                    <span className="ml-3 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {t(appointmentStatusKey[appointment.status], locale)}
                    </span>
                  </div>
                  {canJoin ? (
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 rounded-full"
                      nativeButton={false}
                      render={<Link href={`/consultation/${appointment.id}?mode=${mode}`} />}
                    >
                      <Video className="size-3.5" />
                      {t("lookup_join_call_cta", locale)}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("dashboard_no_appointments", locale)}
          </p>
        )}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        This is a bare-bones results view to prove the lookup flow works end to end. Prescriptions,
        lab orders, and signed visit summaries are separate follow-up work.
      </p>
    </main>
  );
}
