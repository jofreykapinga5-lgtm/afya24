"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { clearPatientSession, createPatientSession, getPatientSession } from "@/lib/patient-session";
import { createPatientAccountRecord } from "@/lib/patient-account";
import { createPatientNotification } from "@/lib/patient-notifications";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { getDefaultService } from "@/lib/default-service";
import { QUALIFICATION_MODEL_NAME } from "@/lib/ai/model";
import { t } from "@/lib/i18n";
import type { Locale, QualificationResult } from "@/lib/types";

const REJOIN_WINDOW_HOURS = 24;

// A returning patient clicking "book" for a doctor they already have an
// open appointment with shouldn't get a brand new one -- whether that
// existing appointment is already paid (rejoin the same call) or still
// pending (resume the same payment instead of abandoning it and starting
// over). /consultation/[id]/pay already redirects straight through to the
// call room when payment_status is "paid", so returning either kind here is
// safe even though every caller always routes through /pay next.
export async function findResumableAppointment(
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

// Once a patient has paid for a visit with a doctor, they get 24 hours of
// free follow-up access to that SAME doctor -- a real product decision, not
// just "rejoin the call you didn't finish" (findResumableAppointment above
// covers that separate, narrower case: an appointment still waiting/
// in_progress). This checks for ANY paid appointment in the window,
// completed ones included, since a doctor a patient already paid to see
// this morning shouldn't charge again for a follow-up message this
// afternoon.
async function hasRecentPaidVisit(
  service: ReturnType<typeof createServiceClient>,
  patientId: string,
  providerId: string
): Promise<boolean> {
  const rejoinWindowStart = new Date(Date.now() - REJOIN_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { data } = await service
    .from("appointments")
    .select("id")
    .eq("patient_id", patientId)
    .eq("provider_id", providerId)
    .eq("payment_status", "paid")
    .gte("scheduled_at", rejoinWindowStart)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export type BookConsultationResult = { ok: true; appointmentId: string } | { ok: false; message: string };

// Returns a result object rather than throwing -- a thrown Error from a
// Server Action never reaches the client's try/catch with a readable
// message in production (React error #441, confirmed against this exact
// action; see the same pattern in consultation/actions.ts's
// initiateSnippePayment). Returning a value sidesteps that entirely.
export async function bookConsultation(input: {
  providerId: string;
  locale: Locale;
  qualification: QualificationResult | null;
}): Promise<BookConsultationResult> {
  try {
    const session = await getPatientSession();
    if (!session) {
      return { ok: false, message: "Your session expired. Please start the intake chat again." };
    }

    const service = createServiceClient();
    const existingAppointmentId = await findResumableAppointment(service, session.patientId, input.providerId);
    if (existingAppointmentId) {
      return { ok: true, appointmentId: existingAppointmentId };
    }

    const appointmentId = await bookConsultationForPatient({
      patientId: session.patientId,
      providerId: input.providerId,
      locale: input.locale,
      qualification: input.qualification,
    });
    return { ok: true, appointmentId };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not book this consultation." };
  }
}

// The dedicated "continue without an account" page's own booking action --
// name + phone only, no password. Creates the lightweight patient record,
// signs it in the same way createPatientAccountFallback does, then goes
// straight through to booking THIS specific provider instead of stopping at
// a "continue as X" confirmation, since the patient just typed their name a
// moment ago on the previous screen.
export async function bookAsGuest(input: {
  fullName: string;
  phone: string;
  providerId: string;
  locale: Locale;
  qualification: QualificationResult | null;
}): Promise<BookConsultationResult> {
  try {
    const fullName = input.fullName.trim();
    const phone = input.phone.trim();
    if (!fullName || !phone) {
      return { ok: false, message: t("error_fill_all_fields", input.locale) };
    }

    const normalizedPhone = normalizeTanzanianPhoneToE164(phone);
    const service = createServiceClient();

    // A phone can already belong to a patient record from an earlier visit,
    // and it can be shared within a family -- same guard as
    // createPatientAccountFallback, so this never silently reuses or
    // overwrites a record that might belong to someone else.
    const { data: phoneMatch } = await service
      .from("patients")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();
    if (phoneMatch) {
      return { ok: false, message: t("doctor_direct_booking_phone_exists", input.locale) };
    }

    const record = await createPatientAccountRecord({
      fullName,
      phone: normalizedPhone,
      preferredLanguage: input.locale,
    });
    await createPatientSession(record.patientId);

    const existingAppointmentId = await findResumableAppointment(service, record.patientId, input.providerId);
    if (existingAppointmentId) {
      return { ok: true, appointmentId: existingAppointmentId };
    }

    const appointmentId = await bookConsultationForPatient({
      patientId: record.patientId,
      providerId: input.providerId,
      locale: input.locale,
      qualification: input.qualification,
    });
    return { ok: true, appointmentId };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not book this consultation." };
  }
}

// The "Continuing as {name}" shortcut on the doctor page assumes whoever
// holds this browser/phone is the same patient the saved session belongs
// to -- not a safe assumption on a shared or borrowed phone. This clears
// that session and sends them back to the same doctor's page, which then
// renders as a first-time visitor and prompts for login/sign-up again
// (booking now always requires a real account) for whoever is actually
// booking now.
export async function startOverAsNewPatient(providerId: string) {
  await clearPatientSession();
  redirect(`/doctors/${providerId}`);
}

// Exported so the mobile API layer (api/mobile/consultation/**) can reuse
// this exact multi-table booking sequence instead of a risky reimplementation
// -- unlike the simpler auth-check logic other mobile routes duplicate, this
// one is genuinely non-trivial (appointment + consultation_orders +
// attachment-claiming + optional intake/summary inserts) and already shared
// internally by both bookConsultation and bookAsGuest above.
export async function bookConsultationForPatient(input: {
  patientId: string;
  providerId: string;
  locale: Locale;
  qualification: QualificationResult | null;
}): Promise<string> {
  const service = createServiceClient();
  const defaultService = await getDefaultService(service);
  const withinFreeAccessWindow = await hasRecentPaidVisit(service, input.patientId, input.providerId);
  const paymentStatus = withinFreeAccessWindow ? "paid" : "pending";

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
      // Snippe payment flow is what actually flips this to "paid". Already
      // "paid" here instead, without ever touching Snippe, if this patient
      // paid this same doctor within the last 24h (see hasRecentPaidVisit)
      // -- /pay redirects straight through to the call room in that case.
      payment_status: paymentStatus,
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
    status: paymentStatus,
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

  const { data: provider } = await service
    .from("providers")
    .select("full_name, specialty")
    .eq("id", input.providerId)
    .maybeSingle();
  await createPatientNotification(service, input.patientId, "appointment_booked", {
    appointmentId,
    doctorName: provider?.full_name ?? null,
    specialty: provider?.specialty ?? null,
  });

  return appointmentId;
}
