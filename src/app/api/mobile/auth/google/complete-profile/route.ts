import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createStatelessAuthClient } from "@/lib/supabase/anon";
import { createServiceClient } from "@/lib/supabase/service";
import { checkPatientPhoneCollision } from "@/lib/patient-account";
import { signPatientSessionToken, LONG_TTL_SECONDS } from "@/lib/patient-session";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { toTitleCase } from "@/lib/format-name";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";

// Mobile-native equivalent of account/complete-profile/actions.ts's
// completeGoogleProfile -- finishes a first-time Google sign-in by
// collecting the phone number Google never provides, then creates the
// patients row. Re-verifies the access token rather than trusting a stored
// session, since this is a stateless JSON API, not a cookie-backed page.
export async function POST(request: NextRequest) {
  const { allowed } = await checkRateLimit("signup", getClientIpFromRequest(request));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error_code: "rate_limited", error: "Too many attempts. Please wait a while and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const accessToken = typeof body?.accessToken === "string" ? body.accessToken : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
  // Optional -- Google never provides this (gender sits behind Google's
  // restricted "sensitive scopes," effectively unreachable for an app like
  // this), so this is the only place it can come from.
  const rawGender = typeof body?.gender === "string" ? body.gender : "";
  const gender = rawGender === "female" || rawGender === "male" || rawGender === "other" ? rawGender : null;

  if (!accessToken || !fullName || !rawPhone) {
    return NextResponse.json(
      { ok: false, error_code: "missing_fields", error: "Enter your name and phone number." },
      { status: 400 }
    );
  }

  const authClient = createStatelessAuthClient();
  const { data, error } = await authClient.auth.getUser(accessToken);
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error_code: "invalid_token", error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const phone = normalizeTanzanianPhoneToE164(rawPhone);
  const service = createServiceClient();

  // A phone can already belong to a patient record from an earlier visit,
  // and it can be shared within a family -- same guard as every other
  // account-creation path in this app. Which error code depends on whether
  // that record actually has a real account behind it -- "sign in instead"
  // is a dead end for a guest/AI-intake record with no password or Google
  // link at all (see checkPatientPhoneCollision's own comment).
  const collision = await checkPatientPhoneCollision(service, phone);
  if (collision.status === "account") {
    return NextResponse.json(
      { ok: false, error_code: "phone_exists", error: "We already have an account under this phone number." },
      { status: 409 }
    );
  }
  if (collision.status === "orphan") {
    return NextResponse.json(
      {
        ok: false,
        error_code: "phone_orphaned",
        error:
          "This phone number already has a patient file with us, but it isn't linked to a sign-in account yet. Please use a different number, or contact support@afya24.com to link it.",
      },
      { status: 409 }
    );
  }

  const { data: inserted, error: insertError } = await service
    .from("patients")
    .insert({ user_id: data.user.id, full_name: fullName, phone, gender })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { ok: false, error_code: "signup_failed", error: insertError?.message ?? "Could not finish setting up your account." },
      { status: 500 }
    );
  }

  const token = await signPatientSessionToken(inserted.id, LONG_TTL_SECONDS);
  return NextResponse.json({
    ok: true,
    token,
    expiresIn: LONG_TTL_SECONDS,
    patient: { id: inserted.id, fullName: toTitleCase(fullName), phone },
  });
}
