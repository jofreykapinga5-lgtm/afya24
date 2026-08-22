import { listRoomParticipantIdentities } from "@/lib/video/livekit";
import { getDoctorDashboardContext } from "../doctor-context";
import { DoctorCallPanel } from "../call-panel";
import { DoctorVideoQueue } from "../video-queue";
import { hasRecentQueueHeartbeat, patientAccessCutoff } from "@/lib/video/queue";
import { toTitleCase } from "@/lib/format-name";

type WaitingAppointment = {
  id: string;
  patient_id: string;
  scheduled_at: string;
  doctor_notes: string | null;
  queue_last_seen_at: string | null;
  // ai_summaries.appointment_id and consultation_orders.appointment_id have
  // no unique constraint, so PostgREST embeds these as arrays, not objects.
  // files is a genuine one-to-many relationship, so it's an array too.
  // video_sessions is disambiguated to the appointment_id FK (appointments
  // also has its own video_session_id FK to the same table), which is
  // one-to-one, so PostgREST embeds it as a single object, not an array.
  patients: { full_name: string; hospital_reference_number: string } | null;
  ai_summaries: { summary_text: string; urgency_level: string }[] | null;
  consultation_orders: { consultation_mode: string }[] | null;
  video_sessions: { room_name: string | null; status: string | null } | null;
  files: { id: string; original_filename: string | null; attachment_kind: string | null; storage_path: string }[] | null;
};

export default async function DoctorPatientsPage() {
  const { provider, service } = await getDoctorDashboardContext();

  const { data: waitingAppointments } = provider
    ? await service
        .from("appointments")
        .select(
          "id, patient_id, scheduled_at, doctor_notes, queue_last_seen_at, patients(full_name, hospital_reference_number), ai_summaries(summary_text, urgency_level), consultation_orders(consultation_mode), video_sessions!video_sessions_appointment_id_fkey(room_name, status), files(id, original_filename, attachment_kind, storage_path)"
        )
        .eq("provider_id", provider.id)
        .eq("payment_status", "paid")
        .in("status", ["waiting", "in_progress"])
        .gte("scheduled_at", patientAccessCutoff())
        .order("scheduled_at", { ascending: true })
        .returns<WaitingAppointment[]>()
    : { data: [] as WaitingAppointment[] };

  const videoAppointments = (waitingAppointments ?? []).filter(
    (appointment) =>
      ["voice", "video"].includes(appointment.consultation_orders?.[0]?.consultation_mode ?? "") &&
      hasRecentQueueHeartbeat(appointment.queue_last_seen_at) &&
      Boolean(appointment.video_sessions?.room_name)
  );

  const patientOnlineByAppointmentId = new Map<string, boolean>();
  await Promise.all(
    videoAppointments.map(async (appointment) => {
      const roomName = appointment.video_sessions?.room_name;
      if (!roomName) {
        patientOnlineByAppointmentId.set(appointment.id, false);
        return;
      }

      const participantIds = await listRoomParticipantIdentities(roomName);
      patientOnlineByAppointmentId.set(
        appointment.id,
        participantIds.some((identity) => identity.startsWith("patient-"))
      );
    })
  );

  // Attachments live in a private bucket -- generate short-lived signed URLs
  // for whatever's in the queue right now rather than making the bucket
  // public. One batch call covers every file across every waiting appointment.
  const allStoragePaths = videoAppointments.flatMap(
    (appointment) => appointment.files?.map((file) => file.storage_path) ?? []
  );
  const signedUrlByPath = new Map<string, string>();
  if (allStoragePaths.length > 0) {
    const { data: signedUrls } = await service.storage
      .from("patient-attachments")
      .createSignedUrls(allStoragePaths, 600);
    signedUrls?.forEach((entry) => {
      if (entry.signedUrl) signedUrlByPath.set(entry.path ?? "", entry.signedUrl);
    });
  }

  const initialVideoQueueItems = videoAppointments.map((appointment) => {
    const summary = appointment.ai_summaries?.[0];
    const patientOnline = patientOnlineByAppointmentId.get(appointment.id) ?? false;
    return {
      id: appointment.id,
      patientId: appointment.patient_id,
      scheduledAt: appointment.scheduled_at,
      status: "waiting",
      patientName: toTitleCase(appointment.patients?.full_name ?? "Patient"),
      patientReference: appointment.patients?.hospital_reference_number ?? "",
      urgencyLevel: summary?.urgency_level ?? "low",
      summaryText: summary?.summary_text ?? "",
      doctorNotes: appointment.doctor_notes ?? "",
      consultationMode: appointment.consultation_orders?.[0]?.consultation_mode === "voice" ? "voice" as const : "video" as const,
      patientOnline,
      files: (appointment.files ?? []).map((file) => ({
        id: file.id,
        name: file.original_filename ?? "File",
        kind: file.attachment_kind ?? "file",
        url: signedUrlByPath.get(file.storage_path) ?? null,
      })),
    };
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:items-start">
      <DoctorVideoQueue initialItems={initialVideoQueueItems} />
      <DoctorCallPanel />
    </div>
  );
}
