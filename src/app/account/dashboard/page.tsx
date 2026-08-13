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
import { createClient } from "@/lib/supabase/server";
import { getDefaultService } from "@/lib/default-service";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, appointmentStatusKey } from "@/lib/i18n";
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
  { label: "Overview", icon: LayoutDashboard },
  { label: "Book a call", icon: Video },
  { label: "Doctors", icon: Stethoscope },
  { label: "History", icon: History },
  { label: "Payments", icon: CreditCard },
  { label: "Files", icon: FileText },
];

const mobileNavItems = navItems.map((item, index) => ({
  ...item,
  href: index === 0 ? "#overview" : `#${item.label.toLowerCase().replaceAll(" ", "-")}`,
}));

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

function prettyStatus(status: string) {
  return status.replaceAll("_", " ");
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

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, hospital_reference_number, phone, date_of_birth, gender")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: liveAppointments } = patient
    ? await supabase
        .from("appointments")
        .select(
          "id, scheduled_at, status, payment_status, price, currency, providers(full_name, specialty), consultation_orders(consultation_mode)"
        )
        .eq("patient_id", patient.id)
        .order("scheduled_at", { ascending: false })
        .returns<DbAppointment[]>()
    : { data: [] };

  const { data: pharmacyOrdersData } = patient
    ? await supabase
        .from("pharmacy_orders")
        .select("id, status, fulfillment_method, total_amount, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(5)
        .returns<DbPharmacyOrder[]>()
    : { data: [] };

  const { data: labOrdersData } = patient
    ? await supabase
        .from("lab_orders")
        .select("id, status, reason, map_url, lab_locations(name)")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(5)
        .returns<DbLabOrder[]>()
    : { data: [] };

  const { data: attachmentFiles } = patient
    ? await supabase
        .from("files")
        .select("id, original_filename, attachment_kind, storage_path, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(6)
        .returns<DbFile[]>()
    : { data: [] };

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

  const defaultService = await getDefaultService(supabase).catch(() => null);
  const { data: providerRows } = await supabase
    .from("providers")
    .select(
      "id, full_name, specialty, credentials, bio, photo_url, languages, rating_summary, available_now, consultation_modes"
    )
    .eq("profile_status", "active")
    .eq("available_now", true)
    .order("available_now", { ascending: false })
    .limit(3);
  const featuredDoctors = ((providerRows ?? []) as ProviderRow[]).map((row) =>
    mapProviderRow(row, defaultService?.basePrice ?? 0, locale)
  );

  const patientName = patient?.full_name ?? user.email ?? "Patient";
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

        <PatientDashboardMobileMenu items={mobileNavItems} />
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
                    key={item.label}
                    href={index === 0 ? "#overview" : `#${item.label.toLowerCase().replaceAll(" ", "-")}`}
                    className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
                      index === 0
                        ? "bg-[#e8f7f4] text-[#083273]"
                        : "text-[#60717a] hover:bg-[#f4f8f9] hover:text-[#083273]"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <div className="mt-10 rounded-[1.35rem] bg-[#f4f8f9] p-4 ring-1 ring-[#dfe8eb] lg:mt-auto">
              <p className="text-sm font-bold text-[#083273]">Need care now?</p>
              <p className="mt-2 text-xs leading-5 text-[#60717a]">
                Start with Afya24 intake, then choose an available doctor.
              </p>
              <Button
                className="mt-4 h-10 w-full rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2]"
                nativeButton={false}
                render={<Link href="/qualification" />}
              >
                Start intake
              </Button>
            </div>
          </div>
        </aside>

        <section className="min-w-0" id="overview">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#e1e9ec] bg-[#f8fbfd]/92 px-4 py-4 backdrop-blur sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7a82]">Patient profile</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#071923]">
                {patientName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <form action={signOut}>
                <Button variant="outline" type="submit" className="h-10 rounded-full bg-white px-4">
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">{t("dashboard_sign_out", locale)}</span>
                </Button>
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
                    <MiniStat label="Visits" value={String(appointments.length)} />
                    <MiniStat label="Age" value={patientAge !== null ? String(patientAge) : "—"} />
                    <MiniStat label="Sex" value={patient?.gender ?? "—"} />
                  </div>
                </article>

                <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#071923]">General information</p>
                      <p className="mt-1 text-sm text-[#64747c]">Your active Afya24 care file.</p>
                    </div>
                    <span className="rounded-full bg-[#e8f7f4] px-3 py-1 text-xs font-bold text-[#087a7b]">
                      Active
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoRow label="Reference number" value={patientReference} />
                    <InfoRow label="Phone" value={patientPhone} />
                    <InfoRow label="Date of birth" value={patient?.date_of_birth ?? "Not recorded"} />
                    <InfoRow label="Language" value={locale === "sw" ? "Kiswahili" : "English"} />
                  </div>
                </article>
              </section>

              <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#071923]">Next session</p>
                      <p className="mt-1 text-sm text-[#64747c]">Join, chat, or reschedule your active visit.</p>
                    </div>
                    <CalendarClock className="size-5 text-[#01b7bb]" />
                  </div>
                  <div className="mt-5 rounded-2xl bg-[#f4f8fb] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#071923]">
                          {nextAppointment?.providers?.specialty ?? "General consultation"}
                        </p>
                        <p className="mt-1 text-sm text-[#64747c]">
                          {nextAppointment?.providers?.full_name ?? "Available doctor"}
                          {nextAppointment ? ` · ${formatDateTime(nextAppointment.scheduled_at, locale)}` : " · Choose a time"}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(nextAppointment?.status ?? "scheduled")}`}>
                        {prettyStatus(nextAppointment?.status ?? "scheduled")}
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
                        Join call
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 rounded-full bg-white px-4 font-bold text-[#083273]"
                        nativeButton={false}
                        render={<Link href="/doctors" />}
                      >
                        Book a call
                      </Button>
                    </div>
                  </div>
                </article>

                <article className="rounded-[1.35rem] bg-[#e8f7f4] p-5 text-[#071923] shadow-[0_14px_40px_-35px_rgba(8,50,115,0.45)] ring-1 ring-[#ccece7]">
                  <p className="text-sm font-bold text-[#083273]">Care summary</p>
                  <p className="mt-3 text-sm leading-6 text-[#4d5960]">
                    No signed visit summary yet. Your doctor shares one here after your consultation.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#087a7b]">
                    <ShieldCheck className="size-4" />
                    Doctor sign-off required before anything appears here
                  </div>
                </article>
              </section>

              <section id="doctors" className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#071923]">Available doctors</p>
                    <p className="mt-1 text-sm text-[#64747c]">Doctors you can book for voice or video.</p>
                  </div>
                  <Button variant="outline" className="h-9 rounded-full bg-white" nativeButton={false} render={<Link href="/doctors" />}>
                    See all
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {featuredDoctors.length > 0 ? (
                    featuredDoctors.map((provider) => <DoctorMiniCard key={provider.id} provider={provider} />)
                  ) : (
                    <p className="text-sm text-[#64747c] md:col-span-3">No doctors available right now.</p>
                  )}
                </div>
              </section>

              <section id="history" className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#071923]">Session history</p>
                    <p className="mt-1 text-sm text-[#64747c]">Past and upcoming Afya24 visits.</p>
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
                              {appointment.providers?.specialty ?? "Consultation"}
                            </p>
                            <p className="mt-1 text-sm text-[#64747c]">
                              {appointment.providers?.full_name ?? "Doctor"} ·{" "}
                              {formatDateTime(appointment.scheduled_at, locale)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#083273]">
                            <ModeIcon className="size-4 text-[#01b7bb]" />
                            {mode}
                          </div>
                          <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusClass(appointment.status)}`}>
                            {t(appointmentStatusKey[appointment.status as keyof typeof appointmentStatusKey], locale)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="px-4 py-8 text-center text-sm text-[#64747c]">No visits yet.</p>
                  )}
                </div>
              </section>
            </div>

            <aside className="grid h-fit gap-4">
              <section id="book-a-call" className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#071923]">Book a call</p>
                    <p className="mt-1 text-sm text-[#64747c]">Find the right doctor fast.</p>
                  </div>
                  <Search className="size-5 text-[#01b7bb]" />
                </div>
                <div className="mt-4 grid gap-2">
                  <Button className="h-11 rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2]" nativeButton={false} render={<Link href="/qualification" />}>
                    Start with AI intake
                  </Button>
                  <Button variant="outline" className="h-11 rounded-full bg-white font-bold text-[#083273]" nativeButton={false} render={<Link href="/doctors" />}>
                    Browse doctors
                  </Button>
                </div>
              </section>

              <section id="payments" className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[#071923]">Payments</p>
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
                            {appointment.payment_status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#64747c]">{formatDateTime(appointment.scheduled_at, locale)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#64747c]">No payments yet.</p>
                  )}
                </div>
              </section>

              <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[#071923]">Pharmacy</p>
                  <Pill className="size-5 text-[#01b7bb]" />
                </div>
                <div className="mt-4 grid gap-3">
                  {pharmacyOrdersData && pharmacyOrdersData.length > 0 ? (
                    pharmacyOrdersData.map((order) => (
                      <div key={order.id} className="rounded-2xl bg-[#f8fbfd] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#071923]">
                              TZS {order.total_amount} · {order.fulfillment_method}
                            </p>
                            <p className="mt-1 text-xs text-[#64747c]">{formatDateTime(order.created_at, locale)}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(order.status)}`}>
                            {prettyStatus(order.status)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#64747c]">No pharmacy orders yet.</p>
                  )}
                </div>
              </section>

              <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[#071923]">Labs and files</p>
                  <FlaskConical className="size-5 text-[#01b7bb]" />
                </div>
                <div className="mt-4 grid gap-2">
                  {labOrdersData && labOrdersData.length > 0 ? (
                    labOrdersData.map((order) => (
                      <div key={order.id} className="rounded-2xl bg-[#f8fbfd] p-3">
                        <p className="text-sm font-semibold text-[#071923]">{order.reason ?? "Lab order"}</p>
                        <p className="mt-1 text-xs text-[#64747c]">{order.lab_locations?.name ?? "Partner lab"}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(order.status)}`}>
                            {prettyStatus(order.status)}
                          </span>
                          {order.map_url ? (
                            <Link href={order.map_url} className="text-xs font-bold text-[#083273]">
                              Open map
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#64747c]">No lab orders yet.</p>
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
                            <span className="truncate">{file.original_filename ?? "File"}</span>
                          </span>
                          <span className="shrink-0 text-xs text-[#64747c]">{file.attachment_kind}</span>
                        </a>
                      );
                    })
                  ) : (
                    <p className="px-1 text-sm text-[#64747c]">No files uploaded yet.</p>
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

function DoctorMiniCard({ provider }: { provider: ReturnType<typeof mapProviderRow> }) {
  return (
    <article className="rounded-2xl border border-[#e1e9ec] bg-[#f8fbfd] p-4">
      <div className="flex items-center gap-3">
        {provider.photoUrl ? (
          <span className="relative size-11 overflow-hidden rounded-full bg-[#e8f7f4]">
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
          Book
        </Button>
      </div>
    </article>
  );
}
