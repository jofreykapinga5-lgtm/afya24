import { NextResponse } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import { patientAccessCutoff } from "@/lib/video/queue";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const appointmentId = body?.appointmentId;
  if (!appointmentId || typeof appointmentId !== "string") {
    return NextResponse.json({ error: "Appointment id is required." }, { status: 400 });
  }

  const patientSession = await getPatientSession();
  if (!patientSession) {
    return NextResponse.json({ error: "Patient session expired." }, { status: 401 });
  }

  const service = createServiceClient();
  const now = new Date().toISOString();
  const { data: appointment } = await service
    .from("appointments")
    .select("id, queue_joined_at")
    .eq("id", appointmentId)
    .eq("patient_id", patientSession.patientId)
    .eq("payment_status", "paid")
    .in("status", ["waiting", "in_progress"])
    .gte("scheduled_at", patientAccessCutoff())
    .maybeSingle();

  if (!appointment) {
    return NextResponse.json({ error: "This consultation is no longer in the queue." }, { status: 404 });
  }

  const { error } = await service
    .from("appointments")
    .update({
      queue_joined_at: appointment.queue_joined_at ?? now,
      queue_last_seen_at: now,
    })
    .eq("id", appointment.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

