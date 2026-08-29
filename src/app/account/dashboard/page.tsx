import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CreditCard,
  FileAudio,
  FileText,
  FlaskConical,
  HeartPulse,
  History,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { redirectIfStaffUser } from "@/lib/staff-redirect-guard";
import { getDefaultService } from "@/lib/default-service";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import { getServerLocale } from "@/lib/locale-cookie";
import { toTitleCase } from "@/lib/format-name";
import {
  t,
  appointmentStatusKey,
  pharmacyOrderStatusKey,
  adminLabOrderStatusKey,
  adminPaymentStatusKey,
} from "@/lib/i18n";
import type { ConsultationMode, Locale } from "@/lib/types";
import { signOut } from "../actions";
import { PatientDashboardMobileMenu } from "./mobile-menu";

type DbAppointment = {
  id: string;
  scheduled_at: string;
  status: string;
  payment_status: string;
  price: number | string | null;
  currency: string | null;
  providers: { full_name: string; specialty: string } | null;
  consultation_orders: { consultation_mode: ConsultationMode }[] | null;
};

type DbPharmacyOrder = {
  id: string;
  status: string;
  fulfillment_method: string;
  total_amount: number | string;
  created_at: string;
};

type DbLabOrder = {
  id: string;
  status: string;
  reason: string | null;
  map_url: string | null;
  lab_locations: { name: string } | null;
};

type DbFile = {
  id: string;
  original_filename: string | null;
  attachment_kind: string | null;
  storage_path: string;
  created_at: string;
};

const navItems = [
  { labelKey: "account_dashboard_nav_overview", anchor: "overview", icon: LayoutDashboard },
  { labelKey: "account_dashboard_nav_book", anchor: "book-a-call", icon: Video },
  { labelKey: "account_dashboard_nav_doctors", anchor: "doctors", icon: Stethoscope },
  { labelKey: "account_dashboard_nav_history", anchor: "history", icon: History },
  { labelKey: "account_dashboard_nav_payments", anchor: "payments", icon: CreditCard },
  { labelKey: "account_dashboard_nav_files", anchor: "files", icon: FileText },
] as const;

const orderModeKey = {
  chat: "account_dashboard_mode_chat",
  voice: "account_dashboard_mode_voice",
  video: "account_dashboard_mode_video",
} as const;

const fulfillmentMethodKey = {
  pickup: "checkout_pickup",
  delivery: "checkout_delivery",
} as const;

const fileKindKey = {
  image: "account_dashboard_file_kind_image",
  audio: "account_dashboard_file_kind_audio",
} as const;

const modeIcon: Record<ConsultationMode, typeof MessageCircle> = {
  chat: MessageCircle,
  voice: HeartPulse,
  video: Video,
};

function attachmentIcon(kind: string | null) {
  if (kind === "image") return ImageIcon;
  if (kind === "audio") return FileAudio;
  return FileText;
}

function statusClass(status: string) {
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

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

function formatDateTime(iso: string, locale: Locale) {
  return new Date(iso).toLocaleString(locale === "sw" ? "sw-TZ" : "en-TZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Dar_es_Salaam",
  });
}

