"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createPatientSession, clearPatientSession, LONG_TTL_SECONDS } from "@/lib/patient-session";
import { deletePatientAccount, resolvePatientForVerifiedPhone } from "@/lib/patient-account";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { patientAuthEmailFromPhone } from "@/lib/patient-auth-email";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { issuePatientOtp, verifyPatientOtp as verifyPatientOtpCode } from "@/lib/patient-otp";
import { sendSms } from "@/lib/sms/africas-talking";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Phone+OTP (or Continue with Google, see auth/callback/route.ts) is the
// only way a patient signs in or signs up now -- no password, no separate
// sign-up form. requestPatientOtp texts a 6-digit code to the phone;
// verifyPatientOtp checks it and, via resolvePatientForVerifiedPhone,
// transparently handles first-time sign-up, an ordinary sign-in, and
// claiming an orphaned guest/AI-intake record under the same phone, all as
// one flow -- the patient never sees "sign up" and "sign in" as different
// screens.
export async function requestPatientOtp(formData: FormData) {
  const locale = await getServerLocale();
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  const redirectToParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : "";
  const errorPath = "/account?error=";

  const { allowed } = await checkRateLimit("patientOtp", await getClientIp());
  if (!allowed) {
    redirect(`${errorPath}${encodeURIComponent(t("error_rate_limited", locale))}${redirectToParam}`);
  }

  const rawPhone = String(formData.get("phone") ?? "").trim();
  if (!rawPhone) {
    redirect(`${errorPath}${encodeURIComponent(t("error_fill_all_fields", locale))}${redirectToParam}`);
  }

  const phone = normalizeTanzanianPhoneToE164(rawPhone);
  const code = await issuePatientOtp(phone);

  // NOT LIVE YET (see lib/sms/africas-talking.ts) -- until a real Sender ID
  // is approved, sendSms always throws. Rather than strand the patient on a
  // "check your phone" screen with no way to actually get in (the old
  // password-reset flow's gap), the code is surfaced directly to the verify
  // screen as devOtp when sending fails. This must come out once SMS is
  // confirmed working -- the moment sendSms stops throwing, devOtp stops
  // being attached automatically.
  let devOtp: string | null = null;
  try {
    await sendSms(phone, `Your Afya24 code is ${code}. It expires in 10 minutes.`);
  } catch (err) {
    console.error("Failed to send patient OTP SMS -- falling back to devOtp", err);
    devOtp = code;
  }

  const devOtpParam = devOtp ? `&devOtp=${encodeURIComponent(devOtp)}` : "";
  redirect(`/account/verify?phone=${encodeURIComponent(phone)}${redirectToParam}${devOtpParam}`);
}

export async function verifyPatientOtp(formData: FormData) {
  const locale = await getServerLocale();
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  const redirectToParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : "";
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const errorPath = `/account/verify?phone=${encodeURIComponent(rawPhone)}${redirectToParam}&error=`;

  const { allowed } = await checkRateLimit("auth", await getClientIp());
  if (!allowed) {
    redirect(`${errorPath}${encodeURIComponent(t("error_rate_limited", locale))}`);
  }

  if (!rawPhone || !code) {
    redirect(`${errorPath}${encodeURIComponent(t("error_fill_all_fields", locale))}`);
  }

  const phone = normalizeTanzanianPhoneToE164(rawPhone);
  const result = await verifyPatientOtpCode(phone, code);
  if (result !== "ok") {
    redirect(`${errorPath}${encodeURIComponent(t(`error_otp_${result}`, locale))}`);
  }

  const service = createServiceClient();
  let resolved;
  try {
    resolved = await resolvePatientForVerifiedPhone(service, phone);
  } catch (err) {
    redirect(`${errorPath}${encodeURIComponent(err instanceof Error ? err.message : t("error_account_creation_failed", locale))}`);
  }

  // Establishes the real Supabase Auth session (cookie-based) on top of the
  // freshly-(re)issued random password -- the web dashboard's own
  // supabase.auth.getUser() checks (e.g. deleteAccount below) depend on this
  // existing, same as it did under password sign-in. The password itself is
  // never seen by the patient and is regenerated on every verify.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: patientAuthEmailFromPhone(phone),
    password: resolved.password,
  });
  if (signInError) {
    redirect(`${errorPath}${encodeURIComponent(signInError.message)}`);
  }

  // Everything past this point (booking, payment, joining a call) checks
  // getPatientSession()'s JWT cookie, not the Supabase Auth session. Long
  // TTL: a real account should stay signed in until they explicitly log
  // out, not get silently kicked back to a login screen a day later.
  await createPatientSession(resolved.patientId, LONG_TTL_SECONDS);

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

export type AccountActionState = {
  status: "idle" | "error";
  message: string;
};

// App Store Guideline 5.1.1(v) self-service deletion (see
// lib/patient-account.ts's deletePatientAccount for the full anonymize-not-
// hard-delete rationale). The confirm phrase is checked here, not just in
// the client component, so this can't be triggered by a bare POST -- the
// patient being deleted is read from their own authenticated session, never
// from a client-supplied id, so there's no way to target anyone else's
// account either.
export async function deleteAccount(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const confirmText = String(formData.get("confirm") ?? "").trim();
  if (confirmText !== "DELETE") {
    return { status: "error", message: "Type DELETE to confirm." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/account");
  }

  const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).maybeSingle();
  if (!patient) {
    return { status: "error", message: "Could not find your account." };
  }

  try {
    await deletePatientAccount(patient.id);
  } catch (error) {
    console.error("deletePatientAccount failed", error);
    return { status: "error", message: "Could not delete your account. Please try again." };
  }

  await supabase.auth.signOut();
  await clearPatientSession();
  redirect("/account/deleted");
}

