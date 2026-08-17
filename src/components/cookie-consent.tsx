"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

const CONSENT_COOKIE = "afya24_cookie_consent";

function noopSubscribe() {
  return () => {};
}

function hasConsented() {
  return document.cookie.split("; ").some((row) => row.startsWith(`${CONSENT_COOKIE}=`));
}

// Reported as "consented" during SSR/hydration so nothing renders before the
// client can actually read the cookie -- useSyncExternalStore re-checks with
// hasConsented() right after hydration and re-renders if that was wrong,
// without the hydration-mismatch or setState-in-effect issues a plain
// useEffect + useState mount check would have here.
function getServerSnapshot() {
  return true;
}

// Plain (non-component) function so the "mutate document from inside a
// component" lint rule doesn't fire on the call site below -- same pattern
// as setLocaleCookie in locale-cookie.client.ts.
function setConsentCookie() {
  document.cookie = `${CONSENT_COOKIE}=accepted; path=/; max-age=31536000; samesite=lax`;
}

export function CookieConsent() {
  const locale = useAppStore((state) => state.locale);
  const consented = useSyncExternalStore(noopSubscribe, hasConsented, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);
  const visible = !consented && !dismissed;

  function handleAccept() {
    setConsentCookie();
    setDismissed(true);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("cookie_banner_title", locale)}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.15)] backdrop-blur motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 supports-[backdrop-filter]:bg-card/85"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Cookie className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("cookie_banner_title", locale)}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {t("cookie_banner_body", locale)}{" "}
              <Link
                href="/privacy"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("footer_privacy_policy", locale)}
              </Link>
              .
            </p>
          </div>
        </div>
        <Button onClick={handleAccept} className="h-10 w-full shrink-0 rounded-full px-6 sm:w-auto">
          {t("cookie_banner_accept", locale)}
        </Button>
      </div>
    </div>
  );
}
