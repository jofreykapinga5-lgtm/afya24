import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyPatientOtp } from "@/lib/patient-otp";
import { resolvePatientForVerifiedPhone } from "@/lib/patient-account";
import { signPatientSessionToken, LONG_TTL_SECONDS } from "@/lib/patient-session";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { toTitleCase } from "@/lib/format-name";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";

// Mobile equivalent of account/actions.ts's verifyPatientOtp -- one endpoint
// for sign-up, sign-in, and claiming an orphaned guest/AI-intake record
// under the same phone, all handled by resolvePatientForVerifiedPhone. No
// separate Supabase session to establish here (unlike the web app's cookie-
// based one) -- the JWT this returns is the only session a mobile client
// has, same as the old sign-in/sign-up routes returned.
const ERROR_MESSAGES: Record<string, string> = {
  invalid: "That code is incorrect. Please try again.",
  expired: "That code has expired. Request a new one.",
  too_many_attempts: "Too many incorrect attempts. Request a new code.",
};

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
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!rawPhone || !code) {
    return NextResponse.json(
      { ok: false, error_code: "missing_fields", error: "Enter your phone number and the code." },
      { status: 400 }
    );
  }

  const phone = normalizeTanzanianPhoneToE164(rawPhone);
  const result = await verifyPatientOtp(phone, code);
  if (result !== "ok") {
    return NextResponse.json(
      { ok: false, error_code: `otp_${result}`, error: ERROR_MESSAGES[result] },
      { status: result === "too_many_attempts" ? 429 : 401 }
    );
  }

  const service = createServiceClient();
  let resolved;
  try {
    resolved = await resolvePatientForVerifiedPhone(service, phone);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error_code: "signup_failed", error: err instanceof Error ? err.message : "Could not create your account. Please try again." },
      { status: 500 }
    );
  }

  const { data: patient } = await service
    .from("patients")
    .select("full_name, phone")
    .eq("id", resolved.patientId)
    .maybeSingle();

  const token = await signPatientSessionToken(resolved.patientId, LONG_TTL_SECONDS);

  return NextResponse.json({
    ok: true,
    token,
    expiresIn: LONG_TTL_SECONDS,
    isNewAccount: resolved.isNewAccount,
    patient: {
      id: resolved.patientId,
      fullName: patient?.full_name ? toTitleCase(patient.full_name as string) : null,
      phone: patient?.phone ?? phone,
    },
  });
}
