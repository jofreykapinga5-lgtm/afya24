import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createPatientAccountRecord } from "@/lib/patient-account";
import { signPatientSessionToken, LONG_TTL_SECONDS } from "@/lib/patient-session";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";
import { findResumableAppointment, bookConsultationForPatient } from "@/app/doctors/actions";
import type { Locale } from "@/lib/types";

// Mobile-native equivalent of doctors/actions.ts's bookAsGuest -- the
// "continue without an account" path. Creates a lightweight, no-password
// patients row (same as the web guest form -- there's no Supabase Auth user
// behind this, so this patient can never sign back in with a password
// later; that's the same limitation the web guest flow already has), mints
// the app's own session JWT directly (mirrors createPatientSession's cookie
// version), then books.
export async function POST(request: NextRequest) {
  const { allowed } = await checkRateLimit("signup", getClientIpFromRequest(request));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error_code: "rate_limited", error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const providerId = typeof body?.providerId === "string" ? body.providerId : "";
  const locale: Locale = body?.locale === "sw" ? "sw" : "en";

  if (!fullName || !rawPhone || !providerId) {
    return NextResponse.json(
      { ok: false, error_code: "missing_fields", error: "Please fill in every field." },
      { status: 400 }
    );
  }

  try {
    const normalizedPhone = normalizeTanzanianPhoneToE164(rawPhone);
    const service = createServiceClient();

    const { data: phoneMatch } = await service
      .from("patients")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();
    if (phoneMatch) {
      return NextResponse.json(
        {
          ok: false,
          error_code: "phone_exists",
          error: "This phone number already has a record. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    const record = await createPatientAccountRecord({
      fullName,
      phone: normalizedPhone,
      preferredLanguage: locale,
    });

    const existingAppointmentId = await findResumableAppointment(service, record.patientId, providerId);
    const appointmentId =
      existingAppointmentId ??
      (await bookConsultationForPatient({
        patientId: record.patientId,
        providerId,
        locale,
        qualification: null,
      }));

    const token = await signPatientSessionToken(record.patientId, LONG_TTL_SECONDS);
    return NextResponse.json({
      ok: true,
      token,
      expiresIn: LONG_TTL_SECONDS,
      patient: { id: record.patientId, fullName, phone: normalizedPhone },
      appointmentId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error_code: "booking_failed",
        error: error instanceof Error ? error.message : "Could not book this consultation.",
      },
      { status: 500 }
    );
  }
}
