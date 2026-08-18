import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { listRoomParticipantIdentities } from "@/lib/video/livekit";

type AppointmentRow = {
  id: string;
  patient_id: string;
  scheduled_at: string;
  status: string;
  doctor_notes: string | null;
  patients: { full_name: string; hospital_reference_number: string } | null;
};

type SummaryRow = {
  appointment_id: string;
  summary_text: string;
  urgency_level: string;
};

type FileRow = {
  id: string;
  appointment_id: string;
  original_filename: string | null;
  attachment_kind: string | null;
  storage_path: string;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: profile } = await service
    .from("users")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "doctor" || profile.status !== "active") {
    return NextResponse.json({ error: "Doctor access required." }, { status: 403 });
  }

  const { data: provider } = await service
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .eq("profile_status", "active")
    .maybeSingle();

  if (!provider) {
    return NextResponse.json({ items: [] });
  }

  const { data: appointments } = await service
    .from("appointments")
    .select("id, patient_id, scheduled_at, status, doctor_notes, patients(full_name, hospital_reference_number)")
    .eq("provider_id", provider.id)
    .in("status", ["waiting", "in_progress"])
    .order("scheduled_at", { ascending: true })
    .returns<AppointmentRow[]>();

  const appointmentRows = appointments ?? [];
  const appointmentIds = appointmentRows.map((appointment) => appointment.id);
  if (appointmentIds.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const [{ data: orders }, { data: sessions }, { data: summaries }, { data: files }] =
    await Promise.all([
      service
        .from("consultation_orders")
        .select("appointment_id, consultation_mode")
        .in("appointment_id", appointmentIds),
      service
        .from("video_sessions")
        .select("appointment_id, room_name, status")
        .in("appointment_id", appointmentIds),
      service
        .from("ai_summaries")
        .select("appointment_id, summary_text, urgency_level")
        .in("appointment_id", appointmentIds)
        .returns<SummaryRow[]>(),
      service
        .from("files")
        .select("id, appointment_id, original_filename, attachment_kind, storage_path")
        .in("appointment_id", appointmentIds)
        .returns<FileRow[]>(),
    ]);

  const videoAppointmentIds = new Set(
    (orders ?? [])
      .filter((order) => order.consultation_mode === "video")
      .map((order) => order.appointment_id as string)
  );
  const sessionByAppointment = new Map(
    (sessions ?? []).map((session) => [
      session.appointment_id as string,
      {
        roomName: session.room_name as string | null,
        status: session.status as string | null,
      },
    ])
  );
  const summaryByAppointment = new Map(
    (summaries ?? []).map((summary) => [summary.appointment_id, summary])
  );
  const filesByAppointment = new Map<string, FileRow[]>();
  for (const file of files ?? []) {
    if (!file.appointment_id) continue;
    filesByAppointment.set(file.appointment_id, [
      ...(filesByAppointment.get(file.appointment_id) ?? []),
      file,
    ]);
  }

  const storagePaths = (files ?? []).map((file) => file.storage_path);
  const signedUrlByPath = new Map<string, string>();
  if (storagePaths.length > 0) {
    const { data: signedUrls } = await service.storage
      .from("patient-attachments")
      .createSignedUrls(storagePaths, 600);
    signedUrls?.forEach((entry) => {
      if (entry.signedUrl) signedUrlByPath.set(entry.path ?? "", entry.signedUrl);
    });
  }

  const activeVideoAppointments = appointmentRows.filter((appointment) => {
    const session = sessionByAppointment.get(appointment.id);
    return videoAppointmentIds.has(appointment.id) && Boolean(session?.roomName);
  });

  const items = await Promise.all(
    activeVideoAppointments.map(async (appointment) => {
      const session = sessionByAppointment.get(appointment.id);
      const participantIds = session?.roomName
        ? await listRoomParticipantIdentities(session.roomName)
        : [];
      const patientOnline = participantIds.some((identity) => identity.startsWith("patient-"));
      const summary = summaryByAppointment.get(appointment.id);
      const appointmentFiles = filesByAppointment.get(appointment.id) ?? [];

      return {
        id: appointment.id,
        patientId: appointment.patient_id,
        scheduledAt: appointment.scheduled_at,
        status: appointment.status,
        patientName: appointment.patients?.full_name ?? "Patient",
        patientReference: appointment.patients?.hospital_reference_number ?? "",
        urgencyLevel: summary?.urgency_level ?? "low",
        summaryText: summary?.summary_text ?? "",
        doctorNotes: appointment.doctor_notes ?? "",
        patientOnline,
        files: appointmentFiles.map((file) => ({
          id: file.id,
          name: file.original_filename ?? "File",
          kind: file.attachment_kind ?? "file",
          url: signedUrlByPath.get(file.storage_path) ?? null,
        })),
      };
    })
  );

  return NextResponse.json({ items });
}