export default async function AccountDashboardPage() {
  const locale = await getServerLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  await redirectIfStaffUser(user.id);

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, hospital_reference_number, phone, date_of_birth, gender")
    .eq("user_id", user.id)
    .maybeSingle();

  // These five reads don't depend on each other (only the signed-URL step
  // below depends on attachmentFiles, and featuredDoctors depends on
  // providerRows/defaultService) -- running them one at a time was six
  // sequential round trips to Supabase on every dashboard load.
  const [
    { data: liveAppointments },
    { data: pharmacyOrdersData },
    { data: labOrdersData },
    { data: attachmentFiles },
    defaultService,
    { data: providerRows },
  ] = await Promise.all([
    patient
      ? supabase
          .from("appointments")
          .select(
            "id, scheduled_at, status, payment_status, price, currency, providers(full_name, specialty), consultation_orders(consultation_mode)"
          )
          .eq("patient_id", patient.id)
          .order("scheduled_at", { ascending: false })
          .returns<DbAppointment[]>()
      : Promise.resolve({ data: [] as DbAppointment[] }),
    patient
      ? supabase
          .from("pharmacy_orders")
          .select("id, status, fulfillment_method, total_amount, created_at")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false })
          .limit(5)
          .returns<DbPharmacyOrder[]>()
      : Promise.resolve({ data: [] as DbPharmacyOrder[] }),
    patient
      ? supabase
          .from("lab_orders")
          .select("id, status, reason, map_url, lab_locations(name)")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false })
          .limit(5)
          .returns<DbLabOrder[]>()
      : Promise.resolve({ data: [] as DbLabOrder[] }),
    patient
      ? supabase
          .from("files")
          .select("id, original_filename, attachment_kind, storage_path, created_at")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false })
          .limit(6)
          .returns<DbFile[]>()
      : Promise.resolve({ data: [] as DbFile[] }),
    getDefaultService(supabase).catch(() => null),
    supabase
      .from("providers")
      .select(
        "id, full_name, specialty, credentials, bio, photo_url, languages, rating_summary, available_now, consultation_modes"
      )
      .eq("profile_status", "active")
      .eq("available_now", true)
      .order("available_now", { ascending: false })
      .limit(3),
  ]);

  const signedUrlByPath = new Map<string, string>();
  if (attachmentFiles && attachmentFiles.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("patient-attachments")
      .createSignedUrls(
        attachmentFiles.map((file) => file.storage_path),
        600
      );
    signedUrls?.forEach((entry) => {
      if (entry.signedUrl) signedUrlByPath.set(entry.path ?? "", entry.signedUrl);
    });
  }
  const featuredDoctors = ((providerRows ?? []) as ProviderRow[]).map((row) =>
    mapProviderRow(row, defaultService?.basePrice ?? 0, locale)
  );

  const patientName = (patient?.full_name ? toTitleCase(patient.full_name) : null) ?? user.email ?? "Patient";
  const patientReference = patient?.hospital_reference_number ?? "—";
  const patientPhone = patient?.phone ?? user.phone ?? "—";
  const patientInitial = patientName.slice(0, 1).toUpperCase();
  const patientAge = calculateAge(patient?.date_of_birth ?? null);

  const appointments = liveAppointments ?? [];
  const nextAppointment = appointments.find((appointment) =>
    ["waiting", "scheduled", "in_progress"].includes(appointment.status)
  );
  const paidAppointments = appointments.filter((appointment) => appointment.payment_status === "paid");
  const paidTotal = paidAppointments.reduce((sum, appointment) => sum + Number(appointment.price ?? 0), 0);

  return (
    <main className="min-h-[100dvh] bg-[#edf3f6] px-3 py-3 text-[#101820] sm:px-5 lg:px-6">
      <div className="sticky top-0 z-40 mx-auto mb-3 flex w-full max-w-7xl items-center justify-between rounded-2xl border border-[#dfe8eb] bg-white/94 px-4 py-3 text-[#071923] shadow-[0_18px_45px_-32px_rgba(8,50,115,0.35)] backdrop-blur lg:hidden">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/brand/afya24-logo-header.png"
            alt="Afya24"
            width={220}
            height={70}
            priority
            style={{ width: "auto" }}
            className="h-7"
          />
        </Link>

        <PatientDashboardMobileMenu />
      </div>

      <div className="mx-auto grid w-full max-w-7xl rounded-[1.75rem] bg-[#f8fbfd] shadow-[0_28px_90px_-50px_rgba(8,50,115,0.55)] lg:grid-cols-[250px_1fr]">
        <aside className="hidden border-r border-[#dfe8eb] bg-white p-5 text-[#071923] lg:sticky lg:top-3 lg:block lg:h-[calc(100dvh-1.5rem)] lg:self-start lg:overflow-y-auto lg:rounded-l-[1.75rem]">
          <div className="flex min-h-full flex-col">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/brand/afya24-logo-header.png"
                alt="Afya24"
                width={220}
                height={70}
                priority
                style={{ width: "auto" }}
                className="h-8"
              />
            </Link>

            <nav className="mt-8 grid gap-1.5">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.anchor}
                    href={`#${item.anchor}`}
                    className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
                      index === 0
                        ? "bg-[#e8f7f4] text-[#083273]"
                        : "text-[#60717a] hover:bg-[#f4f8f9] hover:text-[#083273]"
                    }`}
                  >
                    <Icon className="size-4" />
                    {t(item.labelKey, locale)}
                  </a>
                );
              })}
            </nav>

            <div className="mt-10 rounded-[1.35rem] bg-[#f4f8f9] p-4 ring-1 ring-[#dfe8eb] lg:mt-auto">
              <p className="text-sm font-bold text-[#083273]">{t("account_dashboard_need_care_title", locale)}</p>
              <p className="mt-2 text-xs leading-5 text-[#60717a]">
                {t("account_dashboard_need_care_body", locale)}
              </p>
              <Button
                className="mt-4 h-10 w-full rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2]"
                nativeButton={false}
                render={<Link href="/qualification" />}
              >
                {t("start_assessment_cta", locale)}
              </Button>
            </div>
          </div>
        </aside>

        <section className="min-w-0" id="overview">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#e1e9ec] bg-[#f8fbfd]/92 px-4 py-4 backdrop-blur sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7a82]">
                {t("account_dashboard_patient_profile_label", locale)}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#071923]">
                {patientName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <form action={signOut}>
                <SubmitButton variant="outline" className="h-10 rounded-full bg-white px-4">
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">{t("dashboard_sign_out", locale)}</span>
                </SubmitButton>
              </form>
            </div>
          </header>

          <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[1fr_360px]">
            <div className="grid gap-4">
              <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                  <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#e8f7f4] text-3xl font-bold text-[#087a7b]">
                    {patientInitial}
                  </div>
                  <div className="mt-4 text-center">
                    <p className="font-bold text-[#071923]">{patientName}</p>
                    <p className="mt-1 text-sm text-[#64747c]">{patientPhone}</p>
                    <p className="mt-2 rounded-full bg-[#f4f8f9] px-3 py-1.5 text-xs font-bold text-[#083273]">
                      {patientReference}
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <MiniStat label={t("account_dashboard_stat_visits", locale)} value={String(appointments.length)} />
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
                  <p className="mt-3 text-sm leading-6 text-[#4d5960]">
                    {t("account_dashboard_care_summary_empty", locale)}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#087a7b]">
                    <ShieldCheck className="size-4" />
                    {t("account_dashboard_doctor_signoff_required", locale)}
                  </div>
                </article>
              </section>

              <section id="doctors" className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_available_doctors_title", locale)}</p>
                    <p className="mt-1 text-sm text-[#64747c]">{t("account_dashboard_available_doctors_body", locale)}</p>
                  </div>
                  <Button variant="outline" className="h-9 rounded-full bg-white" nativeButton={false} render={<Link href="/doctors" />}>
                    {t("doctors_preview_see_all", locale)}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {featuredDoctors.length > 0 ? (
                    featuredDoctors.map((provider) => <DoctorMiniCard key={provider.id} provider={provider} locale={locale} />)
                  ) : (
                    <p className="text-sm text-[#64747c] md:col-span-3">{t("account_dashboard_no_doctors_available", locale)}</p>
                  )}
                </div>
              </section>

              <section id="history" className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
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
            </div>

            <aside className="grid h-fit gap-4">
              <section id="book-a-call" className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_nav_book", locale)}</p>
                    <p className="mt-1 text-sm text-[#64747c]">{t("account_dashboard_find_doctor_fast_body", locale)}</p>
                  </div>
                  <Search className="size-5 text-[#01b7bb]" />
                </div>
                <div className="mt-4 grid gap-2">
                  <Button className="h-11 rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2]" nativeButton={false} render={<Link href="/qualification" />}>
                    {t("start_assessment_cta", locale)}
                  </Button>
                  <Button variant="outline" className="h-11 rounded-full bg-white font-bold text-[#083273]" nativeButton={false} render={<Link href="/doctors" />}>
                    {t("account_dashboard_browse_doctors", locale)}
                  </Button>
                </div>
              </section>

              <section id="payments" className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_nav_payments", locale)}</p>
                  <p className="text-sm font-bold text-[#083273]">
                    TZS {paidTotal.toLocaleString("en-TZ")}
                  </p>
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

              <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_pharmacy_title", locale)}</p>
                  <Pill className="size-5 text-[#01b7bb]" />
                </div>
                <div className="mt-4 grid gap-3">
                  {pharmacyOrdersData && pharmacyOrdersData.length > 0 ? (
                    pharmacyOrdersData.map((order) => (
                      <div key={order.id} className="rounded-2xl bg-[#f8fbfd] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#071923]">
                              TZS {order.total_amount} ·{" "}
                              {t(
                                fulfillmentMethodKey[order.fulfillment_method as keyof typeof fulfillmentMethodKey] ??
                                  "checkout_delivery",
                                locale
                              )}
                            </p>
                            <p className="mt-1 text-xs text-[#64747c]">{formatDateTime(order.created_at, locale)}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(order.status)}`}>
                            {t(
                              pharmacyOrderStatusKey[order.status as keyof typeof pharmacyOrderStatusKey] ??
                                pharmacyOrderStatusKey.pending,
                              locale
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#64747c]">{t("account_dashboard_no_pharmacy_orders", locale)}</p>
                  )}
                </div>
              </section>

              <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_labs_files_title", locale)}</p>
                  <FlaskConical className="size-5 text-[#01b7bb]" />
                </div>
                <div className="mt-4 grid gap-2">
                  {labOrdersData && labOrdersData.length > 0 ? (
                    labOrdersData.map((order) => (
                      <div key={order.id} className="rounded-2xl bg-[#f8fbfd] p-3">
                        <p className="text-sm font-semibold text-[#071923]">
                          {order.reason ?? t("account_dashboard_lab_order_fallback", locale)}
                        </p>
                        <p className="mt-1 text-xs text-[#64747c]">
                          {order.lab_locations?.name ?? t("account_dashboard_partner_lab_fallback", locale)}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(order.status)}`}>
                            {t(
                              adminLabOrderStatusKey[order.status as keyof typeof adminLabOrderStatusKey] ??
                                adminLabOrderStatusKey.ordered,
                              locale
                            )}
                          </span>
                          {order.map_url ? (
                            <Link href={order.map_url} className="text-xs font-bold text-[#083273]">
                              {t("account_dashboard_open_map", locale)}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#64747c]">{t("account_dashboard_no_lab_orders", locale)}</p>
                  )}
                </div>
                <div id="files" className="mt-3 grid gap-2">
                  {attachmentFiles && attachmentFiles.length > 0 ? (
                    attachmentFiles.map((file) => {
                      const Icon = attachmentIcon(file.attachment_kind);
                      const url = signedUrlByPath.get(file.storage_path);
                      return (
                        <a
                          key={file.id}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-2 rounded-xl bg-[#f8fbfd] px-3 py-2 text-sm hover:bg-[#eef4f5]"
                        >
                          <span className="flex min-w-0 items-center gap-2 font-medium text-[#071923]">
                            <Icon className="size-4 shrink-0 text-[#64747c]" />
                            <span className="truncate">{file.original_filename ?? t("account_dashboard_file_fallback", locale)}</span>
                          </span>
                          <span className="shrink-0 text-xs text-[#64747c]">
                            {t(
                              fileKindKey[file.attachment_kind as keyof typeof fileKindKey] ??
                                "account_dashboard_file_kind_document",
                              locale
                            )}
                          </span>
                        </a>
                      );
                    })
                  ) : (
                    <p className="px-1 text-sm text-[#64747c]">{t("account_dashboard_no_files_uploaded", locale)}</p>
                  )}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fbfd] px-2 py-3">
      <p className="text-sm font-bold capitalize text-[#071923]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#64747c]">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fbfd] p-3">
      <p className="text-xs font-semibold text-[#64747c]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#071923]">{value}</p>
    </div>
  );
}

function DoctorMiniCard({
  provider,
  locale,
}: {
  provider: ReturnType<typeof mapProviderRow>;
  locale: Locale;
}) {
  return (
    <article className="rounded-2xl border border-[#e1e9ec] bg-[#f8fbfd] p-4">
      <div className="flex items-center gap-3">
        {provider.photoUrl ? (
          <span className="relative flex size-11 shrink-0 overflow-hidden rounded-full bg-[#e8f7f4]">
            <Image src={provider.photoUrl} alt="" fill sizes="44px" className="object-cover" />
          </span>
        ) : (
          <span className="flex size-11 items-center justify-center rounded-full bg-[#083273] text-sm font-bold text-white">
            {provider.name
              .replace("Dr. ", "")
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#071923]">{provider.name}</p>
          <p className="truncate text-xs text-[#64747c]">{provider.specialty}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#64747c]">{provider.nextAvailableAt}</p>
          <p className="mt-0.5 text-sm font-bold text-[#083273]">TZS {provider.price}</p>
        </div>
        <Button
          size="sm"
          className="h-8 rounded-full bg-[#01b7bb] px-3 font-bold text-white hover:bg-[#019ea2]"
          nativeButton={false}
          render={<Link href={`/doctors/${provider.id}`} />}
        >
          {t("account_dashboard_book_button", locale)}
        </Button>
      </div>
    </article>
  );
}
