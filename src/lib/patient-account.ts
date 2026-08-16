import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { generateReferenceNumber } from "@/lib/reference-number";
import type { Locale } from "@/lib/types";

// Mirrors src/app/account/actions.ts's signUp() retry-on-collision pattern,
// minus the Supabase Auth user -- these are lightweight, no-password patient
// records created directly by the AI intake chat.
export async function createPatientAccountRecord(input: {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender?: "female" | "male" | "other";
  preferredLanguage?: Locale;
}) {
  const service = createServiceClient();
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referenceNumber = generateReferenceNumber();
    const { data, error } = await service
      .from("patients")
      .insert({
        hospital_reference_number: referenceNumber,
        full_name: input.fullName,
        phone: input.phone,
        date_of_birth: input.dateOfBirth,
        gender: input.gender ?? null,
        preferred_language: input.preferredLanguage ?? "sw",
      })
      .select("id")
      .single();

    if (!error && data) {
      return { patientId: data.id as string, hospitalReferenceNumber: referenceNumber };
    }
    lastError = error?.message ?? "Unknown error creating patient record.";
    if (error?.code !== "23505") break;
  }

  throw new Error(lastError ?? "Could not create patient account.");
}
