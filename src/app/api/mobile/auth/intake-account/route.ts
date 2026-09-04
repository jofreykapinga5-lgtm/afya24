import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createPatientAccountRecord } from "@/lib/patient-account";
import { signPatientSessionToken, TTL_SECONDS } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";

// Mobile equivalent of qualification/actions.ts's createPatientAccountFallback
// -- recovery path for when the AI chat's createPatientAccount tool never
// fires (model reliability isn't perfect). Same validation and phone-
// collision check as the web Server Action; returns the same AuthResult
// shape every other mobile auth endpoint does instead of just an ok flag,
// since there's no cookie for a mobile client to have picked up.
export async function POST(request: NextRequest) {
  const { allowed } = await checkRateLimit("signup", getClientIpFromRequest(request));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error_code: "rate_limited", error: "Too many attempts. Please wait a while and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const dateOfBirth = typeof body?.dateOfBirth === "string" ? body.dateOfBirth.trim() : "";
  const preferredLanguage = body?.preferredLanguage === "en" ? "en" : "sw";

  if (!fullName || !phone || !dateOfBirth) {
    return NextResponse.json(
      { ok: false, error_code: "missing_fields", error: "Fill in your name, phone number, and date of birth." },
      { status: 400 }
    );
  }

  const normalizedPhone = normalizeTanzanianPhoneToE164(phone);

  const service = createServiceClient();
  const { data: phoneMatch } = await service.from("patients").select("id").eq("phone", normalizedPhone).maybeSingle();
  if (phoneMatch) {
    return NextResponse.json(
      {
        ok: false,
        error_code: "phone_exists",
        error: "An account already exists with this phone number. Please sign in instead.",
      },
      { status: 409 }
    );
  }

  const record = await createPatientAccountRecord({
    fullName,
    phone: normalizedPhone,
    dateOfBirth,
    preferredLanguage,
  });
  const token = await signPatientSessionToken(record.patientId);

  return NextResponse.json({
    ok: true,
    token,
    expiresIn: TTL_SECONDS,
    patient: { id: record.patientId, fullName, phone: normalizedPhone },
  });
}
