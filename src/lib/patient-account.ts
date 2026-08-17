import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { generateReferenceNumber } from "@/lib/reference-number";
import type { Locale } from "@/lib/types";

// Lightweight, no-password patient record created directly by the AI intake
// chat (or the direct-booking form). No reference number yet -- that's only
// assigned once the patient's first consultation payment is confirmed (see
// ensurePatientReferenceNumber below), not at intake, when they may never
// actually pay.
export async function createPatientAccountRecord(input: {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender?: "female" | "male" | "other";
  preferredLanguage?: Locale;
}) {
  const service = createServiceClient();
  const { data, error } = await service
    .from("patients")
    .insert({
      full_name: input.fullName,
      phone: input.phone,
      date_of_birth: input.dateOfBirth,
      gender: input.gender ?? null,
      preferred_language: input.preferredLanguage ?? "sw",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create patient account.");
  }

  return { patientId: data.id as string };
}

// Assigns a patient's permanent reference number the first time it's
// actually needed -- their first confirmed payment (see
// lib/payments/reconcile.ts and admin/actions.ts's manual payment confirm).
// Idempotent: a patient who already has one just gets it read back, so
// callers can call this unconditionally on every "payment confirmed" event
// without worrying about clobbering an existing number on a second visit.
export async function ensurePatientReferenceNumber(
  service: ReturnType<typeof createServiceClient>,
  patientId: string
): Promise<string> {
  const { data: existing } = await service
    .from("patients")
    .select("hospital_reference_number")
    .eq("id", patientId)
    .maybeSingle();

  if (existing?.hospital_reference_number) {
    return existing.hospital_reference_number as string;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referenceNumber = generateReferenceNumber();
    // Gated on still-null so two near-simultaneous callers (e.g. the webhook
    // and the poll-fallback racing on two different appointments for the
    // same patient) can't both "win" and overwrite each other.
    const { data, error } = await service
      .from("patients")
      .update({ hospital_reference_number: referenceNumber })
      .eq("id", patientId)
      .is("hospital_reference_number", null)
      .select("hospital_reference_number")
      .maybeSingle();

    if (!error && data) {
      return data.hospital_reference_number as string;
    }
    if (error && error.code !== "23505") {
      throw new Error(error.message);
    }

    // Either a unique collision on the generated number, or another caller
    // already assigned one first -- re-read to find out which.
    const { data: reread } = await service
      .from("patients")
      .select("hospital_reference_number")
      .eq("id", patientId)
      .maybeSingle();
    if (reread?.hospital_reference_number) {
      return reread.hospital_reference_number as string;
    }
  }

  throw new Error("Could not assign a reference number.");
}
