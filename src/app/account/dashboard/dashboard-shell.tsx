"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { PatientSidebarNav, type SidebarNavItem } from "./sidebar-nav";
import { PatientDashboardMobileMenu, type PatientMobileMenuItem } from "./mobile-menu";

// Persistent chrome (logo, sidebar, header, sign-out) shared across every
// /account/dashboard page -- mirrors doctor/dashboard/dashboard-shell.tsx.
// Living in layout.tsx means this never remounts between Overview/Book a
// call/Doctors/History/Payments/Files; only {children} swaps.
export function PatientDashboardShell({
  sidebarItems,
  mobileNavItems,
  patientName,
  eyebrowLabel,
  signOutLabel,
  routingTitle,
  routingBody,
  ctaLabel,
  onSignOut,
  children,
}: {
  sidebarItems: SidebarNavItem[];
  mobileNavItems: PatientMobileMenuItem[];
  patientName: string;
  eyebrowLabel: string;
  signOutLabel: string;
  routingTitle: string;
  routingBody: string;
  ctaLabel: string;
  onSignOut: () => void | Promise<void>;
  children: ReactNode;
}) {
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

            <PatientSidebarNav items={sidebarItems} />

            <div className="mt-10 rounded-[1.35rem] bg-[#f4f8f9] p-4 ring-1 ring-[#dfe8eb] lg:mt-auto">
              <p className="text-sm font-bold text-[#083273]">{routingTitle}</p>
              <p className="mt-2 text-xs leading-5 text-[#60717a]">{routingBody}</p>
              <Button
                className="mt-4 h-10 w-full rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2]"
                nativeButton={false}
                render={<Link href="/qualification" />}
              >
                {ctaLabel}
              </Button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#e1e9ec] bg-[#f8fbfd]/92 px-4 py-4 backdrop-blur sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7a82]">{eyebrowLabel}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#071923]">{patientName}</h1>
            </div>
            <form action={onSignOut}>
              <SubmitButton variant="outline" className="h-10 rounded-full bg-white px-4">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">{signOutLabel}</span>
              </SubmitButton>
            </form>
          </header>

          <div className="p-4 sm:p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
