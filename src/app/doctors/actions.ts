"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getPatientSession } from "@/lib/patient-session";
import { getDefaultService } from "@/lib/default-service";
import { QUALIFICATION_MODEL_NAME } from "@/lib/ai/model";
import type { ConsultationMode, Locale, QualificationResult } from "@/lib/types";

export async function bookConsultation(input: {
  providerId: string;
  consultationMode: ConsultationMode;
  locale: Locale;
  qualification: QualificationResult | null;
}): Promise<string> {
  const session = await getPatientSession();
  if (!session) {
    throw new Error("Your session expired. Please start the intake chat again.");
  }

  const service = createServiceClient();
  const defaultService = await getDefaultService(service);

  const { data: appointment, error: appointmentError } = await service
    .from("appointments")
    .insert({
      patient_id: session.patientId,
      provider_id: input.providerId,
      service_id: defaultService.id,
      scheduled_at: new Date().toISOString(),
      status: "waiting",
      // No payment gateway is integrated yet, so this starts pending rather
      // than being marked paid automatically -- an admin confirms it for
      // real from /admin/dashboard's Payments panel once payment actually
      // comes in (e.g. an M-Pesa till reference), matching how a direct-pay
      // platform with no live gateway has to reconcile payment today.
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
    patient_id: session.patientId,
    provider_id: input.providerId,
    service_id: defaultService.id,
    appointment_id: appointmentId,
    consultation_mode: input.consultationMode,
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
    .eq("patient_id", session.patientId)
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
