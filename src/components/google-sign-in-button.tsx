"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

// Google's own official "G" mark (four-color logomark from Google's Identity
// branding guidelines) -- not from an icon library, since this specific
// glyph is Google's brand asset, not a generic pictogram.
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-4.5 shrink-0" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  locale,
  redirectTo,
  context,
  className,
}: {
  locale: Locale;
  redirectTo?: string;
  // "staff" tells /auth/callback this came from the staff sign-in page, not
  // the patient one -- there it only ever logs in an ALREADY admin-created
  // doctor/admin account, never creates one. Omit for the default patient
  // behavior (log in an existing account, or start the new-patient
  // complete-profile step for a first-time Google identity).
  context?: "staff";
  // Sizing/rounding only (height, radius) -- colors intentionally come from
  // Button's own outline variant (theme tokens), not a hardcoded palette,
  // since this same component sits on both the teal patient pages and the
  // neutral shadcn-styled staff page.
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const params = new URLSearchParams();
      if (redirectTo) params.set("redirectTo", redirectTo);
      if (context) params.set("context", context);
      const query = params.toString() ? `?${params.toString()}` : "";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback${query}` },
      });
      if (oauthError) {
        setError(oauthError.message);
        setPending(false);
      }
      // On success the browser is redirected to Google -- this component
      // unmounts, so there's no "success" state to set here.
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_google_signin_failed", locale));
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={handleClick}
        className={className ?? "h-11 w-full rounded-xl"}
      >
        <GoogleLogo />
        {pending ? t("common_please_wait", locale) : t("account_continue_with_google", locale)}
      </Button>
      {error && <p className="mt-2 text-center text-xs text-urgent">{error}</p>}
    </div>
  );
}
