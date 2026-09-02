import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createStatelessAuthClient } from "@/lib/supabase/anon";
import { createServiceClient } from "@/lib/supabase/service";
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
  // account-creation path in this app.
  const { data: phoneMatch } = await service.from("patients").select("id").eq("phone", phone).maybeSingle();
  if (phoneMatch) {
    return NextResponse.json(
      { ok: false, error_code: "phone_exists", error: "We already have a patient record under this phone number. If this is you, sign in instead." },
      { status: 409 }
    );
  }

  const { data: inserted, error: insertError } = await service
    .from("patients")
    .insert({ user_id: data.user.id, full_name: fullName, phone })
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
