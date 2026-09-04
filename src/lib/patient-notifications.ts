import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

// Real notification events -- see supabase/migrations/0024_patient_notifications.sql
// for the full design rationale. kind selects a client-side i18n template
// (mobile/src/constants.ts's notifCopy); data holds only the fields that
// template needs, never pre-rendered text, so this stays bilingual.
export type NotificationKind =
  | "appointment_booked"
  | "payment_confirmed"
  | "payment_failed"
  | "pharmacy_order_placed"
  | "medication_taken";

// Called from the few real places these events happen: bookConsultationForPatient
// (doctors/actions.ts), applySnippePaymentResult (lib/payments/reconcile.ts),
// placePharmacyOrder (pharmacy/actions.ts), the medications toggle-dose route
// (api/mobile/trackers/medications/toggle-dose). Never throws -- a notification is
// a side effect of something that already succeeded (a booking, a payment,
// an order); failing to record it shouldn't fail that real action.
export async function createPatientNotification(
  service: ReturnType<typeof createServiceClient>,
  patientId: string,
  kind: NotificationKind,
  data: Record<string, unknown>
): Promise<void> {
  const { error } = await service.from("patient_notifications").insert({ patient_id: patientId, kind, data });
  if (error) {
    console.error(`createPatientNotification(${kind}) failed`, error);
  }
}
