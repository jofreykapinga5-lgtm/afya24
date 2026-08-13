import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPatientSession } from "@/lib/patient-session";
import { createMeetingToken, getOrCreateRoomForAppointment } from "@/lib/video/livekit";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

// Creates (or reuses) a LiveKit room for an appointment and returns an access
// token scoped to whoever is calling -- the assigned provider or the patient
// on that appointment, verified below. Nobody else gets a token, so knowing
// an appointment id alone isn't enough to join someone else's consultation.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const appointmentId = body?.appointmentId;
  const locale: Locale = body?.locale === "sw" ? "sw" : "en";
  if (!appointmentId || typeof appointmentId !== "string") {
    return NextResponse.json(
      { error: t("error_appointment_id_required", locale) },
      { status: 400 }
    );
  }

  const service = createServiceClient();
  const { data: appointment } = await service
    .from("appointments")
    .select("id, patient_id, provider_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment) {
    return NextResponse.json({ error: t("error_appointment_not_found", locale) }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const patientSession = await getPatientSession();

  const { data: providerRow } = await service
    .from("providers")
    .select("user_id, full_name")
    .eq("id", appointment.provider_id)
    .maybeSingle();

  const isProvider = Boolean(user && providerRow?.user_id === user.id);
  const isPatient = Boolean(patientSession && patientSession.patientId === appointment.patient_id);

  if (!isProvider && !isPatient) {
    return NextResponse.json(
      { error: t("error_not_authorized_appointment", locale) },
      { status: 403 }
    );
  }

  let userName = "Guest";
  let patientHasFullAccount = false;
  if (isProvider) {
    userName = providerRow?.full_name ?? "Doctor";
  } else {
    const { data: patientRow } = await service
      .from("patients")
      .select("full_name, user_id")
      .eq("id", appointment.patient_id)
      .maybeSingle();
    userName = patientRow?.full_name ?? "Patient";
    patientHasFullAccount = Boolean(patientRow?.user_id);
  }

  const room = await getOrCreateRoomForAppointment(appointment.id);
  const token = await createMeetingToken(room.name, userName, isProvider);

  if (isPatient) {
    await service.from("video_sessions").upsert(
      {
        appointment_id: appointment.id,
        provider_id: appointment.provider_id,
        patient_id: appointment.patient_id,
        room_provider: "livekit",
        room_name: room.name,
        join_url: room.url,
        status: "active",
        started_at: new Date().toISOString(),
      },
      { onConflict: "appointment_id" }
    );
  } else {
    const { data: existingSession } = await service
      .from("video_sessions")
      .select("id")
      .eq("appointment_id", appointment.id)
      .maybeSingle();

    if (!existingSession) {
      await service.from("video_sessions").insert({
        appointment_id: appointment.id,
        provider_id: appointment.provider_id,
        patient_id: appointment.patient_id,
        room_provider: "livekit",
        room_name: room.name,
        join_url: room.url,
        status: "connecting",
      });
    }
  }

  return NextResponse.json({
    serverUrl: room.url,
    token,
    role: isProvider ? "provider" : "patient",
    patientHasFullAccount,
  });
}
