"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "../actions";

type DoctorMobileMenuItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function DoctorDashboardMobileMenu({ items }: { items: DoctorMobileMenuItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Open doctor menu"
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
                key={item.label}
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
            <form action={signOut}>
              <Button type="submit" variant="outline" className="h-10 w-full rounded-full bg-white">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
