import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createPatientSession } from "@/lib/patient-session";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";

// Supabase's own OAuth callback (registered with Google) lands here with a
// `code` once it has already completed the Google exchange -- this route's
// only job is exchanging that code for OUR session, then routing the person
// to wherever they actually belong. Route Handlers can't use next/navigation's
// redirect() (that only works in Server Components/Actions), hence
// NextResponse.redirect() throughout.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = safeRedirectPath(searchParams.get("redirectTo"), "/account/dashboard");
  const locale = await getServerLocale();

  if (!code) {
    return NextResponse.redirect(
      `${origin}/account?error=${encodeURIComponent(t("error_google_signin_failed", locale))}`
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/account?error=${encodeURIComponent(error?.message ?? t("error_google_signin_failed", locale))}`
    );
  }

  const service = createServiceClient();

  // Google is only ever offered on the patient-facing /account pages, but
  // guard anyway -- a staff member's own email could exist as a Google
  // identity too, and they should always land on their real dashboard,
  // never get silently treated as a patient (see staff-redirect-guard.ts,
  // whose redirect() this route can't reuse directly).
  const { data: staffProfile } = await service
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (staffProfile?.role === "doctor") return NextResponse.redirect(`${origin}/doctor/dashboard`);
  if (staffProfile?.role === "admin") return NextResponse.redirect(`${origin}/admin/dashboard`);
  if (staffProfile?.role === "pharmacy_staff" || staffProfile?.role === "lab_staff") {
    return NextResponse.redirect(origin);
  }

  const { data: patient } = await service
    .from("patients")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (patient) {
    await createPatientSession(patient.id);
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // First time signing in with this Google identity -- Google gives a name
  // and email but never a phone number, and this app needs one everywhere
  // (doctor callbacks, WhatsApp lab referrals), so this blocks on collecting
  // it before anything else rather than creating a patient record without one.
  const params = new URLSearchParams({ redirectTo });
  return NextResponse.redirect(`${origin}/account/complete-profile?${params.toString()}`);
}
