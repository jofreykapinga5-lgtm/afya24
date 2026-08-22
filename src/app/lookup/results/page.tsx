import Link from "next/link";
import { ArrowLeft, CalendarClock, TriangleAlert, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
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
      <main className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col items-center justify-center gap-3 bg-[#f7fbfb] px-4 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#fff4f0]">
          <TriangleAlert className="size-7 text-[#9b2c12]" />
        </span>
        <div className="mx-auto max-w-md">
          <p className="font-bold text-[#071923]">{t("lookup_expired_title", locale)}</p>
          <p className="mt-1 text-sm text-[#60717a]">{t("lookup_expired_body", locale)}</p>
        </div>
        <Link
          href="/lookup"
          className="text-sm font-semibold text-[#01b7bb] underline-offset-4 hover:underline"
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
    <main className="min-h-[calc(100dvh-3.5rem)] flex-1 bg-[#f7fbfb]">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-[#60717a] outline-none transition-colors hover:text-[#071923] focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-3.5" />
            {t("back_to_home", locale)}
          </Link>
          <form action={endPatientSession}>
            <Button
              type="submit"
              variant="outline"
              className="h-9 rounded-full border-[#dfe8eb] bg-white text-[#60717a] hover:border-[#01b7bb]/40 hover:bg-[#f1fbfa] hover:text-[#071923]"
            >
              {t("lookup_end_session", locale)}
            </Button>
          </form>
        </div>

        <Reveal delay={0}>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#071923]">{patient?.full_name}</h1>
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#e8f7f4] px-3 py-1 text-xs font-semibold text-[#087a7b]">
                {t("dashboard_reference_prefix", locale)} {patient?.hospital_reference_number}
              </p>
            </div>
            <Button
              className="h-10 shrink-0 rounded-full bg-[#01b7bb] px-4 font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
              nativeButton={false}
              render={<Link href="/doctors" />}
            >
              {t("account_dashboard_nav_book", locale)}
            </Button>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="mt-6 rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#e5eef0] sm:p-7">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#071923]">
              <CalendarClock className="size-4 text-[#01b7bb]" />
              {t("dashboard_appointments", locale)}
            </h2>
            {appointments && appointments.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {appointments.map((appointment) => {
                  const canJoin = appointment.status === "waiting" || appointment.status === "in_progress";
                  const mode = appointment.consultation_mode?.[0]?.consultation_mode ?? "video";
                  return (
                    <li
                      key={appointment.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8fbfd] px-4 py-3 ring-1 ring-[#dfe8eb]"
                    >
                      <div>
                        <span className="text-sm font-medium text-[#071923]">
                          {new Date(appointment.scheduled_at).toLocaleString(
                            locale === "sw" ? "sw-TZ" : "en-TZ",
                            { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Dar_es_Salaam" }
                          )}
                        </span>
                        <span className="ml-3 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#60717a] ring-1 ring-[#e5eef0]">
                          {t(appointmentStatusKey[appointment.status], locale)}
                        </span>
                      </div>
                      {canJoin ? (
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
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
              <p className="mt-3 text-sm text-[#60717a]">{t("dashboard_no_appointments", locale)}</p>
            )}
          </div>
        </Reveal>
      </div>
    </main>
  );
}
