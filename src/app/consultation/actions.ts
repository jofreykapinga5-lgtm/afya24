"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPatientSession } from "@/lib/patient-session";
import { patientAuthEmailFromPhone } from "@/lib/patient-auth-email";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";

// Turns the lightweight, no-password patient record the AI created into a
// real account -- attaches a Supabase Auth user to the SAME patients row
// rather than the old /account/sign-up path of creating a second, unlinked
// row for the same person. Reuses the phone already collected during
// intake, so this is just "set a password," not a full signup form again.
export async function upgradeToFullAccount(password: string) {
  const session = await getPatientSession();
  if (!session) {
    throw new Error("Your session expired. Please look yourself up again to continue.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const service = createServiceClient();
  const { data: patient, error: patientError } = await service
    .from("patients")
    .select("id, phone, user_id")
    .eq("id", session.patientId)
    .maybeSingle();

  if (patientError || !patient) {
    throw new Error("Could not find your patient record.");
  }
  if (patient.user_id) {
    throw new Error("This visit already has a full account. Sign in instead.");
  }
  if (!patient.phone) {
    throw new Error("No phone number on file to create an account with.");
  }

  const authEmail = patientAuthEmailFromPhone(patient.phone);
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    phone: normalizeTanzanianPhoneToE164(patient.phone),
    phone_confirm: true,
    user_metadata: { role: "patient" },
  });

  if (createError || !created.user) {
    if (createError?.message?.toLowerCase().includes("already been registered")) {
      throw new Error("This phone number already has an account. Sign in instead at /account.");
    }
    throw new Error(createError?.message ?? "Could not create your account.");
  }

  const { error: linkError } = await service
    .from("patients")
    .update({ user_id: created.user.id })
    .eq("id", patient.id);

  if (linkError) {
    await service.auth.admin.deleteUser(created.user.id);
    throw new Error(linkError.message);
  }

  // Sign them into a real Supabase Auth session now, so /account/dashboard
  // recognizes them from this point on -- same synthetic-email sign-in used
  // by the manual /account/sign-up flow.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password,
  });

  if (signInError) {
    throw new Error(signInError.message);
  }
}
