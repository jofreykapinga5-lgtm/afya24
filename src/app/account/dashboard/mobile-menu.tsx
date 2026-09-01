"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Stethoscope,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { signOut } from "../actions";

// Defined here rather than passed in as a prop: a Server Component can't
// hand a Client Component raw icon component references (React can't
// serialize functions across that boundary), so this list has to be local
// to the client tree instead of built in layout.tsx.
export type PatientMobileMenuItem = {
  label: string;
  href: string;
  icon: "overview" | "book" | "doctors" | "history" | "payments" | "pharmacy" | "files";
};

const menuIcons = {
  overview: LayoutDashboard,
  book: Video,
  doctors: Stethoscope,
  history: History,
  payments: CreditCard,
  pharmacy: Pill,
  files: FileText,
};

export function PatientDashboardMobileMenu({ items }: { items: PatientMobileMenuItem[] }) {
  const locale = useAppStore((state) => state.locale);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tapping the hamburger again is one way to close this, but a menu that
  // opens over the page and only closes by finding the exact same toggle
  // (or navigating away, which loses the "just checking" case) is a real
  // dead end -- this adds an explicit close button plus tapping outside or
  // Escape, matching the pattern site-header.tsx already uses for its own
  // account menu.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
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
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a969c]">
              {t("account_dashboard_menu_title", locale)}
            </span>
            <button
              type="button"
              aria-label={t("account_dashboard_close_menu", locale)}
              onClick={() => setOpen(false)}
              className="flex size-7 items-center justify-center rounded-full text-[#64747c] transition hover:bg-[#f4f8f9] hover:text-[#071923]"
            >
              <X className="size-4" />
            </button>
          </div>
          {items.map((item) => {
            const Icon = menuIcons[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition hover:bg-[#f4f8f9]"
              >
                <Icon className="size-4 text-[#01b7bb]" />
                {item.label}
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
              <SubmitButton variant="outline" className="h-10 w-full rounded-full bg-white">
                <LogOut className="size-4" />
                {t("dashboard_sign_out", locale)}
              </SubmitButton>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
