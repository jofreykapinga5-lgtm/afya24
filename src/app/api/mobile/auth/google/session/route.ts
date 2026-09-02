import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createStatelessAuthClient } from "@/lib/supabase/anon";
import { createServiceClient } from "@/lib/supabase/service";
import { signPatientSessionToken, LONG_TTL_SECONDS } from "@/lib/patient-session";
import { toTitleCase } from "@/lib/format-name";

// Mobile-native equivalent of auth/callback/route.ts's patient branch --
// same "does a patients row already exist for this Google identity" check,
// but takes a raw Supabase access token in the request body (the mobile app
// gets this from expo-web-browser completing the OAuth redirect to a custom
// URL scheme, see mobile/src/google-auth.ts) instead of reading a cookie
// session, and returns JSON instead of a redirect.
//
// A missing patients row here doesn't fail -- it signals the app to show a
// "finish your profile" step (google/complete-profile/route.ts), same as
// the web app's /account/complete-profile page, since Google never provides
// a phone number and this app needs one everywhere.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const accessToken = typeof body?.accessToken === "string" ? body.accessToken : "";

  if (!accessToken) {
    return NextResponse.json({ ok: false, error_code: "missing_token", error: "Missing access token." }, { status: 400 });
  }

  const authClient = createStatelessAuthClient();
  const { data, error } = await authClient.auth.getUser(accessToken);
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error_code: "invalid_token", error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const service = createServiceClient();

  // Google is only ever offered on the patient-facing app, but guard anyway
  // -- a staff member's own email could exist as a Google identity too, and
  // this endpoint should never silently treat them as a patient.
  const { data: staffProfile } = await service.from("users").select("role").eq("id", data.user.id).maybeSingle();
  if (staffProfile) {
    return NextResponse.json(
      { ok: false, error_code: "staff_account", error: "This Google account is a staff account, not a patient account." },
      { status: 403 }
    );
  }

  const { data: patient } = await service
    .from("patients")
    .select("id, full_name, phone")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (patient) {
    const token = await signPatientSessionToken(patient.id, LONG_TTL_SECONDS);
    return NextResponse.json({
      ok: true,
      needsProfile: false,
      token,
      expiresIn: LONG_TTL_SECONDS,
      patient: {
        id: patient.id,
        fullName: patient.full_name ? toTitleCase(patient.full_name) : null,
        phone: patient.phone,
      },
    });
  }

  // First time signing in with this Google identity -- the app should now
  // show a "finish your profile" screen collecting a phone number, then
  // call google/complete-profile with the same access token.
  const suggestedName = typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : null;
  return NextResponse.json({ ok: true, needsProfile: true, suggestedName });
}
