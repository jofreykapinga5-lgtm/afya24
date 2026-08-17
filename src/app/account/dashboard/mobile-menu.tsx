"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Stethoscope,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { signOut } from "../actions";

// Defined here rather than passed in as a prop: a Server Component can't
// hand a Client Component raw icon component references (React can't
// serialize functions across that boundary -- it throws "Functions cannot
// be passed directly to Client Components"), so this list has to be local
// to the client tree instead of built in dashboard/page.tsx.
const items = [
  { labelKey: "account_dashboard_nav_overview", href: "#overview", icon: LayoutDashboard },
  { labelKey: "account_dashboard_nav_book", href: "#book-a-call", icon: Video },
  { labelKey: "account_dashboard_nav_doctors", href: "#doctors", icon: Stethoscope },
  { labelKey: "account_dashboard_nav_history", href: "#history", icon: History },
  { labelKey: "account_dashboard_nav_payments", href: "#payments", icon: CreditCard },
  { labelKey: "account_dashboard_nav_files", href: "#files", icon: FileText },
] as const;

export function PatientDashboardMobileMenu() {
  const locale = useAppStore((state) => state.locale);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("account_dashboard_open_menu", locale)}
        onClick={() => setOpen((current) => !current)}
        className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full bg-[#e8f7f4] text-[#083273] outline-none transition hover:bg-[#d8f3ef] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/30"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl bg-white p-2 text-[#071923] shadow-[0_24px_60px_-28px_rgba(8,50,115,0.75)] ring-1 ring-[#dfe8eb]">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition hover:bg-[#f4f8f9]"
              >
                <Icon className="size-4 text-[#01b7bb]" />
                {t(item.labelKey, locale)}
              </Link>
            );
          })}
          <div className="mt-1 border-t border-[#e1e9ec] p-2">
            <Button
              className="h-10 w-full rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2]"
              nativeButton={false}
              render={<Link href="/qualification" onClick={() => setOpen(false)} />}
            >
              {t("start_assessment_cta", locale)}
            </Button>
            <form action={signOut} className="mt-2">
              <Button type="submit" variant="outline" className="h-10 w-full rounded-full bg-white">
                <LogOut className="size-4" />
                {t("dashboard_sign_out", locale)}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
