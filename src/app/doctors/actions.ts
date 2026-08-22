"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { createPatientSession, clearPatientSession, getPatientSession } from "@/lib/patient-session";
import { createPatientAccountRecord } from "@/lib/patient-account";
import { getDefaultService } from "@/lib/default-service";
import { QUALIFICATION_MODEL_NAME } from "@/lib/ai/model";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { Locale, QualificationResult } from "@/lib/types";

const REJOIN_WINDOW_HOURS = 24;

// A returning patient clicking "book" for a doctor they already have an
// open appointment with shouldn't get a brand new one -- whether that
// existing appointment is already paid (rejoin the same call) or still
// pending (resume the same payment instead of abandoning it and starting
// over). /consultation/[id]/pay already redirects straight through to the
// call room when payment_status is "paid", so returning either kind here is
// safe even though every caller always routes through /pay next.
async function findResumableAppointment(
  service: ReturnType<typeof createServiceClient>,
  patientId: string,
  providerId: string
): Promise<string | null> {
  const rejoinWindowStart = new Date(Date.now() - REJOIN_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { data: existingAppointment } = await service
    .from("appointments")
    .select("id")
    .eq("patient_id", patientId)
    .eq("provider_id", providerId)
    .in("payment_status", ["pending", "paid"])
    .in("status", ["waiting", "in_progress"])
    .gte("scheduled_at", rejoinWindowStart)
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (existingAppointment?.id as string) ?? null;
}

export async function bookConsultation(input: {
  providerId: string;
  locale: Locale;
  qualification: QualificationResult | null;
}): Promise<string> {
  const session = await getPatientSession();
  if (!session) {
    throw new Error("Your session expired. Please start the intake chat again.");
  }

  const service = createServiceClient();
  const existingAppointmentId = await findResumableAppointment(service, session.patientId, input.providerId);
  if (existingAppointmentId) {
    return existingAppointmentId;
  }

  return bookConsultationForPatient({
    patientId: session.patientId,
    providerId: input.providerId,
    locale: input.locale,
    qualification: input.qualification,
  });
}

// For a patient who skips Afya24's AI intake and books a doctor directly.
// Used to unconditionally create a fresh patient + session every time this
// ran, even for a patient who already had a live session from an earlier,
// unpaid attempt (e.g. they filled this same form, reached /pay, left
// without paying, and came back and filled it again) -- that silently
// overwrote their session cookie with a brand new patientId, so the old
// appointment's ownership check on /pay stopped matching and it looked to
// them like their details had simply vanished. Reusing an existing session
// (and updating that same patient row with whatever they just typed, in
// case they corrected something) keeps their identity -- and therefore
// their pending appointment -- continuous across the whole flow.
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

  // Same account-creation risk as /account/sign-up (no session exists yet
  // to gate on) -- reuses the signup bucket rather than a dedicated one.
  const { allowed } = await checkRateLimit("signup", await getClientIp());
  if (!allowed) {
    throw new Error("Too many attempts. Please wait a few minutes and try again.");
  }

  const normalizedPhone = normalizeTanzanianPhoneToE164(phone);
  const service = createServiceClient();
  const existingSession = await getPatientSession();
  const existingPatient = existingSession
    ? await service.from("patients").select("id").eq("id", existingSession.patientId).maybeSingle()
    : null;

  let patientId: string;
  if (existingPatient?.data) {
    patientId = existingPatient.data.id as string;
    await service
      .from("patients")
      .update({
        full_name: fullName,
        phone: normalizedPhone,
        date_of_birth: input.dateOfBirth,
        gender: input.gender,
        preferred_language: input.locale,
      })
      .eq("id", patientId);
  } else {
    const record = await createPatientAccountRecord({
      fullName,
      phone: normalizedPhone,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      preferredLanguage: input.locale,
    });
    patientId = record.patientId;
    await createPatientSession(patientId);
  }

  const existingAppointmentId = await findResumableAppointment(service, patientId, input.providerId);
  if (existingAppointmentId) {
    return existingAppointmentId;
  }

  return bookConsultationForPatient({
    patientId,
    providerId: input.providerId,
    locale: input.locale,
    qualification: null,
  });
}

// The "Continuing as {name}" shortcut on the doctor page assumes whoever
// holds this browser/phone is the same patient the saved session belongs
// to -- not a safe assumption on a shared or borrowed phone. This clears
// that session and sends them back to the same doctor's page, which then
// renders as a first-time visitor and shows the normal name/phone/DOB form
// again for whoever is actually booking now.
export async function startOverAsNewPatient(providerId: string) {
  await clearPatientSession();
  redirect(`/doctors/${providerId}`);
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
