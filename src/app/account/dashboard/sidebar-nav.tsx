"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, FileText, History, LayoutDashboard, Pill, Stethoscope, Video, type LucideIcon } from "lucide-react";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: "overview" | "book" | "doctors" | "history" | "payments" | "pharmacy" | "files";
};

const icons: Record<SidebarNavItem["icon"], LucideIcon> = {
  overview: LayoutDashboard,
  book: Video,
  doctors: Stethoscope,
  history: History,
  payments: CreditCard,
  pharmacy: Pill,
  files: FileText,
};

// Real routes, not #anchor scrolling -- each item is its own page under
// /account/dashboard now, so the active one is derived from the actual
// pathname instead of always highlighting the first item regardless of
// scroll position (same fix already applied to the doctor dashboard's own
// sidebar -- see DoctorSidebarNav).
export function PatientSidebarNav({ items }: { items: SidebarNavItem[] }) {
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
