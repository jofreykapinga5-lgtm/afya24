"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/types";

// Hedhi has its own Supabase project (separate from Afya24's). Only its PUBLIC url and anon key are used here: the
// delete itself is the signed-in user's own `delete_my_account` function, protected by Hedhi's database rules.
const HEDHI_SUPABASE_URL = "https://vknpsbrigwsonikumqfv.supabase.co";
const HEDHI_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbnBzYnJpZ3dzb25pa3VtcWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMDk1MjEsImV4cCI6MjEwNzc4NTUyMX0.QvAGtlnfs1gHAyf3o7kHuygiSnFEtvzuaTMnYOSXNoQ";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "email" | "code" | "confirm" | "done";

/** Sign in to Hedhi with a 6-digit email code, then delete the account. Nothing is remembered in this browser. */
export function HedhiDeleteAccount({ locale }: { locale: Locale }) {
  const sw = locale === "sw";
  // In-memory session only, under its own key, so it never mixes with an Afya24 sign-in on the same site.
  const hedhi = useMemo(
    () => createClient(HEDHI_SUPABASE_URL, HEDHI_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, storageKey: "hedhi-delete" } }),
    [],
  );
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) return setError(sw ? "Weka barua pepe sahihi." : "Enter a valid email address.");
    setBusy(true);
    // Only existing accounts get a code. The answer is the same either way, so nobody can test who uses Hedhi.
    const { error: e1 } = await hedhi.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: false } });
    setBusy(false);
    if (e1 && (e1.status === 429 || /rate/i.test(e1.message))) {
      return setError(sw ? "Umeomba mara nyingi. Subiri dakika moja kisha ujaribu tena." : "Too many requests. Wait a minute and try again.");
    }
    setEmail(clean);
    setStep("code");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) return setError(sw ? "Weka msimbo wa tarakimu 6." : "Enter the 6-digit code.");
    setBusy(true);
    const { error: e2 } = await hedhi.auth.verifyOtp({ email, token: code, type: "email" });
    setBusy(false);
    if (e2) return setError(sw ? "Msimbo si sahihi au umeisha muda." : "The code is wrong or has expired.");
    setStep("confirm");
  };

  const remove = async () => {
    setError(null);
    setBusy(true);
    const { error: e3 } = await hedhi.rpc("delete_my_account");
    if (e3) {
      setBusy(false);
      return setError(sw ? "Imeshindikana kufuta. Jaribu tena, au tutumie barua pepe." : "Could not delete. Try again, or email us.");
    }
    await hedhi.auth.signOut().catch(() => {});
    setBusy(false);
    setStep("done");
  };

  const box = "rounded-2xl border bg-card p-6 shadow-sm";
  const errorBox = error && (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </p>
  );

  if (step === "done") {
    return (
      <div className={box}>
        <p className="text-lg font-semibold">{sw ? "Akaunti imefutwa" : "Account deleted"}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {sw
            ? "Akaunti yako ya Hedhi na taarifa zake zote zimefutwa kwenye seva zetu. Asante kwa kutumia Hedhi."
            : "Your Hedhi account and all its data have been deleted from our servers. Thank you for using Hedhi."}
        </p>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className={`${box} space-y-4`}>
        <p className="text-sm">
          {sw ? "Umeingia kama " : "Signed in as "}
          <span className="font-semibold">{email}</span>
        </p>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 size-4 accent-destructive" checked={sure} onChange={(e) => setSure(e.target.checked)} />
          <span>
            {sw
              ? "Ninaelewa kuwa akaunti yangu na taarifa zake zote zitafutwa kabisa na haziwezi kurudishwa."
              : "I understand my account and all its data will be permanently deleted and cannot be recovered."}
          </span>
        </label>
        {errorBox}
        <Button variant="destructive" size="lg" className="w-full" disabled={!sure || busy} onClick={() => void remove()}>
          {busy ? (sw ? "Inafuta..." : "Deleting...") : sw ? "Futa akaunti yangu" : "Delete my account"}
        </Button>
      </div>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={verify} className={`${box} space-y-4`}>
        <p className="text-sm text-muted-foreground">
          {sw
            ? `Kama ${email} ina akaunti ya Hedhi, tumetuma msimbo wa tarakimu 6. Angalia pia barua taka.`
            : `If ${email} has a Hedhi account, we sent it a 6-digit code. Check your spam folder too.`}
        </p>
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-12 text-center text-2xl tracking-[0.5em]"
          aria-label={sw ? "Msimbo wa tarakimu 6" : "6-digit code"}
          autoFocus
        />
        {errorBox}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? (sw ? "Inakagua..." : "Checking...") : sw ? "Endelea" : "Continue"}
        </Button>
        <button type="button" className="w-full text-sm text-muted-foreground hover:underline" onClick={() => (setStep("email"), setCode(""), setError(null))}>
          {sw ? "Tumia barua pepe nyingine" : "Use a different email"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className={`${box} space-y-4`}>
      <label className="block space-y-2">
        <span className="text-sm font-semibold">{sw ? "Barua pepe ya akaunti yako ya Hedhi" : "Your Hedhi account email"}</span>
        <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required />
      </label>
      {errorBox}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? (sw ? "Inatuma..." : "Sending...") : sw ? "Nitumie msimbo" : "Send me a code"}
      </Button>
    </form>
  );
}
