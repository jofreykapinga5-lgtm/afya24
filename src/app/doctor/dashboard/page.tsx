import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { listRoomParticipantIdentities } from "@/lib/video/livekit";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, staffRoleKey, staffStatusKey } from "@/lib/i18n";
import {
  cancelAvailabilitySlot,
  createAvailabilitySlot,
  signOut,
} from "../actions";
import { DoctorAvailabilityForm } from "./availability-form";
import { DoctorDashboardMobileMenu, type DoctorMobileMenuItem } from "./mobile-menu";
import { DoctorProfileForm } from "./profile-form";
import { DoctorVideoQueue } from "./video-queue";

type ProviderRow = {
  id: string;
  full_name: string;
  specialty: string;
  bio: string | null;
  photo_url: string | null;
  profile_status: string;
  available_now?: boolean | null;
  availability_note?: string | null;
  consultation_modes?: string[] | null;
};

type AvailabilitySlot = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  slot_type?: string | null;
  consultation_modes?: string[] | null;
  note?: string | null;
};

type WaitingAppointment = {
  id: string;
  scheduled_at: string;
  // ai_summaries.appointment_id and consultation_orders.appointment_id have
  // no unique constraint, so PostgREST embeds these as arrays, not objects.
  // files is a genuine one-to-many relationship, so it's an array too.
  patients: { full_name: string; hospital_reference_number: string } | null;
  ai_summaries: { summary_text: string; urgency_level: string }[] | null;
  consultation_orders: { consultation_mode: string }[] | null;
  video_sessions: { room_name: string | null; status: string | null }[] | null;
  files: { id: string; original_filename: string | null; attachment_kind: string | null; storage_path: string }[] | null;
};

const navItems = [
  { label: "Overview", icon: LayoutDashboard, iconKey: "overview" },
  { label: "Availability", icon: Clock, iconKey: "availability" },
  { label: "Schedule", icon: CalendarClock, iconKey: "schedule" },
  { label: "Patients", icon: UsersRound, iconKey: "patients" },
  { label: "Notes", icon: FileText, iconKey: "notes" },
];

const mobileNavItems: DoctorMobileMenuItem[] = navItems.map((item, index) => ({
  label: item.label,
  icon: item.iconKey as DoctorMobileMenuItem["icon"],
  href: index === 0 ? "#overview" : `#${item.label.toLowerCase()}`,
}));

function statusClass(status: string) {
  if (status === "active" || status === "available" || status === "scheduled" || status === "paid") {
    return "bg-[#e8f7f4] text-[#087a7b]";
  }
  if (status === "waiting" || status === "pending" || status === "booked") {
    return "bg-[#fff6df] text-[#9a6500]";
  }
  if (status === "suspended" || status === "cancelled" || status === "failed") {
    return "bg-[#fdecec] text-[#b42318]";
  }
  return "bg-[#eef4ff] text-[#083273]";
}

