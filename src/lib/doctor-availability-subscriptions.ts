import "server-only";
import type { createServiceClient } from "@/lib/supabase/service";
import { createPatientNotifications } from "@/lib/patient-notifications";
import { sendExpoPushNotifications } from "@/lib/push/expo-push";

// Called right after a doctor's available_now flips false -> true (both
// updateProviderAvailability, the doctor's own toggle, and
// updateProviderAvailabilityByAdmin call this via applyProviderAvailabilityUpdate
// below) -- notifies every patient who asked to hear about it
// (doctor_availability_subscriptions), then clears those subscriptions.
// One-shot by design: a patient who wants to hear about it again next time
// this doctor goes offline-then-online has to ask again, same as a typical
// "notify me when back in stock" pattern.
//
// doctorName is optional purely as a small efficiency: the admin caller
// already has the provider's full_name in hand from its own query (needed
// for its audit-log write regardless), so it can pass it straight through
// instead of this function re-fetching a row the caller already read.
export async function notifyPatientsDoctorIsAvailable(
  service: ReturnType<typeof createServiceClient>,
  providerId: string,
  doctorName?: string
): Promise<void> {
  // Select each subscription's own id, not just patient_id -- the trailing
  // delete below removes exactly these rows, not a blanket "everything for
  // this provider" delete, so a patient who subscribes in the moment between
  // this read and that delete keeps their (still-unfired) subscription
  // instead of it being silently discarded unnotified.
  const { data: subscriptions, error: subscriptionsError } = await service
    .from("doctor_availability_subscriptions")
    .select("id, patient_id")
    .eq("provider_id", providerId);

  if (subscriptionsError) {
    console.error("notifyPatientsDoctorIsAvailable: could not read subscriptions", subscriptionsError);
    return;
  }
  if (!subscriptions || subscriptions.length === 0) return;

  let finalDoctorName = doctorName;
  if (!finalDoctorName) {
    const { data: provider } = await service.from("providers").select("full_name").eq("id", providerId).maybeSingle();
    finalDoctorName = provider?.full_name ?? "Your doctor";
  }

  const patientIds = subscriptions.map((row) => row.patient_id as string);
  const { data: tokens } = await service
    .from("patient_push_tokens")
    .select("patient_id, expo_push_token")
    .in("patient_id", patientIds);
  const tokenByPatientId = new Map(
    (tokens ?? []).map((row) => [row.patient_id as string, row.expo_push_token as string])
  );

  // In-app notification rows: one batched insert instead of one round trip
  // per subscriber. Each per-patient insert failure is swallowed inside
  // createPatientNotification already (it logs, never throws), but this
  // still keeps the whole step to a single request regardless of how many
  // patients are subscribed.
  await createPatientNotifications(
    service,
    subscriptions.map((row) => ({ patientId: row.patient_id as string, data: { providerId, doctorName: finalDoctorName! } }))
  );

  // Push: one batched Expo call (its API accepts up to 100 messages per
  // request) instead of one HTTP round trip per subscriber. Expo's per-
  // message ticket tells us which tokens are dead (app uninstalled, token
  // rotated) so they can be pruned instead of being "sent to" forever.
  const pushable = patientIds
    .map((patientId) => ({ patientId, token: tokenByPatientId.get(patientId) }))
    .filter((row): row is { patientId: string; token: string } => Boolean(row.token));
  if (pushable.length > 0) {
    const results = await sendExpoPushNotifications(
      pushable.map((row) => ({
        to: row.token,
        title: "Your doctor is online",
        body: `${finalDoctorName} is now available for a consultation.`,
        data: { kind: "doctor_available", providerId },
      }))
    );
    const deadTokens = pushable.filter((_, i) => results[i]?.deadToken).map((row) => row.token);
    if (deadTokens.length > 0) {
      await service.from("patient_push_tokens").delete().in("expo_push_token", deadTokens);
    }
  }

  await service
    .from("doctor_availability_subscriptions")
    .delete()
    .in("id", subscriptions.map((row) => row.id as string));
}

// Shared by both updateProviderAvailability (doctor/actions.ts) and
// updateProviderAvailabilityByAdmin (admin/actions.ts) -- previously each
// file separately SELECTed available_now before its own UPDATE to compute
// a "wasAvailable" edge, which is a real TOCTOU race: two near-simultaneous
// toggles (the doctor's own dashboard and an admin, or a double form submit)
// can both read the pre-update value before either UPDATE lands, so both
// treat it as a false->true edge and both fire the notify, double-paging
// every subscribed patient.
//
// Fixed here by making the edge-detection itself atomic: the conditional
// UPDATE (available_now eq false) only actually matches/affects a row if
// the value is STILL false at the exact instant Postgres executes it -- a
// real database-level guarantee, not a client-side race. Whichever
// concurrent caller's UPDATE actually flips it is provably the one that
// caused the edge; the other one's conditional UPDATE matches zero rows and
// correctly does not notify.
export async function applyProviderAvailabilityUpdate(
  service: ReturnType<typeof createServiceClient>,
  providerId: string,
  fields: { availableNow: boolean; availabilityNote: string | null; consultationModes: string[] },
  doctorName?: string
): Promise<void> {
  if (fields.availableNow) {
    const { data: edgeRows, error: edgeError } = await service
      .from("providers")
      .update({ available_now: true })
      .eq("id", providerId)
      .eq("available_now", false)
      .select("id");
    if (edgeError) throw new Error(edgeError.message);
    const causedEdge = (edgeRows?.length ?? 0) > 0;

    const { error } = await service
      .from("providers")
      .update({
        available_now: true,
        availability_note: fields.availabilityNote,
        consultation_modes: fields.consultationModes,
      })
      .eq("id", providerId);
    if (error) throw new Error(error.message);

    // Own try/catch: the availability update above already succeeded, so a
    // failure here (a transient Supabase/network blip) must never surface as
    // this action's own error -- the doctor (or admin) did successfully
    // change availability, that's what matters, not whether the "notify
    // waiting patients" side-effect ran.
    if (causedEdge) {
      try {
        await notifyPatientsDoctorIsAvailable(service, providerId, doctorName);
      } catch (notifyError) {
        console.error("notifyPatientsDoctorIsAvailable failed", notifyError);
      }
    }
    return;
  }

  const { error } = await service
    .from("providers")
    .update({
      available_now: false,
      availability_note: fields.availabilityNote,
      consultation_modes: fields.consultationModes,
    })
    .eq("id", providerId);
  if (error) throw new Error(error.message);
}
