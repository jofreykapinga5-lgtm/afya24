"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateReferenceNumber } from "@/lib/reference-number";
import { patientAuthEmailFromPhone } from "@/lib/patient-auth-email";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";

export async function signUp(formData: FormData) {
  const locale = await getServerLocale();
  const signupErrorPath = "/account/sign-up?error=";
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const agreedToTerms = formData.get("agreedToTerms") === "on";

  if (!phone || !password || !fullName) {
    redirect(`${signupErrorPath}${encodeURIComponent(t("error_fill_all_fields", locale))}`);
  }

  if (!agreedToTerms) {
    redirect(
      `${signupErrorPath}${encodeURIComponent(t("error_must_agree_terms", locale))}`
    );
  }

  const supabase = await createClient();
  const service = createServiceClient();
  const authEmail = patientAuthEmailFromPhone(phone);

  const { data, error } = await service.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    // The form's HTML pattern already enforces E.164, but normalize
    // defensively in case this action is ever hit directly (bypassing
    // client-side validation) -- matches the same fallback used by
    // upgradeToFullAccount in src/app/consultation/actions.ts.
    phone: normalizeTanzanianPhoneToE164(phone),
    phone_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone,
      role: "patient",
    },
  });

  if (error) {
    redirect(`${signupErrorPath}${encodeURIComponent(error.message)}`);
  }

  const userId = data.user?.id;
  if (!userId) {
    redirect(
      `${signupErrorPath}${encodeURIComponent(t("error_account_creation_failed", locale))}`
    );
  }

  // Patient row is created with the service-role client (same convention as
  // the reference-number lookup flow) rather than an extra RLS insert policy
  // -- keeps "who can write to patients" in one place. Retry a few times on
  // the rare chance the generated reference number collides.
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error: insertError } = await service.from("patients").insert({
      user_id: userId,
      hospital_reference_number: generateReferenceNumber(),
      full_name: fullName,
      phone,
    });
    if (!insertError) {
      lastError = null;
      break;
    }
    lastError = insertError.message;
    if (insertError.code !== "23505") break;
  }

  if (lastError) {
    await service.auth.admin.deleteUser(userId);
    redirect(`${signupErrorPath}${encodeURIComponent(lastError)}`);
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password,
  });

  if (signInError) {
    redirect(`/account?error=${encodeURIComponent(signInError.message)}`);
  }

  redirect("/account/dashboard");
}

export async function signIn(formData: FormData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: patientAuthEmailFromPhone(phone),
    password,
  });

  if (error) {
    redirect(`/account?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/account/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/account");
}
