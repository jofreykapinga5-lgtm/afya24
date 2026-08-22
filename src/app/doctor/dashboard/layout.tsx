import type { ReactNode } from "react";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, adminProviderStatusKey } from "@/lib/i18n";
import { signOut } from "../actions";
import { getDoctorDashboardContext } from "./doctor-context";
import { statusClass } from "./status-class";
import { DoctorDashboardShell } from "./dashboard-shell";
import type { SidebarNavItem } from "./sidebar-nav";

const navItems = [
  { labelKey: "doctor_dashboard_nav_overview", icon: "overview", href: "/doctor/dashboard" },
  { labelKey: "doctor_dashboard_nav_availability", icon: "availability", href: "/doctor/dashboard/availability" },
  { labelKey: "doctor_dashboard_nav_schedule", icon: "schedule", href: "/doctor/dashboard/schedule" },
  { labelKey: "doctor_dashboard_nav_patients", icon: "patients", href: "/doctor/dashboard/patients" },
] as const;

export default async function DoctorDashboardLayout({ children }: { children: ReactNode }) {
  const locale = await getServerLocale();
  const { user, provider } = await getDoctorDashboardContext();

  const sidebarItems: SidebarNavItem[] = navItems.map((item) => ({
    label: t(item.labelKey, locale),
    icon: item.icon,
    href: item.href,
  }));
  const doctorName = provider?.full_name ?? user.email ?? "Doctor";

  return (
    <DoctorDashboardShell
      sidebarItems={sidebarItems}
      mobileNavItems={sidebarItems}
      doctorName={doctorName}
      eyebrowLabel={t("doctor_dashboard_eyebrow", locale)}
      signOutLabel={t("dashboard_sign_out", locale)}
      routingTitle={t("doctor_dashboard_routing_title", locale)}
      routingBody={t("doctor_dashboard_routing_body", locale)}
      statusLabel={t(
        adminProviderStatusKey[provider?.profile_status as keyof typeof adminProviderStatusKey] ??
          adminProviderStatusKey.pending,
        locale
      )}
      statusClassName={statusClass(provider?.profile_status ?? "pending")}
      onSignOut={signOut}
    >
      {children}
    </DoctorDashboardShell>
  );
}
