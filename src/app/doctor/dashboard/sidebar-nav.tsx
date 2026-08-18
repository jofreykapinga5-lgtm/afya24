"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Clock, LayoutDashboard, UsersRound, type LucideIcon } from "lucide-react";

export type SidebarNavItem = { label: string; href: string; icon: "overview" | "availability" | "schedule" | "patients" };

const icons: Record<SidebarNavItem["icon"], LucideIcon> = {
  overview: LayoutDashboard,
  availability: Clock,
  schedule: CalendarClock,
  patients: UsersRound,
};

// Real routes now (see layout.tsx) instead of #anchor scrolling, so the
// active item can be derived from the actual pathname -- the old anchor nav
// always highlighted the first item regardless of scroll position.
export function DoctorSidebarNav({ items }: { items: SidebarNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 grid gap-1.5">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
              active
                ? "bg-[#e8f7f4] text-[#083273]"
                : "text-[#60717a] hover:bg-[#f4f8f9] hover:text-[#083273]"
            }`}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
