"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";
import { SubmitButton } from "@/components/submit-button";
import { signOut } from "@/app/account/actions";

const navLinks: { href: string; labelKey: TranslationKey }[] = [
  { href: "#doctors", labelKey: "nav_doctors" },
  { href: "/pharmacy", labelKey: "nav_pharmacy" },
];

const headerHiddenPrefixes = ["/account", "/admin", "/auth"];

// Staff-only doctor sign-in/dashboard/apply pages -- "/doctor" as a plain
// prefix would also swallow "/doctors" (the patient-facing listing and
// booking flow, which is meant to keep the header now). Matched separately
// so patients keep the header through doctor selection, payment, connect,
// and the video call itself, while staff surfaces stay header-free per
// the "no staff sign-in in the patient navbar" rule.
function isStaffDoctorPath(pathname: string) {
  return pathname === "/doctor" || pathname.startsWith("/doctor/");
}

// The doctor-selection-through-video-call flow (/doctors, /consultation) is
// a focused task, not general browsing -- the account menu doesn't belong
// mid-booking or mid-payment. Just enough presence to feel like the same
// site: logo and language.
function isFlowPage(pathname: string) {
  return pathname.startsWith("/doctors") || pathname.startsWith("/consultation");
}

function firstName(fullName: string) {
  return fullName.replace(/^Dr\.\s*/i, "").split(" ")[0] || fullName;
}

export function SiteHeader({ patientName }: { patientName: string | null }) {
  const locale = useAppStore((state) => state.locale);
  const pathname = usePathname();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  if (headerHiddenPrefixes.some((prefix) => pathname.startsWith(prefix)) || isStaffDoctorPath(pathname)) {
    return null;
  }

  if (isFlowPage(pathname)) {
    return (
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
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
          <LanguageToggle />
        </div>
      </header>
    );
  }

  function navHref(href: string) {
    if (!href.startsWith("#")) return href;
    return pathname === "/" ? href : `/${href}`;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 shrink items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
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

          <nav className="hidden items-center gap-5 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={navHref(link.href)}
                className="rounded-sm text-sm font-semibold text-foreground/80 outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {t(link.labelKey, locale)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageToggle />

          {!patientName ? (
            // One entry point, not a separate log-in/sign-up choice -- the
            // phone+OTP form behind /account already handles a first-time
            // number transparently (see phone-otp-form.tsx). Same pill,
            // shadow-lift, and hover-arrow treatment as the hero CTA below,
            // scaled down to nav-bar height, so the two read as one brand
            // moment rather than two different button styles.
            <Link
              href="/account"
              className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-primary pl-4 pr-3.5 text-sm font-bold text-primary-foreground shadow-[0_14px_30px_-14px_rgba(47,111,192,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/35"
            >
              {t("header_get_started", locale)}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAccountMenuOpen((open) => !open)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-primary outline-none transition-colors hover:bg-primary-soft focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <User className="size-4" />
                <span className="hidden sm:inline">{firstName(patientName)}</span>
                <ChevronDown
                  className={`size-4 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {accountMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-44 overflow-hidden rounded-lg border border-border bg-popover py-1 text-sm text-popover-foreground shadow-lg"
                >
                  <Link
                    href="/account/dashboard"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-primary outline-none hover:bg-secondary focus:bg-secondary"
                  >
                    <LayoutDashboard className="size-3.5" />
                    {t("header_my_account", locale)}
                  </Link>
                  <form action={signOut}>
                    <SubmitButton
                      variant="ghost"
                      role="menuitem"
                      className="w-full justify-start gap-2 rounded-none px-3 py-2 text-left text-destructive hover:bg-secondary focus:bg-secondary"
                    >
                      <LogOut className="size-3.5" />
                      {t("header_log_out", locale)}
                    </SubmitButton>
                  </form>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
