import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { ensurePatientReferenceNumber } from "@/lib/patient-account";
import { createPatientNotification } from "@/lib/patient-notifications";
import type { SnippePaymentStatus } from "./snippe";

// Shared by the webhook handler and the client-poll fallback so neither can
// race the other into an inconsistent state -- see
// src/app/api/payments/snippe-webhook/route.ts and
// src/app/consultation/actions.ts's checkSnippePaymentStatus.
//
// Snippe's "voided"/"expired" collapse onto the existing payments.status
// pending/paid/failed enum as "failed"; the real upstream value is kept in
// gateway_status. "pending" is a no-op here -- there's nothing to apply yet.
function toLocalStatus(snippeStatus: SnippePaymentStatus): "paid" | "failed" | null {
  if (snippeStatus === "completed") return "paid";
  if (snippeStatus === "pending") return null;
  return "failed";
}

export async function applySnippePaymentResult(input: {
  reference: string;
  snippeStatus: SnippePaymentStatus;
  source: "webhook" | "poll_fallback" | "patient_cancelled";
}): Promise<{ applied: boolean; appointmentId: string | null; hospitalReferenceNumber: string | null }> {
  const localStatus = toLocalStatus(input.snippeStatus);
  if (!localStatus) {
    return { applied: false, appointmentId: null, hospitalReferenceNumber: null };
  }

  const service = createServiceClient();

  // Gated on status = 'pending' so whichever of webhook/poll-fallback gets
  // here first wins -- the second is a 0-row no-op, not an error.
  const { data: payment, error: paymentError } = await service
    .from("payments")
    .update({ status: localStatus, gateway_status: input.snippeStatus })
    .eq("reference", input.reference)
    .eq("status", "pending")
    .select("id, appointment_id, patient_id, amount, currency")
    .maybeSingle();

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  if (!payment) {
    // Already settled by the other path, or the reference doesn't exist
    // yet (a webhook arriving before initiateSnippePayment finished writing
    // it) -- either way, nothing more to do from here.
    return { applied: false, appointmentId: null, hospitalReferenceNumber: null };
  }

  const appointmentId = payment.appointment_id as string;

  await service
    .from("appointments")
    .update({ payment_status: localStatus })
    .eq("id", appointmentId)
    .eq("payment_status", "pending");

  // Keeps consultation_orders.status from silently disagreeing with
  // appointments.payment_status -- see bookConsultation's own comment on
  // why this mirror exists.
  await service
    .from("consultation_orders")
    .update({ status: localStatus })
    .eq("appointment_id", appointmentId)
    .eq("status", "pending");

  // A paid consultation is the moment a patient's file becomes real -- this
  // is where their permanent reference number gets minted (see
  // ensurePatientReferenceNumber's own comment for why it's idempotent).
  const hospitalReferenceNumber =
    localStatus === "paid"
      ? await ensurePatientReferenceNumber(service, payment.patient_id as string)
      : null;

  await service.from("audit_logs").insert({
    actor_user_id: null,
    action: localStatus === "paid" ? "payment_gateway_completed" : "payment_gateway_failed",
    entity_type: "appointment",
    entity_id: appointmentId,
    metadata_json: {
      reference: input.reference,
      snippeStatus: input.snippeStatus,
      source: input.source,
    },
  });

  await createPatientNotification(
    service,
    payment.patient_id as string,
    localStatus === "paid" ? "payment_confirmed" : "payment_failed",
    { appointmentId, amount: payment.amount, currency: payment.currency }
  );

  return { applied: true, appointmentId, hospitalReferenceNumber };
}
