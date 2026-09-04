import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import { findResumableAppointment, bookConsultationForPatient } from "@/app/doctors/actions";
import type { Locale } from "@/lib/types";

// Mobile-native equivalent of doctors/actions.ts's bookConsultation -- same
// resumable-appointment check + booking sequence (imported directly, not
// reimplemented; see bookConsultationForPatient's own comment for why this
// one specifically is shared rather than duplicated), but for an already
// signed-in-or-guest-sessioned patient reached via a Bearer token instead of
// a cookie. No qualification payload yet -- the mobile app has no AI intake
// wired up, so this always books with qualification: null, same as any web
// booking made without going through the qualification chat first.
export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Your session expired. Please sign in again." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const providerId = typeof body?.providerId === "string" ? body.providerId : "";
  const locale: Locale = body?.locale === "sw" ? "sw" : "en";
  if (!providerId) {
    return NextResponse.json({ ok: false, error: "Missing providerId." }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const existingAppointmentId = await findResumableAppointment(service, session.patientId, providerId);
    if (existingAppointmentId) {
      return NextResponse.json({ ok: true, appointmentId: existingAppointmentId });
    }

    const appointmentId = await bookConsultationForPatient({
      patientId: session.patientId,
      providerId,
      locale,
      qualification: null,
    });
    return NextResponse.json({ ok: true, appointmentId });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not book this consultation." },
      { status: 500 }
    );
  }
}
