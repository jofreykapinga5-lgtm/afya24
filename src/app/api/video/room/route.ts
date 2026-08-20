import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPatientSession } from "@/lib/patient-session";
import { createMeetingToken, getOrCreateRoomForAppointment, listRoomParticipantIdentities } from "@/lib/video/livekit";
import { hasRecentQueueHeartbeat, patientAccessCutoff, PATIENT_ACCESS_WINDOW_HOURS } from "@/lib/video/queue";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

// Creates (or reuses) a LiveKit room for an appointment and returns an access
// token scoped to whoever is calling -- the assigned provider or the patient
// on that appointment, verified below. Nobody else gets a token, so knowing
// an appointment id alone isn't enough to join someone else's consultation.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const appointmentId = body?.appointmentId;
  const queueCheckOnly = body?.queueCheckOnly === true;
  const locale: Locale = body?.locale === "sw" ? "sw" : "en";
  if (!appointmentId || typeof appointmentId !== "string") {
    return NextResponse.json(
      { error: t("error_appointment_id_required", locale) },
      { status: 400 }
    );
  }

  try {
    return await joinRoom(appointmentId, locale, queueCheckOnly);
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

async function joinRoom(appointmentId: string, locale: Locale, queueCheckOnly: boolean) {
  const service = createServiceClient();
  const { data: appointment } = await service
    .from("appointments")
    .select("id, patient_id, provider_id, payment_status, scheduled_at, status, queue_joined_at")
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

  if (isPatient && appointment.status !== "waiting" && appointment.status !== "in_progress") {
    return NextResponse.json(
      { error: t("error_access_window_expired", locale) },
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

  if (isPatient) {
    const now = new Date().toISOString();
    const { error: heartbeatError } = await service
      .from("appointments")
      .update({
        queue_joined_at: appointment.queue_joined_at ?? now,
        queue_last_seen_at: now,
      })
      .eq("id", appointment.id)
      .eq("payment_status", "paid")
      .in("status", ["waiting", "in_progress"]);

    if (heartbeatError) {
      throw new Error(`Could not join the patient queue: ${heartbeatError.message}`);
    }
  }

  // A patient can only join once the doctor is actually free for them --
  // otherwise the first patient to hit this route each time the doctor
  // finishes with someone would win the room regardless of booking order.
  // "Free" means: no other appointment for this provider is in_progress, and
  // no other waiting appointment for this provider was scheduled earlier.
  // Providers are never subject to this -- they choose who to join from the
  // dashboard queue themselves.
  if (isPatient) {
    const { data: queueRows } = await service
      .from("appointments")
      .select("id, status, scheduled_at, queue_last_seen_at")
      .eq("provider_id", appointment.provider_id)
      .eq("payment_status", "paid")
      .in("status", ["waiting", "in_progress"])
      .gte("scheduled_at", patientAccessCutoff())
      .neq("id", appointment.id);

    const queueIds = (queueRows ?? []).map((row) => row.id);
    const [{ data: queueOrders }, { data: queueSessions }] = queueIds.length
      ? await Promise.all([
          service
            .from("consultation_orders")
            .select("appointment_id, consultation_mode")
            .in("appointment_id", queueIds),
          service
            .from("video_sessions")
            .select("appointment_id, room_name")
            .in("appointment_id", queueIds),
        ])
      : [{ data: [] }, { data: [] }];

    const inAppAppointmentIds = new Set(
      (queueOrders ?? [])
        .filter((order) => order.consultation_mode === "voice" || order.consultation_mode === "video")
        .map((order) => order.appointment_id as string)
    );
    const roomByAppointmentId = new Map(
      (queueSessions ?? []).map((session) => [
        session.appointment_id as string,
        session.room_name as string | null,
      ])
    );

    const activeQueueRows = (
      await Promise.all(
        (queueRows ?? []).map(async (row) => {
          if (!inAppAppointmentIds.has(row.id)) return null;
          if (hasRecentQueueHeartbeat(row.queue_last_seen_at)) return row;
          if (row.status !== "in_progress") return null;

          const roomName = roomByAppointmentId.get(row.id);
          if (!roomName) return null;
          const participants = await listRoomParticipantIdentities(roomName);
          return participants.some(
            (identity) => identity.startsWith("patient-") || identity.startsWith("provider-")
          )
            ? row
            : null;
        })
      )
    ).filter((row): row is NonNullable<typeof row> => Boolean(row));

    const doctorBusy = activeQueueRows.some((row) => row.status === "in_progress");
    const patientsAhead = activeQueueRows.filter(
      (row) =>
        row.status === "waiting" &&
        new Date(row.scheduled_at).getTime() < new Date(appointment.scheduled_at).getTime()
    ).length;
    const position = patientsAhead + (doctorBusy ? 1 : 0) + 1;

    if (position > 1) {
      return NextResponse.json(
        { error: t("error_waiting_turn", locale), code: "WAITING_TURN", position },
        { status: 403 }
      );
    }
  }

  if (isPatient && queueCheckOnly) {
    return NextResponse.json({ ready: true });
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
