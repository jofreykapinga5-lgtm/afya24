import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  ClipboardList,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  ScrollText,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminDashboard, type AdminTab } from "@/components/admin/admin-dashboard";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, staffRoleKey, staffStatusKey } from "@/lib/i18n";
import type { AppointmentPaymentRow } from "@/components/admin/payments-panel";
import {
  appointments,
  auditLogs,
  labLocations,
  labOrders,
  pharmacyItems,
  pharmacyOrders,
  serviceCategories,
  services,
} from "@/lib/mock-data";
import { signOut } from "../actions";

type DbProviderRow = {
  id: string;
  full_name: string;
  specialty: string;
  credentials: string | null;
  license_number: string | null;
  bio: string | null;
  profile_status: string;
  languages: string[] | null;
  created_at: string;
  rating_summary: { rating?: number; reviewCount?: number } | null;
};

type PaymentAppointmentRow = {
  id: string;
  scheduled_at: string;
  payment_status: string;
  price: number | string | null;
  currency: string | null;
  patients: { full_name: string; hospital_reference_number: string } | null;
  providers: { full_name: string } | null;
};

const navItems = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Doctors", href: "#providers", icon: Stethoscope },
  { label: "Services", href: "#services", icon: ClipboardList },
  { label: "Appointments", href: "#appointments", icon: CalendarClock },
  { label: "Payments", href: "#payments", icon: CreditCard },
  { label: "Pharmacy", href: "#pharmacy", icon: Pill },
  { label: "Labs", href: "#labs", icon: FlaskConical },
  { label: "Audit log", href: "#audit", icon: ScrollText },
];

function allowedTabsForRole(role: string | null | undefined): AdminTab[] {
  if (role === "admin") {
    return ["overview", "providers", "services", "appointments", "payments", "pharmacy", "labs", "audit"];
  }
  if (role === "pharmacy_staff") return ["pharmacy"];
  if (role === "lab_staff") return ["labs"];
  if (role === "payment_staff") return ["payments"];
  return [];
}

function roleLabel(role: string, locale: "en" | "sw") {
  if (role in staffRoleKey) {
    return t(staffRoleKey[role as keyof typeof staffRoleKey], locale);
  }
  if (role === "payment_staff") return locale === "sw" ? "Mfanyakazi wa malipo" : "Payment staff";
  return role.replaceAll("_", " ");
}

