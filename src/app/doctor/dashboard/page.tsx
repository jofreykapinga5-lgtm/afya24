import Image from "next/image";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, staffRoleKey, staffStatusKey, adminProviderStatusKey } from "@/lib/i18n";
import { getDoctorDashboardContext } from "./doctor-context";
import { patientAccessCutoff, queueHeartbeatCutoff } from "@/lib/video/queue";
import { statusClass } from "./status-class";
import { DoctorPasswordForm } from "./password-form";
import { DoctorProfileForm } from "./profile-form";

export default async function DoctorOverviewPage() {
  const locale = await getServerLocale();
  const { user, profile, provider, canManageAvailability, service } = await getDoctorDashboardContext();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const [{ count: queueCount }, { count: completedToday }, { count: openSlotsCount }] = provider
    ? await Promise.all([
        service
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", provider.id)
          .eq("payment_status", "paid")
          .in("status", ["waiting", "in_progress"])
          .gte("scheduled_at", patientAccessCutoff())
          .gte("queue_last_seen_at", queueHeartbeatCutoff()),
        service
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", provider.id)
          .eq("status", "completed")
          .gte("scheduled_at", todayStart.toISOString())
          .lt("scheduled_at", tomorrowStart.toISOString()),
        service
          .from("provider_availability_slots")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", provider.id)
          .eq("status", "open"),
      ])
    : [{ count: 0 }, { count: 0 }, { count: 0 }];

  const doctorName = provider?.full_name ?? user.email ?? "Doctor";
  const specialty = provider?.specialty ?? "Provider profile pending";
  const doctorBio = provider?.bio ?? "";
  const doctorPhotoUrl = provider?.photo_url ?? "";
  const doctorPhone = provider?.phone ?? "";

  return (
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
          <MiniStat
            label={t("doctor_dashboard_stat_queue", locale)}
            value={String(queueCount ?? 0)}
            href="/doctor/dashboard/patients#queue"
          />
          <MiniStat
            label={t("doctor_dashboard_stat_done", locale)}
            value={String(completedToday ?? 0)}
            href="/doctor/dashboard/patients#completed"
          />
          <MiniStat label={t("doctor_dashboard_stat_slots", locale)} value={String(openSlotsCount ?? 0)} />
        </div>
      </article>

      <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#071923]">{t("doctor_dashboard_provider_info_title", locale)}</p>
            <p className="mt-1 text-sm text-[#64747c]">{t("doctor_dashboard_provider_info_body", locale)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(profile?.status ?? "pending")}`}>
            {profile?.status ? t(staffStatusKey[profile.status], locale) : t("doctor_dashboard_missing_badge", locale)}
          </span>
        </div>

        {profile ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow label={t("doctor_dashboard_role", locale)} value={t(staffRoleKey[profile.role], locale)} />
            <InfoRow label={t("doctor_dashboard_status", locale)} value={t(staffStatusKey[profile.status], locale)} />
            <InfoRow
              label={t("doctor_dashboard_profile_status_label", locale)}
              value={
                provider?.profile_status
                  ? t(
                      adminProviderStatusKey[provider.profile_status as keyof typeof adminProviderStatusKey] ??
                        adminProviderStatusKey.pending,
                      locale
                    )
                  : t("doctor_dashboard_missing_provider", locale)
              }
            />
            <InfoRow
              label={t("doctor_dashboard_available_now_label", locale)}
              value={provider?.available_now ? t("doctor_dashboard_yes", locale) : t("doctor_dashboard_no", locale)}
            />
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-[#fff6df] p-4 text-sm text-[#9a6500]">
            {t("doctor_dashboard_no_profile", locale)} public.users {t("doctor_dashboard_with_role", locale)}
          </p>
        )}

        {canManageAvailability ? (
          <DoctorProfileForm bio={doctorBio} photoUrl={doctorPhotoUrl} phone={doctorPhone} />
        ) : null}
      </article>

      {canManageAvailability ? (
        <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
          <p className="text-sm font-bold text-[#071923]">{t("doctor_dashboard_password_title", locale)}</p>
          <p className="mt-1 text-sm text-[#64747c]">{t("doctor_dashboard_password_body", locale)}</p>
          <DoctorPasswordForm />
        </article>
      ) : null}
    </section>
  );
}

function MiniStat({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <p className="text-sm font-bold capitalize text-[#071923]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#64747c]">{label}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl bg-[#f8fbfd] px-2 py-3 outline-none transition-colors hover:bg-[#e8f7f4] focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {content}
      </Link>
    );
  }

  return <div className="rounded-2xl bg-[#f8fbfd] px-2 py-3">{content}</div>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fbfd] p-3">
      <p className="text-xs font-semibold text-[#64747c]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#071923]">{value}</p>
    </div>
  );
}
