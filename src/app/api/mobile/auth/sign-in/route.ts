import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createStatelessAuthClient } from "@/lib/supabase/anon";
import { createServiceClient } from "@/lib/supabase/service";
import { signPatientSessionToken, LONG_TTL_SECONDS } from "@/lib/patient-session";
import { patientAuthEmailFromPhone } from "@/lib/patient-auth-email";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { toTitleCase } from "@/lib/format-name";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";

// Mobile-native equivalent of account/actions.ts's signIn -- same credential
// check and patient lookup, but returns the session as JSON (the JWT in the
// body, for the app to store in expo-secure-store) instead of redirect() +
// cookies().set(), since a React Native client has no cookie jar and can't
// invoke a Server Action at all (that's an internal Next.js RSC mechanism,
// not a public HTTP contract -- see mobile/AFYA24-MOBILE-PLAN.md).
//
// Responses use a stable error_code (not localized text) since this is a
// JSON API consumed by a client with its own i18n dictionary, not a page
// that renders copy itself -- the opposite convention from the web app's
// own Server Actions, deliberately, for exactly that reason.
export async function POST(request: NextRequest) {
  const { allowed } = await checkRateLimit("auth", getClientIpFromRequest(request));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error_code: "rate_limited", error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!rawPhone || !password) {
    return NextResponse.json(
      { ok: false, error_code: "missing_fields", error: "Enter your phone number and password." },
      { status: 400 }
    );
  }

  const phone = normalizeTanzanianPhoneToE164(rawPhone);
  const authClient = createStatelessAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword({
    email: patientAuthEmailFromPhone(phone),
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, error_code: "invalid_credentials", error: "Invalid phone number or password." },
      { status: 401 }
    );
  }

  // Everything past this point (booking, payment, joining a call) checks
  // getPatientSession()'s JWT, not the Supabase session that just got
  // established above -- same reasoning as the web app's own signIn.
  const service = createServiceClient();
  const { data: patient } = await service
    .from("patients")
    .select("id, full_name, phone")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!patient) {
    return NextResponse.json(
      { ok: false, error_code: "no_patient_record", error: "No patient record found for this account." },
      { status: 404 }
    );
  }

  const token = await signPatientSessionToken(patient.id, LONG_TTL_SECONDS);

  return NextResponse.json({
    ok: true,
    token,
    expiresIn: LONG_TTL_SECONDS,
    patient: {
      id: patient.id,
      fullName: patient.full_name ? toTitleCase(patient.full_name) : null,
      phone: patient.phone,
    },
  });
}