export default async function AdminDashboardPage() {
  const locale = await getServerLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/doctor");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "doctor") {
    redirect("/doctor/dashboard");
  }

  const allowedTabs = allowedTabsForRole(profile?.role);

  if (profile && allowedTabs.length === 0) {
    redirect("/");
  }

  const visibleNavItems = navItems.filter((item) =>
    item.href === "#overview"
      ? allowedTabs.includes("overview")
      : allowedTabs.includes(item.href.replace("#", "") as AdminTab)
  );

  let adminDataWarning: string | null = null;
  let dbProviders: DbProviderRow[] | null = null;
  let paymentAppointments: PaymentAppointmentRow[] | null = null;

  if (profile) {
    try {
      const service = createServiceClient();
      const providersResult = await service
        .from("providers")
        .select(
          "id, full_name, specialty, credentials, license_number, bio, profile_status, languages, created_at, rating_summary"
        )
        .order("created_at", { ascending: false });

      if (providersResult.error) {
        throw providersResult.error;
      }

      dbProviders = providersResult.data as DbProviderRow[];

      const appointmentsResult = await service
        .from("appointments")
        .select(
          "id, scheduled_at, payment_status, price, currency, patients(full_name, hospital_reference_number), providers(full_name)"
        )
        .order("scheduled_at", { ascending: false })
        .limit(50);

      if (appointmentsResult.error) {
        throw appointmentsResult.error;
      }

      paymentAppointments = appointmentsResult.data as unknown as PaymentAppointmentRow[];
    } catch (error) {
      adminDataWarning =
        error instanceof Error
          ? error.message
          : "Admin data could not be loaded. Check Supabase configuration and migrations.";
    }
  }

  const mappedProviders =
    dbProviders
      ? dbProviders.map((provider) => ({
          id: provider.id,
          name: provider.full_name,
          specialty: provider.specialty,
          credentials: provider.credentials ?? "Credentials pending",
          rating: Number((provider.rating_summary as { rating?: number } | null)?.rating ?? 0),
          reviewCount: Number(
            (provider.rating_summary as { reviewCount?: number } | null)?.reviewCount ?? 0
          ),
          languages: (provider.languages?.length ? provider.languages : ["sw", "en"]) as (
            | "en"
            | "sw"
          )[],
          price: 0,
          consultationModes: ["chat", "voice", "video"] as ("chat" | "voice" | "video")[],
          nextAvailableAt: "Set availability",
          isAvailableNow: false,
          photoUrl: "",
          bio: provider.bio ?? "Provider profile created by Afya24 admin.",
          timeSlots: [],
        }))
      : [];

  // Real, honest data -- no mock fallback. An admin needs to be able to
  // trust that "no payments" means no payments, not "the DB happened to be
  // empty so we're showing you seven fake ones instead."
  const realPayments: AppointmentPaymentRow[] = (paymentAppointments ?? []).map((appointment) => ({
    id: appointment.id,
    scheduledAt: appointment.scheduled_at,
    status: appointment.payment_status as AppointmentPaymentRow["status"],
    price: Number(appointment.price ?? 0),
    currency: appointment.currency ?? "TZS",
    // patients/providers are many-to-one FKs, so PostgREST embeds each as a
    // single object -- confirmed against the real API response, not just
    // the untyped client's generic (and here, misleading) inferred shape.
    patientName: (appointment.patients as unknown as { full_name: string } | null)?.full_name ?? "Patient",
    patientReference:
      (appointment.patients as unknown as { hospital_reference_number: string } | null)
        ?.hospital_reference_number ?? "—",
    providerName: (appointment.providers as unknown as { full_name: string } | null)?.full_name ?? "Doctor",
  }));

  const mappedProviderMeta =
    dbProviders
      ? dbProviders.map((provider) => ({
          providerId: provider.id,
          status: provider.profile_status as "active" | "pending" | "suspended",
          licenseNumber: provider.license_number ?? "Not set",
          appointmentsThisWeek: 0,
          joinedAt: new Date(provider.created_at).toLocaleDateString("en-TZ", {
            month: "short",
            year: "numeric",
          }),
        }))
      : [];

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

        <details className="group relative">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full bg-[#e8f7f4] text-[#083273] outline-none transition hover:bg-[#d8f3ef] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/30">
            <Menu className="size-5" />
            <span className="sr-only">Open admin menu</span>
          </summary>
          <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl bg-white p-2 text-[#071923] shadow-[0_24px_60px_-28px_rgba(8,50,115,0.75)] ring-1 ring-[#dfe8eb]">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition hover:bg-[#f4f8f9]"
                >
                  <Icon className="size-4 text-[#01b7bb]" />
                  {item.label}
                </a>
              );
            })}
          </div>
        </details>
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
              {visibleNavItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
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
              <p className="text-sm font-bold text-[#083273]">Admin control</p>
              <p className="mt-2 text-xs leading-5 text-[#60717a]">
                Doctors, payments, pharmacy, labs, and audit trails stay in one workspace.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#087a7b]">
                <ShieldCheck className="size-4" />
                Staff access verified
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0" id="overview">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#e1e9ec] bg-[#f8fbfd]/92 px-4 py-4 backdrop-blur sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7a82]">
                Admin dashboard
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#071923]">
                {t("admin_dashboard_title", locale)}
              </h1>
              <p className="mt-1 hidden text-sm text-[#64747c] md:block">
                {t("admin_dashboard_subtitle", locale)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {profile && (
                <div className="hidden text-right text-sm sm:block">
                  <p className="font-bold text-[#071923]">{user.email}</p>
                  <p className="text-xs text-[#64747c]">
                    {roleLabel(profile.role, locale)} · {t(staffStatusKey[profile.status], locale)}
                  </p>
                </div>
              )}
              <form action={signOut}>
                <Button type="submit" variant="outline" className="h-10 rounded-full bg-white px-4">
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">{t("dashboard_sign_out", locale)}</span>
                </Button>
              </form>
            </div>
          </header>

          <div className="p-4 sm:p-6">
            {adminDataWarning ? (
              <div className="mb-4 rounded-[1.1rem] bg-[#fff4f0] p-4 text-sm text-[#9b2c12] ring-1 ring-[#ffd4c6]">
                <p className="font-bold">Admin data could not load.</p>
                <p className="mt-1">
                  {adminDataWarning}
                </p>
                <p className="mt-2 text-xs text-[#9b2c12]/80">
                  Check Vercel Supabase environment variables and make sure the latest database
                  migrations are applied.
                </p>
              </div>
            ) : null}

            {profile ? (
              <div id="admin-tabs">
                <AdminDashboard
                  locale={locale}
                  allowedTabs={allowedTabs}
                  providers={mappedProviders}
                  providerMeta={mappedProviderMeta}
                  serviceCategories={serviceCategories}
                  services={services}
                  appointments={appointments}
                  payments={realPayments}
                  pharmacyItems={pharmacyItems}
                  pharmacyOrders={pharmacyOrders}
                  labOrders={labOrders}
                  labLocations={labLocations}
                  auditLogs={auditLogs}
                />
              </div>
            ) : (
              <div className="rounded-[1.35rem] bg-white p-6 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <p className="text-sm text-[#64747c]">
                  {t("doctor_dashboard_no_profile", locale)}{" "}
                  <code className="rounded bg-[#f4f8f9] px-1.5 py-0.5 text-xs">public.users</code>{" "}
                  {t("doctor_dashboard_with_role", locale)}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
