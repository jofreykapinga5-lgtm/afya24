"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { ChevronDown, CircleHelp, Menu, Search, Stethoscope, User, X } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks: { href: string; labelKey: TranslationKey }[] = [
  { href: "#how-it-works", labelKey: "nav_how_it_works" },
  { href: "#doctors", labelKey: "nav_doctors" },
  { href: "#services", labelKey: "services_title" },
  { href: "/pharmacy", labelKey: "nav_pharmacy" },
  { href: "#labs", labelKey: "nav_labs" },
  { href: "#health-tips", labelKey: "nav_health_tips" },
];

const headerHiddenPrefixes = ["/account", "/admin", "/auth", "/consultation", "/doctor"];

export function SiteHeader() {
  const locale = useAppStore((state) => state.locale);
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loginMenuRef = useRef<HTMLDivElement>(null);

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
    if (!loginMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!loginMenuRef.current?.contains(event.target as Node)) {
        setLoginMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLoginMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loginMenuOpen]);

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

  if (headerHiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  function navHref(href: string) {
    if (!href.startsWith("#")) return href;
    return pathname === "/" ? href : `/${href}`;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
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
        <div className="flex shrink-0 items-center gap-3">
          <Sheet>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Afya24</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {navLinks.map((link) =>
                  link.href.startsWith("#") ? (
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
                  ) : (
                    <SheetClose
                      key={link.href}
                      nativeButton={false}
                      render={
                        <Link
                          href={link.href}
                          className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                      }
                    >
                      {t(link.labelKey, locale)}
                    </SheetClose>
                  )
                )}
              </nav>
              <div className="mt-2 flex flex-col gap-1 border-t border-border px-4 pt-4">
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      href="/lookup"
                      className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  }
                >
                  {t("reference_lookup_link", locale)}
                </SheetClose>
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      href="/doctor"
                      className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  }
                >
                  <Stethoscope className="size-3.5" />
                  {t("header_doctor_admin_login", locale)}
                </SheetClose>
              </div>

              <div className="mt-2 flex flex-col gap-2 border-t border-border px-4 pt-4 sm:hidden">
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      href="/account"
                      className="flex h-11 items-center justify-center rounded-full border border-border text-sm font-medium outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  }
                >
                  {t("header_log_in", locale)}
                </SheetClose>
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      href="/account/sign-up"
                      className="flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  }
                >
                  {t("header_sign_up", locale)}
                </SheetClose>
              </div>
              <SheetHeader>
                <button
                  type="button"
                  aria-label={t("header_help", locale)}
                  className="mx-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-border px-3 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <CircleHelp className="size-4" />
                  {t("header_help", locale)}
                </button>
              </SheetHeader>
            </SheetContent>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("header_open_menu_aria", locale)}
                  className="size-11 -ml-1"
                />
              }
            >
              <Menu className="size-6" strokeWidth={2.25} />
            </SheetTrigger>
          </Sheet>

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
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            aria-label={t("header_search_aria", locale)}
            onClick={() => setSearchOpen(true)}
            className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Search className="size-4.5" />
          </button>

          <div ref={loginMenuRef} className="relative hidden sm:block">
            <button
              type="button"
              aria-expanded={loginMenuOpen}
              aria-haspopup="menu"
              onClick={() => setLoginMenuOpen((open) => !open)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-primary outline-none transition-colors hover:bg-primary-soft focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <User className="size-4" />
              {t("header_log_in", locale)}
              <ChevronDown
                className={`size-4 transition-transform ${loginMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {loginMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-44 overflow-hidden rounded-lg border border-border bg-popover py-1 text-sm text-popover-foreground shadow-lg"
              >
                <Link
                  href="/account"
                  role="menuitem"
                  onClick={() => setLoginMenuOpen(false)}
                  className="block px-3 py-2 text-primary outline-none hover:bg-secondary focus:bg-secondary"
                >
                  {t("header_log_in", locale)}
                </Link>
                <Link
                  href="/account/sign-up"
                  role="menuitem"
                  onClick={() => setLoginMenuOpen(false)}
                  className="block px-3 py-2 text-primary outline-none hover:bg-secondary focus:bg-secondary"
                >
                  {t("header_sign_up", locale)}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
          </>
        )}
      </div>
    </header>
  );
}
