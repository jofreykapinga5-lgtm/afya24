"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createPatientSession, clearPatientSession, LONG_TTL_SECONDS } from "@/lib/patient-session";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { patientAuthEmailFromPhone } from "@/lib/patient-auth-email";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { generateResetCode, hashResetCode, resetCodeExpiry, verifyResetCode } from "@/lib/patient-password-reset";
import { sendSms } from "@/lib/sms/africas-talking";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function signUp(formData: FormData) {
  const locale = await getServerLocale();
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  const redirectToParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : "";
  const signupErrorPath = "/account/sign-up?error=";

  const { allowed } = await checkRateLimit("signup", await getClientIp());
  if (!allowed) {
    redirect(`${signupErrorPath}${encodeURIComponent(t("error_rate_limited", locale))}${redirectToParam}`);
  }

  const rawPhone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  // Collected as two separate fields (classic form convention -- see
  // sign-up/page.tsx) but stored as one patients.full_name, same as every
  // other patient record in this app (AI intake, guest booking, admin).
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const agreedToTerms = formData.get("agreedToTerms") === "on";

  if (!rawPhone || !password || !firstName || !lastName) {
    redirect(`${signupErrorPath}${encodeURIComponent(t("error_fill_all_fields", locale))}${redirectToParam}`);
  }

  if (!agreedToTerms) {
    redirect(
      `${signupErrorPath}${encodeURIComponent(t("error_must_agree_terms", locale))}${redirectToParam}`
    );
  }

  // The form now accepts local ("0712345678") as well as E.164 input -- every
  // downstream use (the Auth user, patients.phone, the synthetic email) needs
  // the same normalized value, or a patient who types the local format ends
  // up with a patients.phone that doesn't match later phone-keyed lookups
  // (password reset, phone-collision checks) that normalize before querying.
  const phone = normalizeTanzanianPhoneToE164(rawPhone);

  const supabase = await createClient();
  const service = createServiceClient();
  const authEmail = patientAuthEmailFromPhone(phone);

  const { data, error } = await service.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    phone,
    phone_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone,
      role: "patient",
    },
  });

  if (error) {
    redirect(`${signupErrorPath}${encodeURIComponent(error.message)}${redirectToParam}`);
  }

  const userId = data.user?.id;
  if (!userId) {
    redirect(
      `${signupErrorPath}${encodeURIComponent(t("error_account_creation_failed", locale))}${redirectToParam}`
    );
  }

  // Patient row is created with the service-role client (same convention as
  // the reference-number lookup flow) rather than an extra RLS insert policy
  // -- keeps "who can write to patients" in one place. No reference number
  // yet -- that's only assigned once this patient's first consultation
  // payment is confirmed (see lib/patient-account.ts's
  // ensurePatientReferenceNumber), same as every other account-creation path.
  const { data: insertedPatient, error: insertError } = await service
    .from("patients")
    .insert({
      user_id: userId,
      full_name: fullName,
      phone,
    })
    .select("id")
    .single();

  if (insertError || !insertedPatient) {
    await service.auth.admin.deleteUser(userId);
    redirect(
      `${signupErrorPath}${encodeURIComponent(insertError?.message ?? t("error_account_creation_failed", locale))}${redirectToParam}`
    );
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password,
  });

  if (signInError) {
    redirect(`/account?error=${encodeURIComponent(signInError.message)}${redirectToParam}`);
  }

  // Everything past this point (booking, payment, joining a call) checks
  // getPatientSession()'s JWT cookie, not the Supabase Auth session --
  // without this, a patient who just created a full account would still
  // hit "session expired" the moment they tried to actually book anything.
  // Long TTL: a real account should stay signed in until they explicitly
  // log out, not get silently kicked back to a login screen a day later.
  await createPatientSession(insertedPatient.id, LONG_TTL_SECONDS);

  redirect(safeRedirectPath(redirectTo, "/account/dashboard"));
}

export async function signIn(formData: FormData) {
  const locale = await getServerLocale();
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  const redirectToParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : "";
  // Lets a login form embedded somewhere other than /account (e.g. a doctor's
  // profile page, so a failed attempt lands the patient right back where
  // they were instead of on the standalone page) send failures back to
  // itself. Defaults to /account, same as before this existed.
  const errorRedirectPath = safeRedirectPath(String(formData.get("errorRedirectPath") ?? ""), "/account");

  const { allowed } = await checkRateLimit("auth", await getClientIp());
  if (!allowed) {
    redirect(`${errorRedirectPath}?error=${encodeURIComponent(t("error_rate_limited", locale))}${redirectToParam}`);
  }

  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: patientAuthEmailFromPhone(phone),
    password,
  });

  if (error) {
    redirect(`${errorRedirectPath}?error=${encodeURIComponent(error.message)}${redirectToParam}`);
  }

  // Everything past this point (booking, payment, joining a call) checks
  // getPatientSession()'s JWT cookie, not the Supabase Auth session -- this
  // was the actual reason a fully logged-in patient could still hit
  // "session expired" trying to book: signIn only ever established the
  // Supabase side. Long TTL, same reasoning as signUp above.
  const service = createServiceClient();
  const { data: patient } = await service
    .from("patients")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (patient) {
    await createPatientSession(patient.id, LONG_TTL_SECONDS);
  }

  redirect(safeRedirectPath(redirectTo, "/account/dashboard"));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // signIn/signUp establish this cookie alongside the Supabase Auth session
  // (see their comments) precisely because everything else in the app
  // checks it, not Supabase's -- clearing only the Supabase side here would
  // leave every booking/payment/video-join gate still thinking this patient
  // is signed in.
  await clearPatientSession();
  redirect("/account");
}

