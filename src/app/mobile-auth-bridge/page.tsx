"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// Handoff page for the mobile app's "Continue with Google" flow.
//
// Supabase's own OAuth redirect step won't reliably land on a custom app
// scheme (afya24://... or Expo Go's exp://...) -- it silently falls back to
// this project's Site URL instead, which is this web app. So the mobile app
// sends Supabase here (a real, already-whitelisted https:// URL) with the
// real destination it wants baked into a `target` query param, and this
// page does the very last hop itself once the page has loaded in the
// phone's own browser -- an environment we fully control, no Supabase
// server-side redirect matching involved for that last step.
//
// Custom-scheme navigation triggered purely by script (no tap) is routinely
// blocked by mobile browsers as a security measure, so the primary path
// here is a real tappable link (a genuine user gesture), with a same-target
// auto-redirect attempt as a courtesy that works where the browser allows it.
function BridgeContent() {
  const params = useSearchParams();
  const target = params.get("target");
  const [autoTried, setAutoTried] = useState(false);

  const destination = (() => {
    if (!target) return null;
    if (typeof window === "undefined") return target;
    const hash = window.location.hash; // carries #access_token=...&refresh_token=...
    return hash ? `${target}${hash}` : target;
  })();

  useEffect(() => {
    if (!destination || autoTried) return;
    setAutoTried(true);
    window.location.replace(destination);
  }, [destination, autoTried]);

  if (!destination) {
    return (
      <p className="text-sm text-muted-foreground">
        This link is missing some information and can&apos;t continue. Go back to the Afya24 app and try signing in again.
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">You&apos;re signed in with Google. Tap below to return to the app.</p>
      <a
        href={destination}
        className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-opacity active:opacity-80"
      >
        Continue to Afya24
      </a>
      <p className="text-xs text-muted-foreground">If nothing happens, reopen the Afya24 app manually.</p>
    </>
  );
}

export default function MobileAuthBridgePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Suspense fallback={null}>
        <BridgeContent />
      </Suspense>
    </main>
  );
}
