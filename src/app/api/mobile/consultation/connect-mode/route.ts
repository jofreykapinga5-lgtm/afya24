import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPatientSession } from "@/lib/patient-session";

// Mobile-native equivalent of consultation/actions.ts's selectConnectionMode
// -- corrects the "video" placeholder bookConsultationForPatient wrote at
// booking time to whichever mode the patient actually picked on the Connect
// screen, so the doctor's video queue agrees with reality.
export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const appointmentId = typeof body?.appointmentId === "string" ? body.appointmentId : "";
  const mode = body?.mode === "voice" || body?.mode === "video" ? body.mode : null;
  if (!appointmentId || !mode) {
    return NextResponse.json({ ok: false, error: "Missing appointmentId or mode." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: appointment } = await service
    .from("appointments")
    .select("id, payment_status")
    .eq("id", appointmentId)
    .eq("patient_id", session.patientId)
    .maybeSingle();

  if (!appointment) {
    return NextResponse.json({ ok: false, error: "Not authorized for this appointment." }, { status: 403 });
  }
  if (appointment.payment_status !== "paid") {
    return NextResponse.json({ ok: false, error: "Payment is required before you can join this consultation." }, { status: 409 });
  }

  const { error } = await service.from("consultation_orders").update({ consultation_mode: mode }).eq("appointment_id", appointmentId);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
