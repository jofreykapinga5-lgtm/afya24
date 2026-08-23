"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export interface AdminNavItem {
  label: string;
  href: string;
  // Pre-rendered by the server component, not a component reference --
  // Lucide icon *functions* can't cross the server/client props boundary
  // ("Functions cannot be passed directly to Client Components"), but an
  // already-rendered element can, the same way any server-rendered JSX can
  // be handed to a Client Component as children.
  icon: ReactNode;
}

// The sidebar/menu links live in the server-rendered page shell, while the
// actual selected tab is client state inside <AdminDashboard>. The hash is
// the one thing both sides already agree on -- AdminDashboard's selectTab()
// writes it via history.replaceState (so switching tabs doesn't spam the
// back button) and manually fires a "hashchange" event since replaceState
// doesn't dispatch one on its own; this list listens for that same event to
// stay in sync, whether the tab changed via one of these links or via a
// quick-action button elsewhere on the page.
export function AdminNavList({
  items,
  variant,
}: {
  items: AdminNavItem[];
  variant: "sidebar" | "menu";
}) {
  // Starts on the first item on every render, server and client alike, so
  // hydration never disagrees -- window.location.hash isn't available
  // during SSR, and reading it in the initial client render (instead of an
  // effect) would make the first client render diverge from the server
  // markup, which is exactly the hydration-mismatch failure mode this app
  // has already been bitten by elsewhere.
  const [activeHref, setActiveHref] = useState(items[0]?.href ?? "");

  useEffect(() => {
    function sync() {
      const hash = window.location.hash;
      setActiveHref(items.some((item) => item.href === hash) ? hash : items[0]?.href ?? "");
    }
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [items]);

  return (
    <>
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <a
            key={item.label}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              variant === "sidebar"
                ? `flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#e8f7f4] text-[#083273]"
                      : "text-[#60717a] hover:bg-[#f4f8f9] hover:text-[#083273]"
                  }`
                : `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    isActive ? "bg-[#e8f7f4] text-[#083273]" : "hover:bg-[#f4f8f9]"
                  }`
            }
          >
            {item.icon}
            {item.label}
          </a>
        );
      })}
    </>
  );
}
