"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { locales } from "@/lib/i18n";
import { setLocaleCookie } from "@/lib/locale-cookie.client";
import { TanzaniaFlag, UkFlag } from "@/components/flag-icons";
import { cn } from "@/lib/utils";

function FlagFor({ value }: { value: (typeof locales)[number]["value"] }) {
  return value === "sw" ? <TanzaniaFlag /> : <UkFlag />;
}

export function LanguageToggle() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  function handleChange(value: (typeof locales)[number]["value"]) {
    setLocale(value);
    // Zustand's persisted store only reaches Client Components. Server
    // Components (the auth pages, terms/privacy, etc.) read this
    // cookie instead -- see src/lib/locale-cookie.ts. router.refresh() forces
    // the current route's server-rendered parts to re-read it immediately,
    // rather than waiting for the next navigation.
    setLocaleCookie(value);
    router.refresh();
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-foreground/80 outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <FlagFor value={locale} />
        {locale.toUpperCase()}
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-40 overflow-hidden rounded-lg border border-border bg-popover py-1 text-sm text-popover-foreground shadow-lg"
        >
          {locales.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              onClick={() => handleChange(option.value)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left outline-none hover:bg-secondary focus:bg-secondary",
                locale === option.value ? "font-semibold text-primary" : "text-popover-foreground"
              )}
            >
              <FlagFor value={option.value} />
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
