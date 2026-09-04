import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { signPatientSessionToken, verifyAccountClaimToken, TTL_SECONDS } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import { toTitleCase } from "@/lib/format-name";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";

// Mobile equivalent of /api/patient-session/route.ts. That route exists
// purely because a streamed Server Component response can't set a cookie
// partway through (see its own comment) -- it turns the AI intake chat's
// createPatientAccount tool output (a short-lived signed claimToken) into
// the real session cookie. A React Native client has no cookie jar at all,
// claim token or not, so this returns the same AuthResult shape every other
// mobile auth endpoint does (token in the body, for expo-secure-store)
// instead of a bare { ok: true }.
export async function POST(request: NextRequest) {
  const { allowed } = await checkRateLimit("claimToken", getClientIpFromRequest(request));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error_code: "rate_limited", error: "Too many attempts. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const claimToken = typeof body?.claimToken === "string" ? body.claimToken : "";
  if (!claimToken) {
    return NextResponse.json(
      { ok: false, error_code: "missing_fields", error: "claimToken is required." },
      { status: 400 }
    );
  }

  const patientId = await verifyAccountClaimToken(claimToken);
  if (!patientId) {
    return NextResponse.json(
      { ok: false, error_code: "invalid_claim", error: "Invalid or expired claim." },
      { status: 401 }
    );
  }

  const service = createServiceClient();
  const { data: patient } = await service
    .from("patients")
    .select("id, full_name, phone")
    .eq("id", patientId)
    .maybeSingle();

  if (!patient) {
    return NextResponse.json(
      { ok: false, error_code: "not_found", error: "Could not find your patient record." },
      { status: 404 }
    );
  }

  // Default (24h) TTL, not LONG_TTL_SECONDS -- this is the same password-less
  // AI-intake record the web claim route mints via createPatientSession(patientId)
  // with no explicit ttlSeconds, not a full password/Google account.
  const token = await signPatientSessionToken(patientId);

  return NextResponse.json({
    ok: true,
    token,
    expiresIn: TTL_SECONDS,
    patient: {
      id: patient.id,
      fullName: patient.full_name ? toTitleCase(patient.full_name) : null,
      phone: patient.phone,
    },
  });
}
