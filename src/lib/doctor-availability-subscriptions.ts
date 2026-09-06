import "server-only";
import type { createServiceClient } from "@/lib/supabase/service";
import { createPatientNotification } from "@/lib/patient-notifications";
import { sendExpoPushNotification } from "@/lib/push/expo-push";

// Called right after a doctor's available_now flips false -> true (both
// updateProviderAvailability, the doctor's own toggle, and
// updateProviderAvailabilityByAdmin call this) -- notifies every patient who
// asked to hear about it (doctor_availability_subscriptions), then clears
// those subscriptions. One-shot by design: a patient who wants to hear about
// it again next time this doctor goes offline-then-online has to ask again,
// same as a typical "notify me when back in stock" pattern.
export async function notifyPatientsDoctorIsAvailable(
  service: ReturnType<typeof createServiceClient>,
  providerId: string
): Promise<void> {
  const { data: subscriptions } = await service
    .from("doctor_availability_subscriptions")
    .select("patient_id")
    .eq("provider_id", providerId);

  if (!subscriptions || subscriptions.length === 0) return;

  const { data: provider } = await service
    .from("providers")
    .select("full_name")
    .eq("id", providerId)
    .maybeSingle();
  const doctorName = provider?.full_name ?? "Your doctor";

  const patientIds = subscriptions.map((row) => row.patient_id as string);
  const { data: tokens } = await service
    .from("patient_push_tokens")
    .select("patient_id, expo_push_token")
    .in("patient_id", patientIds);
  const tokenByPatientId = new Map(
    (tokens ?? []).map((row) => [row.patient_id as string, row.expo_push_token as string])
  );

  await Promise.all(
    patientIds.map(async (patientId) => {
      await createPatientNotification(service, patientId, "doctor_available", {
        providerId,
        doctorName,
      });
      const token = tokenByPatientId.get(patientId);
      if (token) {
        await sendExpoPushNotification({
          to: token,
          title: "Your doctor is online",
          body: `${doctorName} is now available for a consultation.`,
          data: { kind: "doctor_available", providerId },
        });
      }
    })
  );

  await service.from("doctor_availability_subscriptions").delete().eq("provider_id", providerId);
}
