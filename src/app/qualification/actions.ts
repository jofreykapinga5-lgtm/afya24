"use server";

import { createPatientAccountRecord } from "@/lib/patient-account";
import { createPatientSession, getPatientSession } from "@/lib/patient-session";
import { hashPin, isValidPin } from "@/lib/patient-pin";
import { createServiceClient } from "@/lib/supabase/service";
import type { Locale } from "@/lib/types";

// Recovery path for when the AI chat's createPatientAccount tool call never
// fires (model reliability under the stop-rule budget isn't perfect). This
// is a plain Server Action, not a streamed response, so unlike the chat
// route's tool it CAN set the session cookie directly -- no claim-token
// exchange needed here.
const BOOKING_SESSION_TTL_SECONDS = 2 * 60 * 60;

export async function createPatientAccountFallback(input: {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  preferredLanguage?: Locale;
}) {
  if (!input.fullName.trim() || !input.phone.trim() || !input.dateOfBirth.trim()) {
    throw new Error("Please fill in all fields.");
  }

  const record = await createPatientAccountRecord(input);
  await createPatientSession(record.patientId, BOOKING_SESSION_TTL_SECONDS);
  return record;
}

// Sets the PIN a patient will use for return-visit lookup instead of date of
// birth (src/app/lookup/actions.ts). Requires an already-established session
// -- this only runs after account creation, from a plain Server Action, so
// (unlike the chat route's tool) it can just read the session cookie
// directly rather than needing the claim-token exchange.
export async function setPatientPin(pin: string) {
  const session = await getPatientSession();
  if (!session) {
    throw new Error("Your session expired. Please start the intake chat again.");
  }
  if (!isValidPin(pin)) {
    throw new Error("PIN must be 4 to 6 digits.");
  }

  const service = createServiceClient();
  const { error } = await service
    .from("patients")
    .update({ pin_hash: hashPin(pin) })
    .eq("id", session.patientId);

  if (error) {
    throw new Error(error.message);
  }
}
