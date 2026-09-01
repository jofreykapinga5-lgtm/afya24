import type { ReactNode } from "react";
import { getServerLocale } from "@/lib/locale-cookie";
import { toTitleCase } from "@/lib/format-name";
import { t } from "@/lib/i18n";
import { signOut } from "../actions";
import { getPatientDashboardContext } from "./patient-context";
import { PatientDashboardShell } from "./dashboard-shell";
import type { SidebarNavItem } from "./sidebar-nav";

const navItems = [
  { labelKey: "account_dashboard_nav_overview", icon: "overview", href: "/account/dashboard" },
  { labelKey: "account_dashboard_nav_book", icon: "book", href: "/account/dashboard/book-a-call" },
  { labelKey: "account_dashboard_nav_doctors", icon: "doctors", href: "/account/dashboard/doctors" },
  { labelKey: "account_dashboard_nav_history", icon: "history", href: "/account/dashboard/history" },
  { labelKey: "account_dashboard_nav_payments", icon: "payments", href: "/account/dashboard/payments" },
  { labelKey: "account_dashboard_nav_files", icon: "files", href: "/account/dashboard/files" },
] as const;

export default async function AccountDashboardLayout({ children }: { children: ReactNode }) {
  const locale = await getServerLocale();
  const { user, patient } = await getPatientDashboardContext();

  const sidebarItems: SidebarNavItem[] = navItems.map((item) => ({
    label: t(item.labelKey, locale),
    icon: item.icon,
    href: item.href,
  }));
  const patientName = (patient?.full_name ? toTitleCase(patient.full_name) : null) ?? user.email ?? "Patient";

  return (
    <PatientDashboardShell
      sidebarItems={sidebarItems}
      mobileNavItems={sidebarItems}
      patientName={patientName}
      eyebrowLabel={t("account_dashboard_patient_profile_label", locale)}
      signOutLabel={t("dashboard_sign_out", locale)}
      routingTitle={t("account_dashboard_need_care_title", locale)}
      routingBody={t("account_dashboard_need_care_body", locale)}
      ctaLabel={t("start_assessment_cta", locale)}
      onSignOut={signOut}
    >
      {children}
    </PatientDashboardShell>
  );
}
