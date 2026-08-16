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

  try {
    return await joinRoom(appointmentId, locale);
  } catch (error) {
    // Without this, an unexpected failure here (a LiveKit API call
    // erroring out, a bad LIVEKIT_* env value, a transient network blip)
    // would crash out of the route handler entirely -- the client would
    // get Next's default HTML error page instead of JSON, and
    // `response.json()` on the consultation page would throw its own
    // confusing "unexpected token '<'" parse error instead of showing the
    // real problem. Always return a clean, readable JSON error instead.
    console.error("POST /api/video/room failed", error);
    const message = error instanceof Error ? error.message : "Could not start the call.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const PATIENT_ACCESS_WINDOW_HOURS = 24;

async function joinRoom(appointmentId: string, locale: Locale) {
  const service = createServiceClient();
  const { data: appointment } = await service
    .from("appointments")
    .select("id, patient_id, provider_id, payment_status, scheduled_at")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment) {
    return NextResponse.json({ error: t("error_appointment_not_found", locale) }, { status: 404 });
  }

  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    patientSession,
    { data: providerRow },
  ] = await Promise.all([
    supabase.auth.getUser(),
    getPatientSession(),
    service.from("providers").select("user_id, full_name").eq("id", appointment.provider_id).maybeSingle(),
  ]);

  const isProvider = Boolean(user && providerRow?.user_id === user.id);
  const isPatient = Boolean(patientSession && patientSession.patientId === appointment.patient_id);

  if (!isProvider && !isPatient) {
    return NextResponse.json(
      { error: t("error_not_authorized_appointment", locale) },
      { status: 403 }
    );
  }

  // Payment is now collected before a patient ever reaches this route (see
  // consultation/[appointmentId]/pay) -- this is the server-side enforcement
  // of that, not just a UI nicety, since a patient could otherwise hit this
  // endpoint directly for an appointment they never paid for. Providers are
  // never subject to this -- payment timing is a patient-side concern, not
  // a reason to lock a doctor out of their own appointment. `code` lets the
  // client distinguish this from other 403s and link back to /pay instead
  // of showing a dead-end error.
  if (isPatient && appointment.payment_status !== "paid") {
    return NextResponse.json(
      { error: t("error_payment_required", locale), code: "PAYMENT_REQUIRED" },
      { status: 403 }
    );
  }

  // Once a patient has paid, they can rejoin (dropped call, doctor running
  // late, a follow-up message) for 24 hours from when the visit was booked
  // -- scheduled_at is set once at booking and never touched again, so it's
  // a stable anchor. Providers are never subject to this either.
  if (isPatient) {
    const hoursSinceBooked =
      (Date.now() - new Date(appointment.scheduled_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceBooked > PATIENT_ACCESS_WINDOW_HOURS) {
      return NextResponse.json(
        { error: t("error_access_window_expired", locale) },
        { status: 403 }
      );
    }
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

  let videoSessionId: string | null = null;
  if (isPatient) {
    const { data: session } = await service.from("video_sessions").upsert(
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
    ).select("id").single();
    videoSessionId = session?.id ?? null;
  } else {
    const { data: existingSession } = await service
      .from("video_sessions")
      .select("id")
      .eq("appointment_id", appointment.id)
      .maybeSingle();

    if (!existingSession) {
      const { data: session } = await service.from("video_sessions").insert({
        appointment_id: appointment.id,
        provider_id: appointment.provider_id,
        patient_id: appointment.patient_id,
        room_provider: "livekit",
        room_name: room.name,
        join_url: room.url,
        status: "connecting",
      }).select("id").single();
      videoSessionId = session?.id ?? null;
    } else {
      videoSessionId = existingSession.id as string;
    }
  }

  if (videoSessionId) {
    await service
      .from("appointments")
      .update({ video_session_id: videoSessionId })
      .eq("id", appointment.id);
  }

  return NextResponse.json({
    serverUrl: room.url,
    token,
    role: isProvider ? "provider" : "patient",
    patientHasFullAccount,
  });
}
