import "server-only";
import { randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { generateReferenceNumber } from "@/lib/reference-number";
import { patientAuthEmailFromPhone } from "@/lib/patient-auth-email";
import type { Locale } from "@/lib/types";

// Lightweight, no-password patient record created directly by the AI intake
// chat (or the direct-booking form). No reference number yet -- that's only
// assigned once the patient's first consultation payment is confirmed (see
// ensurePatientReferenceNumber below), not at intake, when they may never
// actually pay.
export async function createPatientAccountRecord(input: {
  fullName: string;
  phone: string;
  // Optional -- the doctor page's "continue without an account" guest form
  // only collects name + phone (see bookAsGuest in doctors/actions.ts), same
  // as a Google sign-in's complete-profile step already leaves this unset.
  // patients.date_of_birth is nullable for exactly that reason.
  dateOfBirth?: string;
  gender?: "female" | "male" | "other";
  preferredLanguage?: Locale;
}) {
  const service = createServiceClient();
  const { data, error } = await service
    .from("patients")
    .insert({
      full_name: input.fullName,
      phone: input.phone,
      date_of_birth: input.dateOfBirth ?? null,
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

// Shared by every path that creates a real, sign-in-able account (web/mobile
// signUp, web/mobile Google complete-profile) -- NOT by guest-booking or AI-
// intake paths, which create a lightweight record on purpose and have no
// account to collide with in the same sense.
//
// A phone number already on file can mean two different things, and they
// need different handling:
//   - "account": patients.user_id is set -- a real account (password or
//     Google) already owns this phone. Blocking is right here (a phone can
//     be shared within a family -- see completeGoogleProfile's own
//     reasoning -- so this never silently attaches a new identity to
//     someone else's record), and the person CAN actually sign in to it, so
//     the caller should offer a real "Log in" link.
//   - "orphan": patients.user_id is null -- a guest/AI-intake record with no
//     password and no Google link. Nobody can ever "sign in" to it (there is
//     no credential for it at all), so blocking with "sign in instead" is a
//     dead end, not just unfriendly -- see the account-deletion investigation
//     that found this. Still blocks (same family-sharing reasoning), but the
//     caller must NOT claim it can be signed into.
export type PhoneCollision =
  | { status: "none" }
  | { status: "account"; patientId: string }
  | { status: "orphan"; patientId: string };

export async function checkPatientPhoneCollision(
  service: ReturnType<typeof createServiceClient>,
  phone: string
): Promise<PhoneCollision> {
  const { data } = await service.from("patients").select("id, user_id").eq("phone", phone).maybeSingle();
  if (!data) return { status: "none" };
  return data.user_id ? { status: "account", patientId: data.id as string } : { status: "orphan", patientId: data.id as string };
}

// Never stored or shown to the patient -- phone+OTP is the only credential
// they ever use. This exists purely so a real Supabase Auth user (and
// therefore patients.user_id) can still be created/refreshed, which the rest
// of the app (RLS's own_patient_id(), the web dashboard's supabase.auth
// session, checkPatientPhoneCollision's "account" vs "orphan" distinction)
// already depends on -- see resolvePatientForVerifiedPhone below.
function randomAuthPassword(): string {
  return randomBytes(24).toString("base64url");
}

// Supabase's admin API has no getUserByEmail -- only listUsers (paged) or
// getUserById. Only ever called from resolvePatientForVerifiedPhone's
// createUser-conflict fallback (rare: a real race or a stray leftover
// user), never on a normal request, so paging through is an acceptable
// cost for a lookup that isn't on the common path.
async function findAuthUserByEmail(
  service: ReturnType<typeof createServiceClient>,
  email: string
): Promise<{ id: string } | null> {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data.users.length) return null;
    const match = data.users.find((u) => u.email === email);
    if (match) return { id: match.id };
    if (data.users.length < 200) return null;
  }
  return null;
}

// `password` is the just-(re)generated random Auth password -- returned so
// the caller can immediately establish a real Supabase session with it
// (signInWithPassword, server-side only) on top of the app's own
// patient-session JWT. Never shown to the patient; a plain sign-in later
// always goes through OTP again, which regenerates a new one.
export type ResolvedPatient = { patientId: string; userId: string; isNewAccount: boolean; password: string };

// The one place a verified phone (see lib/patient-otp.ts's verifyPatientOtp)
// turns into a real, sign-in-able account -- used by both the web and mobile
// verify-otp handlers, so sign-up, sign-in, and claiming an orphaned
// guest/AI-intake record are all just this one function, not three separate
// code paths:
//   - no patients row for this phone -> create one (full_name left null;
//     nothing collected at sign-up beyond the phone itself -- see the
//     account/sign-up screens) plus a fresh Supabase Auth user.
//   - an orphan row (patients.user_id null, e.g. from AI intake or a guest
//     booking) -> attach a new Supabase Auth user to that SAME row instead
//     of creating a second one. This is only safe because OTP verification
//     just proved the caller actually owns this phone -- checkPatientPhoneCollision's
//     old "orphan" block (a dead-end "sign in" message, see that type's own
//     comment) no longer applies once proving phone ownership is exactly
//     what OTP does.
//   - an existing account row -> nothing to create; this is just a sign-in.
// Every branch (re-)issues a random Auth password and returns the userId so
// the caller can immediately establish a real Supabase session (signInWithPassword
// with that same random password, server-side only, never exposed) on top of
// the app's own patient-session JWT.
export async function resolvePatientForVerifiedPhone(
  service: ReturnType<typeof createServiceClient>,
  phone: string
): Promise<ResolvedPatient> {
  const authEmail = patientAuthEmailFromPhone(phone);
  const password = randomAuthPassword();

  let existing = (await service.from("patients").select("id, user_id").eq("phone", phone).maybeSingle()).data;

  if (existing?.user_id) {
    const { error } = await service.auth.admin.updateUserById(existing.user_id as string, { password });
    if (error) throw new Error(error.message);
    return { patientId: existing.id as string, userId: existing.user_id as string, isNewAccount: false, password };
  }

  const created = await service.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    phone,
    phone_confirm: true,
    user_metadata: { phone, role: "patient" },
  });

  let userId: string;
  if (created.error || !created.data.user) {
    // A concurrent verify for the same phone (SMS autofill triggering a
    // second submit alongside a manual tap is the realistic trigger) can
    // race here: both requests see no existing row, both call createUser,
    // and the loser gets Supabase's "already registered" error instead of
    // a clean result. Rather than fail a real patient over that, re-check
    // for the row the winner just created/claimed -- and if there's still
    // no row at all (a genuinely stray Auth user with no patients row, e.g.
    // from an earlier attempt that failed after createUser but before the
    // insert below), adopt that dangling Auth user instead of leaving the
    // phone permanently stuck.
    existing = (await service.from("patients").select("id, user_id").eq("phone", phone).maybeSingle()).data;
    if (existing?.user_id) {
      const { error } = await service.auth.admin.updateUserById(existing.user_id as string, { password });
      if (error) throw new Error(error.message);
      return { patientId: existing.id as string, userId: existing.user_id as string, isNewAccount: false, password };
    }

    const strayUser = await findAuthUserByEmail(service, authEmail);
    if (!strayUser) {
      throw new Error(created.error?.message ?? "Could not create your account. Please try again.");
    }
    const { error: updateError } = await service.auth.admin.updateUserById(strayUser.id, { password });
    if (updateError) throw new Error(updateError.message);
    userId = strayUser.id;
  } else {
    userId = created.data.user.id;
  }

  if (existing) {
    // Orphan claim -- attach the Auth user to the existing record rather
    // than inserting a duplicate.
    const { error } = await service.from("patients").update({ user_id: userId }).eq("id", existing.id);
    if (error) {
      await service.auth.admin.deleteUser(userId);
      throw new Error(error.message);
    }
    return { patientId: existing.id as string, userId, isNewAccount: false, password };
  }

  const { data: inserted, error: insertError } = await service
    .from("patients")
    .insert({ user_id: userId, phone })
    .select("id")
    .single();
  if (insertError || !inserted) {
    await service.auth.admin.deleteUser(userId);
    throw new Error(insertError?.message ?? "Could not create your account. Please try again.");
  }

  return { patientId: inserted.id as string, userId, isNewAccount: true, password };
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

// App Store Guideline 5.1.1(v): real in-app self-service account deletion,
// not "contact support to have your account removed" (which is what the
// Privacy Policy said before this existed).
//
// This is NOT a hard delete of the patients row. appointments, payments,
// prescriptions, lab_orders, referrals, consultation_orders,
// consultation_feedback, visit_documents, and files all reference
// patients.id and are real clinical/financial records someone else (a
// doctor's own patient history, admin payment reconciliation, a signed
// prescription) legitimately needs to keep -- deleting the row outright
// would cascade-destroy or orphan all of that with no way back. So this:
//   1. Hard-deletes the patient's own private self-tracking data (nothing
//      else references patient_self_medications/_doses, patient_care_plans,
//      or patient_readings -- there's no reason to keep it and every reason
//      not to).
//   2. Anonymizes the identifying fields on the patients row itself and
//      sets deleted_at, rather than removing the row.
//   3. Deletes the Supabase Auth user (if there is one -- a lightweight
//      guest-booking record never has one) so this person genuinely cannot
//      sign back in.
// hospital_reference_number is deliberately left alone -- it's an internal
// reference number staff use to look up records, not personal data on its
// own, and clearing it would break that lookup for the records being kept.
export async function deletePatientAccount(patientId: string): Promise<void> {
  const service = createServiceClient();

  const { data: meds } = await service
    .from("patient_self_medications")
    .select("id")
    .eq("patient_id", patientId);
  const medicationIds = (meds ?? []).map((m) => m.id as string);
  if (medicationIds.length) {
    await service.from("patient_self_medication_doses").delete().in("medication_id", medicationIds);
  }
  await service.from("patient_self_medications").delete().eq("patient_id", patientId);
  await service.from("patient_care_plans").delete().eq("patient_id", patientId);
  await service.from("patient_readings").delete().eq("patient_id", patientId);
  await service.from("patient_notifications").delete().eq("patient_id", patientId);

  const { data: patient } = await service.from("patients").select("user_id").eq("id", patientId).maybeSingle();

  const { error } = await service
    .from("patients")
    .update({
      full_name: "Deleted patient",
      date_of_birth: null,
      gender: null,
      age: null,
      phone: null,
      emergency_contact: null,
      address: null,
      blood_group: null,
      insurance_number: null,
      national_id_reference: null,
      pin_hash: null,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", patientId);

  if (error) {
    throw new Error(error.message);
  }

  if (patient?.user_id) {
    await service.auth.admin.deleteUser(patient.user_id as string).catch(() => undefined);
  }
}

// The optional post-signup step (account/welcome, api/mobile/account/
// complete-profile) -- a first-time phone+OTP sign-up collects nothing at
// all (see resolvePatientForVerifiedPhone), so this is the one place a new
// patient can fill in name/gender/age/location afterward, and every field
// is independently optional: only the ones actually provided get written,
// so partially filling this in (or skipping it entirely) never overwrites
// something with an empty value.
export async function updatePatientOptionalProfile(
  patientId: string,
  input: { fullName?: string; gender?: "female" | "male" | "other"; age?: number; location?: string }
): Promise<void> {
  const patch: Record<string, string | number> = {};
  if (input.fullName) patch.full_name = input.fullName;
  if (input.gender) patch.gender = input.gender;
  if (input.age != null) patch.age = input.age;
  if (input.location) patch.address = input.location;
  if (Object.keys(patch).length === 0) return;

  const service = createServiceClient();
  const { error } = await service.from("patients").update(patch).eq("id", patientId);
  if (error) throw new Error(error.message);
}
