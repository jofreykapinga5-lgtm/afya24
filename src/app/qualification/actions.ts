"use server";

import { unstable_rethrow } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { createPatientAccountRecord } from "@/lib/patient-account";
import { createPatientSession } from "@/lib/patient-session";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export type CreatePatientAccountFallbackResult =
  | { ok: true; patientId: string }
  | { ok: false; message: string };

// Recovery path for when the AI chat's createPatientAccount tool call never
// fires (model reliability under the stop-rule budget isn't perfect). This
// is a plain Server Action, not a streamed response, so unlike the chat
// route's tool it CAN set the session cookie directly -- no claim-token
// exchange needed here.
//
// Returns a result object rather than throwing -- a thrown Error from a
// Server Action never reaches the client's try/catch with a readable
// message in production (React error #441; see the same pattern in
// consultation/actions.ts's initiateSnippePayment).
export async function createPatientAccountFallback(input: {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  preferredLanguage?: Locale;
}): Promise<CreatePatientAccountFallbackResult> {
  try {
    if (!input.fullName.trim() || !input.phone.trim() || !input.dateOfBirth.trim()) {
      return { ok: false, message: "Please fill in all fields." };
    }

    const normalizedPhone = normalizeTanzanianPhoneToE164(input.phone.trim());

    // A phone can already belong to a patient record from an earlier visit/
    // device, and it can be shared within a family, so this blocks rather
    // than silently reusing or overwriting a record that might belong to
    // someone else.
    const service = createServiceClient();
    const { data: phoneMatch } = await service
      .from("patients")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();
    if (phoneMatch) {
      return { ok: false, message: t("doctor_direct_booking_phone_exists", input.preferredLanguage ?? "sw") };
    }

    const record = await createPatientAccountRecord({ ...input, phone: normalizedPhone });
    await createPatientSession(record.patientId);
    return { ok: true, patientId: record.patientId };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not create your patient file." };
  }
}
