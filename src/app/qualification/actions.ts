"use server";

import { createPatientAccountRecord } from "@/lib/patient-account";
import { createPatientSession } from "@/lib/patient-session";
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
