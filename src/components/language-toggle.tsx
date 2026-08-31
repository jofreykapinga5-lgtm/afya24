"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { locales } from "@/lib/i18n";
import { setLocaleCookie } from "@/lib/locale-cookie.client";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);

  function handleChange(value: (typeof locales)[number]["value"]) {
    setLocale(value);
    // Zustand's persisted store only reaches Client Components. Server
    // Components (the auth pages, terms/privacy, etc.) read this
    // cookie instead -- see src/lib/locale-cookie.ts. router.refresh() forces
    // the current route's server-rendered parts to re-read it immediately,
    // rather than waiting for the next navigation.
    setLocaleCookie(value);
    router.refresh();
  }

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-secondary/40 p-1 text-xs font-medium">
      {locales.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleChange(option.value)}
          aria-pressed={locale === option.value}
          className={cn(
            "flex min-h-11 items-center rounded-full px-3.5 transition-colors",
            locale === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
