"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { createPatientSession, clearPatientSession } from "@/lib/patient-session";
import { verifyPin } from "@/lib/patient-pin";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";

function constantTimeEquals(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// A 4-6 digit PIN (and, before it existed, date of birth) has a small enough
// keyspace that logging attempts for later review isn't enough on its own --
// this actually blocks further tries once a reference number has racked up
// too many attempts in a short window, successful or not.
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export async function lookupPatient(formData: FormData) {
  const locale = await getServerLocale();
  const referenceNumber = String(formData.get("referenceNumber") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();

  if (!referenceNumber || (!pin && !dateOfBirth)) {
    redirect(`/lookup?error=${encodeURIComponent(t("error_enter_reference_dob", locale))}`);
  }

  const supabase = createServiceClient();
  const referenceHash = createHash("sha256").update(referenceNumber).digest("hex");

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count: recentAttempts } = await supabase
    .from("patient_lookup_events")
    .select("id", { count: "exact", head: true })
    .eq("searched_value_hash", referenceHash)
    .eq("lookup_method", "reference_number")
    .gte("created_at", since);

  if ((recentAttempts ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS) {
    redirect(`/lookup?error=${encodeURIComponent(t("error_too_many_attempts", locale))}`);
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("id, date_of_birth, pin_hash")
    .eq("hospital_reference_number", referenceNumber)
    .maybeSingle();

  const matched = Boolean(
    patient &&
      ((pin && patient.pin_hash && verifyPin(pin, patient.pin_hash)) ||
        (dateOfBirth && patient.date_of_birth && constantTimeEquals(patient.date_of_birth, dateOfBirth)))
  );

  // Log the attempt either way -- DATA-MODEL.md wants lookup events auditable,
  // failed attempts matter for brute-force detection, and this is also what
  // the rate limit above counts against.
  await supabase.from("patient_lookup_events").insert({
    patient_id: matched ? patient!.id : null,
    lookup_method: "reference_number",
    searched_value_hash: referenceHash,
  });

  if (!matched) {
    redirect(`/lookup?error=${encodeURIComponent(t("error_no_matching_record", locale))}`);
  }

  await createPatientSession(patient!.id);
  redirect("/lookup/results");
}

export async function endPatientSession() {
  await clearPatientSession();
  redirect("/lookup");
}
