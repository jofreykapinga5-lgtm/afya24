import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, adminProviderStatusKey } from "@/lib/i18n";
import { signOut } from "../actions";
import { getDoctorDashboardContext } from "./doctor-context";
import { statusClass } from "./status-class";
import { DoctorSidebarNav, type SidebarNavItem } from "./sidebar-nav";
import { DoctorDashboardMobileMenu, type DoctorMobileMenuItem } from "./mobile-menu";

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
  const mobileNavItems: DoctorMobileMenuItem[] = sidebarItems;
  const doctorName = provider?.full_name ?? user.email ?? "Doctor";

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

            <DoctorSidebarNav items={sidebarItems} />

            <div className="mt-10 rounded-[1.35rem] bg-[#f4f8f9] p-4 ring-1 ring-[#dfe8eb] lg:mt-auto">
              <p className="text-sm font-bold text-[#083273]">{t("doctor_dashboard_routing_title", locale)}</p>
              <p className="mt-2 text-xs leading-5 text-[#60717a]">
                {t("doctor_dashboard_routing_body", locale)}
              </p>
              <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass(provider?.profile_status ?? "pending")}`}>
                {t(
                  adminProviderStatusKey[provider?.profile_status as keyof typeof adminProviderStatusKey] ??
                    adminProviderStatusKey.pending,
                  locale
                )}
              </span>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#e1e9ec] bg-[#f8fbfd]/92 px-4 py-4 backdrop-blur sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7a82]">
                {t("doctor_dashboard_eyebrow", locale)}
              </p>
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

          <div className="p-4 sm:p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