export default async function DoctorDashboardPage() {
  const locale = await getServerLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/doctor");
  }

  const service = createServiceClient();
  const { data: profile } = await service
    .from("users")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  }

  if (profile && profile.role !== "doctor") {
    redirect("/");
  }

  const { data: provider } = profile?.role === "doctor"
    ? await service
        .from("providers")
        .select("id, full_name, specialty, bio, photo_url, profile_status, available_now, availability_note, consultation_modes")
        .eq("user_id", user.id)
        .maybeSingle<ProviderRow>()
    : { data: null };

  const { data: slots } = provider
    ? await service
        .from("provider_availability_slots")
        .select("id, starts_at, ends_at, status, slot_type, consultation_modes, note")
        .eq("provider_id", provider.id)
        .order("starts_at", { ascending: true })
        .limit(12)
        .returns<AvailabilitySlot[]>()
    : { data: [] };

  const { data: waitingAppointments } = provider
    ? await service
        .from("appointments")
        .select(
          "id, scheduled_at, patients(full_name, hospital_reference_number), ai_summaries(summary_text, urgency_level), consultation_orders(consultation_mode), video_sessions(room_name, status), files(id, original_filename, attachment_kind, storage_path)"
        )
        .eq("provider_id", provider.id)
        .in("status", ["waiting", "in_progress"])
        .order("scheduled_at", { ascending: true })
        .returns<WaitingAppointment[]>()
    : { data: [] };

  const videoAppointments = (waitingAppointments ?? []).filter(
    (appointment) =>
      appointment.consultation_orders?.[0]?.consultation_mode === "video" &&
      Boolean(appointment.video_sessions?.[0]?.room_name)
  );

  const patientOnlineByAppointmentId = new Map<string, boolean>();
  await Promise.all(
    videoAppointments.map(async (appointment) => {
      const roomName = appointment.video_sessions?.[0]?.room_name;
      if (!roomName) {
        patientOnlineByAppointmentId.set(appointment.id, false);
        return;
      }

      const participantIds = await listRoomParticipantIdentities(roomName);
      patientOnlineByAppointmentId.set(
        appointment.id,
        participantIds.some((identity) => identity.startsWith("patient-"))
      );
    })
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const { count: completedToday } = provider
    ? await service
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "completed")
        .gte("scheduled_at", todayStart.toISOString())
        .lt("scheduled_at", tomorrowStart.toISOString())
    : { count: 0 };

  // Attachments live in a private bucket -- generate short-lived signed URLs
  // for whatever's in the queue right now rather than making the bucket
  // public. One batch call covers every file across every waiting appointment.
  const allStoragePaths = videoAppointments.flatMap(
    (appointment) => appointment.files?.map((file) => file.storage_path) ?? []
  );
  const signedUrlByPath = new Map<string, string>();
  if (allStoragePaths.length > 0) {
    const { data: signedUrls } = await service.storage
      .from("patient-attachments")
      .createSignedUrls(allStoragePaths, 600);
    signedUrls?.forEach((entry) => {
      if (entry.signedUrl) signedUrlByPath.set(entry.path ?? "", entry.signedUrl);
    });
  }

  const modes = provider?.consultation_modes?.length
    ? provider.consultation_modes
    : ["chat", "voice", "video"];
  const canManageAvailability =
    profile?.role === "doctor" && profile.status === "active" && provider?.profile_status === "active";

  const doctorName = provider?.full_name ?? user.email ?? "Doctor";
  const specialty = provider?.specialty ?? "Provider profile pending";
  const doctorBio = provider?.bio ?? "";
  const doctorPhotoUrl = provider?.photo_url ?? "";
  const initialVideoQueueItems = videoAppointments.map((appointment) => {
    const summary = appointment.ai_summaries?.[0];
    const patientOnline = patientOnlineByAppointmentId.get(appointment.id) ?? false;
    return {
      id: appointment.id,
      scheduledAt: appointment.scheduled_at,
      status: "waiting",
      patientName: appointment.patients?.full_name ?? "Patient",
      patientReference: appointment.patients?.hospital_reference_number ?? "",
      urgencyLevel: summary?.urgency_level ?? "low",
      summaryText: summary?.summary_text ?? "",
      patientOnline,
      files: (appointment.files ?? []).map((file) => ({
        id: file.id,
        name: file.original_filename ?? "File",
        kind: file.attachment_kind ?? "file",
        url: signedUrlByPath.get(file.storage_path) ?? null,
      })),
    };
  });

  return (
    <main className="min-h-[100dvh] bg-[#edf3f6] px-3 py-3 text-[#101820] sm:px-5 lg:px-6">
      <div className="sticky top-0 z-40 mx-auto mb-3 flex w-full max-w-7xl items-center justify-between rounded-2xl border border-[#dfe8eb] bg-white/94 px-4 py-3 shadow-[0_18px_45px_-32px_rgba(8,50,115,0.35)] backdrop-blur lg:hidden">
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

        <DoctorDashboardMobileMenu items={mobileNavItems} />
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
                    href={index === 0 ? "#overview" : `#${item.label.toLowerCase()}`}
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
              <p className="text-sm font-bold text-[#083273]">Doctor routing</p>
              <p className="mt-2 text-xs leading-5 text-[#60717a]">
                Availability controls whether Afya24 can send matched patients to you.
              </p>
              <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass(provider?.profile_status ?? "pending")}`}>
                {provider?.profile_status ?? "pending"}
              </span>
            </div>
          </div>
        </aside>

        <section className="min-w-0" id="overview">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#e1e9ec] bg-[#f8fbfd]/92 px-4 py-4 backdrop-blur sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7a82]">Doctor dashboard</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#071923]">
                {doctorName}
              </h1>
            </div>
            <form action={signOut}>
              <Button variant="outline" type="submit" className="h-10 rounded-full bg-white px-4">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">{t("dashboard_sign_out", locale)}</span>
              </Button>
            </form>
          </header>

          <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[1fr_360px]">
            <div className="grid gap-4">
              <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                  <div className="mx-auto flex size-20 items-center justify-center overflow-hidden rounded-full bg-[#e8f7f4] text-2xl font-bold text-[#087a7b]">
                    {doctorPhotoUrl ? (
                      <Image src={doctorPhotoUrl} alt="" width={96} height={96} className="size-full object-cover" />
                    ) : (
                      <Stethoscope className="size-9" />
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <p className="font-bold text-[#071923]">{doctorName}</p>
                    <p className="mt-1 text-sm text-[#64747c]">{specialty}</p>
                    <p className="mt-2 rounded-full bg-[#f4f8f9] px-3 py-1.5 text-xs font-bold text-[#083273]">
                      {user.email}
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <MiniStat label="Queue" value={String(videoAppointments.length)} />
                    <MiniStat label="Done" value={String(completedToday ?? 0)} />
                    <MiniStat label="Slots" value={String(slots?.length ?? 0)} />
                  </div>
                </article>

                <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#071923]">Provider information</p>
                      <p className="mt-1 text-sm text-[#64747c]">Your active Afya24 staff profile.</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(profile?.status ?? "pending")}`}>
                      {profile?.status ? t(staffStatusKey[profile.status], locale) : "Missing"}
                    </span>
                  </div>

                  {profile ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <InfoRow label={t("doctor_dashboard_role", locale)} value={t(staffRoleKey[profile.role], locale)} />
                      <InfoRow label={t("doctor_dashboard_status", locale)} value={t(staffStatusKey[profile.status], locale)} />
                      <InfoRow label="Profile status" value={provider?.profile_status ?? "Missing provider"} />
                      <InfoRow label="Available now" value={provider?.available_now ? "Yes" : "No"} />
                    </div>
                  ) : (
                    <p className="mt-5 rounded-2xl bg-[#fff6df] p-4 text-sm text-[#9a6500]">
                      {t("doctor_dashboard_no_profile", locale)} public.users {t("doctor_dashboard_with_role", locale)}
                    </p>
                  )}

                  {canManageAvailability ? (
                    <DoctorProfileForm bio={doctorBio} photoUrl={doctorPhotoUrl} />
                  ) : null}
                </article>
              </section>

              <section id="availability" className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#071923]">Availability controls</p>
                    <p className="mt-1 text-sm text-[#64747c]">
                      Control routing, consultation modes, and doctor note.
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
                    Your provider profile must be active before you can manage availability.
                  </div>
                )}
              </section>

              <section id="schedule" className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#071923]">Schedule blocks</p>
                    <p className="mt-1 text-sm text-[#64747c]">
                      Add available time, breaks, or time off.
                    </p>
                  </div>
                  <CalendarClock className="size-5 text-[#01b7bb]" />
                </div>

                {canManageAvailability ? (
                  <form action={createAvailabilitySlot} className="mt-5 grid gap-3 rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb] lg:grid-cols-[1fr_1fr_0.7fr_1fr_auto] lg:items-end">
                    <Field label="Start">
                      <Input name="startsAt" type="datetime-local" required className="rounded-xl bg-white" />
                    </Field>
                    <Field label="End">
                      <Input name="endsAt" type="datetime-local" required className="rounded-xl bg-white" />
                    </Field>
                    <Field label="Type">
                      <select
                        className="h-8 rounded-xl border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        name="slotType"
                        defaultValue="available"
                      >
                        <option value="available">Available</option>
                        <option value="break">Break</option>
                        <option value="time_off">Time off</option>
                      </select>
                    </Field>
                    <Field label="Note">
                      <Input name="note" placeholder="Optional" className="rounded-xl bg-white" />
                    </Field>
                    <div className="hidden">
                      <input name="consultationModes" type="checkbox" value="chat" defaultChecked={modes.includes("chat")} />
                      <input name="consultationModes" type="checkbox" value="voice" defaultChecked={modes.includes("voice")} />
                      <input name="consultationModes" type="checkbox" value="video" defaultChecked={modes.includes("video")} />
                    </div>
                    <Button type="submit" className="h-9 rounded-full bg-[#01b7bb] px-4 font-bold text-white hover:bg-[#019ea2]">
                      Add block
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
                              {slot.slot_type ?? "available"}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(slot.status)}`}>
                              {slot.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#64747c]">
                            {(slot.consultation_modes?.length ? slot.consultation_modes : ["chat", "voice", "video"]).join(", ")}
                            {slot.note ? ` / ${slot.note}` : ""}
                          </p>
                        </div>
                        {canManageAvailability && slot.status !== "cancelled" ? (
                          <form action={cancelAvailabilitySlot}>
                            <input type="hidden" name="slotId" value={slot.id} />
                            <Button type="submit" size="sm" variant="outline" className="rounded-full bg-white">
                              Cancel
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-8 text-center text-sm text-[#64747c]">
                      No schedule blocks yet.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <aside className="grid h-fit gap-4">
              <DoctorVideoQueue initialItems={initialVideoQueueItems} />

              <section id="notes" className="rounded-[1.35rem] bg-[#e8f7f4] p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.45)] ring-1 ring-[#ccece7]">
                <p className="text-sm font-bold text-[#083273]">Doctor workspace</p>
                <p className="mt-3 text-sm leading-6 text-[#4d5960]">
                  Patient summaries, related cases, prescriptions, lab orders, and signed visit summaries are organized here for each visit.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#087a7b]">
                  <ShieldCheck className="size-4" />
                  Doctor approval remains required
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
