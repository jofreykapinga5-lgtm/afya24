"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, LayoutDashboard, LogOut, Menu, User } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { signOut } from "@/app/account/actions";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetTrigger } from "@/components/ui/sheet";

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
      <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <Sheet>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Afya24</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {navLinks.map((link) => (
                  <SheetClose
                    key={link.href}
                    nativeButton={false}
                    render={
                      <Link
                        href={navHref(link.href)}
                        className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    }
                  >
                    {t(link.labelKey, locale)}
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("header_open_menu_aria", locale)}
                  className="size-11 -ml-1 sm:hidden"
                />
              }
            >
              <Menu className="size-6" strokeWidth={2.25} />
            </SheetTrigger>
          </Sheet>

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
        </div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 sm:flex">
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

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <LanguageToggle />

          {!patientName ? (
            // Same words as the hero CTA below ("See a doctor now") and the
            // same destination -- a header button labelled that way but
            // pointing at the login/signup gate instead of /doctors would
            // be a lie. Booking doesn't require an account up front (see
            // the guest flow at doctors/[providerId]/guest), so /doctors
            // is the honest destination for this label either way.
            <Link
              href="/doctors"
              className="group inline-flex h-10 items-center gap-1 rounded-full bg-primary pl-3 pr-2.5 text-sm font-bold text-primary-foreground shadow-[0_14px_30px_-14px_rgba(47,111,192,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/35 sm:gap-1.5 sm:pl-4 sm:pr-3.5"
            >
              {t("hero_get_help_cta", locale)}
              <ArrowRight className="hidden size-4 transition-transform duration-200 group-hover:translate-x-0.5 sm:inline-flex" />
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