// Patients sign in with a synthetic email (see lib/patient-auth-email.ts),
// so Supabase's normal emailed-reset-link flow -- used for staff, see
// doctor/actions.ts's requestStaffPasswordReset -- can't reach them at all.
// This texts a 6-digit code to their real phone instead.
export async function requestPatientPasswordReset(formData: FormData) {
  const locale = await getServerLocale();
  const phone = String(formData.get("phone") ?? "").trim();
  const errorPath = "/account/forgot-password?error=";

  const { allowed } = await checkRateLimit("patientPasswordReset", await getClientIp());
  if (!allowed) {
    redirect(`${errorPath}${encodeURIComponent(t("error_rate_limited", locale))}`);
  }

  if (!phone) {
    redirect(`${errorPath}${encodeURIComponent(t("error_fill_all_fields", locale))}`);
  }

  const normalizedPhone = normalizeTanzanianPhoneToE164(phone);
  const service = createServiceClient();
  const { data: patient } = await service
    .from("patients")
    .select("id, user_id")
    .eq("phone", normalizedPhone)
    .maybeSingle();

  // Same next screen whether or not this phone belongs to a real account --
  // confirming/denying here would let someone probe which numbers are
  // registered patients.
  if (patient?.user_id) {
    const code = generateResetCode();
    await service
      .from("patients")
      .update({ password_reset_code_hash: hashResetCode(code), password_reset_code_expires_at: resetCodeExpiry().toISOString() })
      .eq("id", patient.id);

    try {
      await sendSms(normalizedPhone, `Your Afya24 password reset code is ${code}. It expires in 10 minutes.`);
    } catch (err) {
      // Still redirect to the same "check your phone" screen -- leaking an
      // SMS-provider failure here would tell an attacker this number is a
      // real account. A genuine patient who never got the text can just
      // request a new one.
      console.error("Failed to send patient password reset SMS", err);
    }
  }

  redirect(`/account/reset-password?phone=${encodeURIComponent(normalizedPhone)}`);
}

export async function resetPatientPassword(formData: FormData) {
  const locale = await getServerLocale();
  const phone = String(formData.get("phone") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const errorPath = `/account/reset-password?phone=${encodeURIComponent(phone)}&error=`;

  const { allowed } = await checkRateLimit("auth", await getClientIp());
  if (!allowed) {
    redirect(`${errorPath}${encodeURIComponent(t("error_rate_limited", locale))}`);
  }

  if (!phone || !code || !password) {
    redirect(`${errorPath}${encodeURIComponent(t("error_fill_all_fields", locale))}`);
  }

  if (password.length < 8) {
    redirect(`${errorPath}${encodeURIComponent(t("doctor_msg_password_min_length", locale))}`);
  }

  if (password !== confirmPassword) {
    redirect(`${errorPath}${encodeURIComponent(t("error_passwords_dont_match", locale))}`);
  }

  const normalizedPhone = normalizeTanzanianPhoneToE164(phone);
  const service = createServiceClient();
  const { data: patient } = await service
    .from("patients")
    .select("id, user_id, password_reset_code_hash, password_reset_code_expires_at")
    .eq("phone", normalizedPhone)
    .maybeSingle();

  const isValid =
    Boolean(patient?.user_id) &&
    Boolean(patient?.password_reset_code_hash) &&
    Boolean(patient?.password_reset_code_expires_at) &&
    new Date(patient!.password_reset_code_expires_at as string) > new Date() &&
    verifyResetCode(code, patient!.password_reset_code_hash as string);

  if (!isValid) {
    redirect(`${errorPath}${encodeURIComponent(t("error_invalid_reset_code", locale))}`);
  }

  const { error: updateError } = await service.auth.admin.updateUserById(patient!.user_id as string, { password });
  if (updateError) {
    redirect(`${errorPath}${encodeURIComponent(updateError.message)}`);
  }

  // One-time use -- the code can't be replayed even if it somehow leaked.
  await service
    .from("patients")
    .update({ password_reset_code_hash: null, password_reset_code_expires_at: null })
    .eq("id", patient!.id);

  redirect("/account?reset=1");
}
