"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { createPatientSession, getPatientSession } from "@/lib/patient-session";
import { createPatientAccountRecord } from "@/lib/patient-account";
import { getDefaultService } from "@/lib/default-service";
import { QUALIFICATION_MODEL_NAME } from "@/lib/ai/model";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import type { Locale, QualificationResult } from "@/lib/types";

const REJOIN_WINDOW_HOURS = 24;

export async function bookConsultation(input: {
  providerId: string;
  locale: Locale;
  qualification: QualificationResult | null;
}): Promise<string> {
  const session = await getPatientSession();
  if (!session) {
    throw new Error("Your session expired. Please start the intake chat again.");
  }

  // A returning patient clicking "book" with an already-resolved session
  // shouldn't be charged again for a visit they already paid for -- if they
  // still have a paid, not-yet-finished appointment with this exact doctor
  // from within the last 24 hours, hand that one back instead of creating
  // (and billing) a brand new one. /consultation/[id]/pay already redirects
  // straight through to the call room when payment_status is "paid", so
  // this is safe even though the caller always routes through /pay next.
  const service = createServiceClient();
  const rejoinWindowStart = new Date(Date.now() - REJOIN_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { data: existingAppointment } = await service
    .from("appointments")
    .select("id")
    .eq("patient_id", session.patientId)
    .eq("provider_id", input.providerId)
    .eq("payment_status", "paid")
    .in("status", ["waiting", "in_progress"])
    .gte("scheduled_at", rejoinWindowStart)
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingAppointment) {
    return existingAppointment.id as string;
  }

  return bookConsultationForPatient({
    patientId: session.patientId,
    providerId: input.providerId,
    locale: input.locale,
    qualification: input.qualification,
  });
}

// For a patient who skips Afya24's AI intake and books a doctor directly --
// no qualification chat means no patient record or session exists yet, so
// this creates both from the form fields (same shape as the AI flow's
// createPatientAccountRecord) before booking exactly like the normal path.
// The reference number this mints is still the patient's real, permanent
// file number -- it's surfaced to them on the payment page rather than here,
// since that's the moment the booking is actually confirmed as real.
export async function bookConsultationDirect(input: {
  providerId: string;
  locale: Locale;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: "female" | "male" | "other";
}): Promise<string> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();

  if (!fullName || !phone || !input.dateOfBirth) {
    throw new Error("Full name, phone number, and date of birth are required.");
  }

  const record = await createPatientAccountRecord({
    fullName,
    phone: normalizeTanzanianPhoneToE164(phone),
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    preferredLanguage: input.locale,
  });

  await createPatientSession(record.patientId);

  return bookConsultationForPatient({
    patientId: record.patientId,
    providerId: input.providerId,
    locale: input.locale,
    qualification: null,
  });
}

async function bookConsultationForPatient(input: {
  patientId: string;
  providerId: string;
  locale: Locale;
  qualification: QualificationResult | null;
}): Promise<string> {
  const service = createServiceClient();
  const defaultService = await getDefaultService(service);

  const { data: appointment, error: appointmentError } = await service
    .from("appointments")
    .insert({
      patient_id: input.patientId,
      provider_id: input.providerId,
      service_id: defaultService.id,
      scheduled_at: new Date().toISOString(),
      status: "waiting",
      // Starts pending -- the patient is routed to /consultation/[id]/pay
      // next (see booking-form.tsx / direct-booking-form.tsx), and the
      // Snippe payment flow is what actually flips this to "paid".
      payment_status: "pending",
      price: defaultService.basePrice,
      currency: "TZS",
    })
    .select("id")
    .single();

  if (appointmentError || !appointment) {
    throw new Error(appointmentError?.message ?? "Could not create appointment.");
  }

  const appointmentId = appointment.id as string;

  const { error: orderError } = await service.from("consultation_orders").insert({
    patient_id: input.patientId,
    provider_id: input.providerId,
    service_id: defaultService.id,
    appointment_id: appointmentId,
    // Placeholder -- the patient doesn't choose how to connect until the
    // /consultation/[id]/connect screen, after payment. selectConnectionMode
    // below corrects this once they actually pick in-app voice or video; it's
    // left untouched if they pick a phone call or WhatsApp instead, since
    // those never create a video_session or need to appear in any queue.
    consultation_mode: "video",
    subtotal: defaultService.basePrice,
    fees: 0,
    total: defaultService.basePrice,
    currency: "TZS",
    // Mirrors appointments.payment_status above -- an admin confirming
    // payment updates the appointment; nothing currently reads this
    // duplicate status off consultation_orders, but it shouldn't silently
    // disagree with the real one.
    status: "pending",
  });

  if (orderError) {
    throw new Error(orderError.message);
  }

  // Attachments uploaded during the qualification chat (POST
  // /api/patient-attachments) are stamped with patient_id at upload time but
  // have no appointment_id yet -- there was no appointment yet. Claim any of
  // this patient's still-unclaimed files for this visit now. Scoped to
  // appointment_id is null (not just "most recent") so an earlier booked
  // visit's files are never reassigned.
  await service
    .from("files")
    .update({ appointment_id: appointmentId })
    .eq("patient_id", input.patientId)
    .is("appointment_id", null);

  // The patient may have hard-refreshed between /qualification and here --
  // qualificationResult lives only in memory (same convention store.ts
  // already uses for `booking`/cart). Booking still succeeds structurally;
  // these two inserts are just skipped for that appointment.
  const q = input.qualification;
  if (q) {
    await service.from("symptom_intakes").insert({
      appointment_id: appointmentId,
      language: input.locale,
      raw_patient_explanation: q.patientConfirmedSummary,
      chief_complaint: q.chiefComplaint ?? null,
      symptoms: q.symptoms ?? [],
      duration: q.duration ?? null,
      medications: q.medications ?? [],
      allergies: q.allergies ?? [],
      existing_conditions: q.existingConditions ?? [],
      emergency_warning_acknowledged: false,
    });

    await service.from("ai_summaries").insert({
      appointment_id: appointmentId,
      source_language: input.locale,
      output_language: input.locale,
      summary_text: q.summaryForDoctor,
      structured_summary_json: q,
      suggested_follow_up_questions: q.missingInformation,
      urgency_level: q.urgencyLevel,
      safety_flags: [],
      model_name: QUALIFICATION_MODEL_NAME,
      reviewed_by_doctor: false,
    });
  }

  return appointmentId;
}
