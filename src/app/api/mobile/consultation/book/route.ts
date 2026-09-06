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
    const appointmentId =
      existingAppointmentId ??
      (await bookConsultationForPatient({
        patientId: session.patientId,
        providerId,
        locale,
        qualification: null,
      }));

    // Same check the web app's own /consultation/[id]/pay page does before
    // ever rendering the payment form -- a resumed appointment (rejoin, or
    // the 24h free-follow-up window) can already be "paid" here, and the
    // mobile app needs to know that up front to skip the Payment screen
    // entirely instead of making the patient tap through a form that would
    // just no-op the charge.
    const { data: appointment } = await service
      .from("appointments")
      .select("payment_status")
      .eq("id", appointmentId)
      .maybeSingle();

    return NextResponse.json({ ok: true, appointmentId, alreadyPaid: appointment?.payment_status === "paid" });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not book this consultation." },
      { status: 500 }
    );
  }
}
