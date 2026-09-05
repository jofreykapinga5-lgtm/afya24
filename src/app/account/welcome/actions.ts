"use server";

import { redirect } from "next/navigation";
import { getPatientSession } from "@/lib/patient-session";
import { updatePatientOptionalProfile } from "@/lib/patient-account";
import { safeRedirectPath } from "@/lib/safe-redirect";

// Every field here is optional -- see updatePatientOptionalProfile's own
// comment. Requires a real session (set by verifyPatientOtp right before
// this redirect fires) rather than trusting a client-supplied patient id.
export async function completeOptionalProfile(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  const session = await getPatientSession();
  if (!session) {
    redirect("/account");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const rawGender = String(formData.get("gender") ?? "").trim();
  const gender = rawGender === "female" || rawGender === "male" || rawGender === "other" ? rawGender : undefined;
  const rawAge = String(formData.get("age") ?? "").trim();
  const age = rawAge ? Number(rawAge) : undefined;
  const location = String(formData.get("location") ?? "").trim();

  await updatePatientOptionalProfile(session.patientId, {
    fullName: fullName || undefined,
    gender,
    age: age != null && Number.isFinite(age) ? age : undefined,
    location: location || undefined,
  });

  // Landing page by default, not straight into the dashboard -- same as
  // verifyPatientOtp's own redirect. redirectTo still wins when the patient
  // was actually mid-booking (e.g. a doctor's page) before this detour.
  redirect(safeRedirectPath(redirectTo, "/"));
}

// "Skip for now" -- identical destination to a submit with every field
// blank, kept as its own action so the skip link doesn't need to carry the
// full form's fields to behave the same way.
export async function skipOptionalProfile(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  redirect(safeRedirectPath(redirectTo, "/"));
}
