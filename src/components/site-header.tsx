"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Search, User, X } from "lucide-react";
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
// a focused task, not general browsing -- search and the account menu
// don't belong mid-booking or mid-payment. Just enough presence to feel
// like the same site: logo and language.
function isFlowPage(pathname: string) {
  return pathname.startsWith("/doctors") || pathname.startsWith("/consultation");
}

function firstName(fullName: string) {
  return fullName.replace(/^Dr\.\s*/i, "").split(" ")[0] || fullName;
}

export function SiteHeader({ patientName }: { patientName: string | null }) {
  const locale = useAppStore((state) => state.locale);
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSearch();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

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

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/doctors?q=${encodeURIComponent(query)}`);
    closeSearch();
  }

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
        {searchOpen ? (
          <form onSubmit={submitSearch} className="flex w-full items-center gap-2">
            <button
              type="button"
              aria-label={t("header_search_close_aria", locale)}
              onClick={closeSearch}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-5" />
            </button>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("header_search_placeholder", locale)}
                className="h-10 w-full rounded-full border border-border bg-secondary/60 pl-10 pr-3.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              aria-label={t("header_search_aria", locale)}
              disabled={!searchQuery.trim()}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none transition-colors disabled:opacity-50 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Search className="size-4" />
            </button>
          </form>
        ) : (
          <>
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

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <LanguageToggle />

              <button
                type="button"
                aria-label={t("header_search_aria", locale)}
                onClick={() => setSearchOpen(true)}
                className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Search className="size-4.5" />
              </button>

              {!patientName ? (
                // One entry point, not a separate log-in/sign-up choice --
                // the phone+OTP form behind /account already handles a
                // first-time number transparently (see phone-otp-form.tsx).
                // A filled CTA reads as an invitation to start, not a gate
                // patients need to already have an account to pass.
                <Link
                  href="/account"
                  className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground outline-none transition hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-primary/35 sm:px-5"
                >
                  {t("header_get_started", locale)}
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
          </>
        )}
      </div>
    </header>
  );
}
