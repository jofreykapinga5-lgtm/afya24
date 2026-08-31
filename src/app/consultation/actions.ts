"use server";

import { randomUUID } from "node:crypto";
import { unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPatientSession } from "@/lib/patient-session";
import { patientAuthEmailFromPhone } from "@/lib/patient-auth-email";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { ensurePatientReferenceNumber } from "@/lib/patient-account";
import {
  createSnippeCollectionPayment,
  getSnippePaymentStatus,
  type SnippeChannelProvider,
} from "@/lib/payments/snippe";
import { applySnippePaymentResult } from "@/lib/payments/reconcile";
import { checkRateLimit } from "@/lib/rate-limit";

// Turns the lightweight, no-password patient record the AI created into a
// real account -- attaches a Supabase Auth user to the SAME patients row,
// rather than creating a second, unlinked row for the same person. Reuses
// the phone already collected during intake. No password prompt -- the
// patient's date of birth (already on file; both intake paths require it)
// becomes the account password, the same YYYY-MM-DD form the sign-up page's
// DobSelect already uses, so sign-in later needs only their phone number
// and the birthdate they already know.
//
// Idempotent by design (an existing full account is `ok: true`, not an
// error) -- this is called both as an optional post-call upsell (gated on
// !patientHasFullAccount, so it should never actually hit that case) and as
// a required gate before viewing matched doctors, where "you already have
// an account" is a pass, not a failure the caller needs to handle specially.
export type UpgradeAccountResult = { ok: true } | { ok: false; message: string };

// Returns a result object rather than throwing -- see initiateSnippePayment's
// comment below for why: a thrown Error from a Server Action never reaches
// the client's try/catch with a readable message in production, only a
// generic digest-only "Server Components render" error (React error #441).
// This function used to throw and was hitting exactly that failure mode.
export async function upgradeToFullAccount(): Promise<UpgradeAccountResult> {
  try {
    const session = await getPatientSession();
    if (!session) {
      return { ok: false, message: "Your session expired. Please log in again to continue." };
    }

    const service = createServiceClient();
    const { data: patient, error: patientError } = await service
      .from("patients")
      .select("id, phone, user_id, date_of_birth")
      .eq("id", session.patientId)
      .maybeSingle();

    if (patientError || !patient) {
      return { ok: false, message: "Could not find your patient record." };
    }
    if (patient.user_id) {
      return { ok: true };
    }
    if (!patient.phone) {
      return { ok: false, message: "No phone number on file to create an account with." };
    }
    if (!patient.date_of_birth) {
      return { ok: false, message: "No date of birth on file to create an account with." };
    }

    const password = patient.date_of_birth;
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
        return { ok: false, message: "This phone number already has an account. Sign in instead at /account." };
      }
      return { ok: false, message: createError?.message ?? "Could not create your account." };
    }

    const { error: linkError } = await service
      .from("patients")
      .update({ user_id: created.user.id })
      .eq("id", patient.id);

    if (linkError) {
      await service.auth.admin.deleteUser(created.user.id);
      return { ok: false, message: linkError.message };
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
      return { ok: false, message: signInError.message };
    }

    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not create your account." };
  }
}

const PENDING_PAYMENT_REUSE_WINDOW_MS = 60 * 1000;

function appBaseUrl() {
  const url = process.env.APP_BASE_URL;
  if (!url) {
    throw new Error("APP_BASE_URL is not set");
  }
  return url.replace(/\/$/, "");
}

// Kicks off (or resumes) a Snippe mobile-money collection for a booked
// consultation. Never trusts a client-supplied amount -- always re-reads
// appointments.price/currency. The webhook (see api/payments/snippe-webhook)
// and checkSnippePaymentStatus's poll-fallback both settle the result
// through the same lib/payments/reconcile.ts helper, so this action only
// ever needs to get a payment *started*, not confirmed.
export type InitiatePaymentResult =
  | { ok: true; alreadyPaid: boolean; reference: string | null; hospitalReferenceNumber: string | null }
  | { ok: false; message: string };

// Returns a result object rather than throwing -- confirmed twice now (a
// missing env var, then a gateway amount-validation rejection) that a
// thrown Error from this action never reaches the client's try/catch with
// a readable message in production. Next serializes the Server Action
// invocation through the same RSC stream as the page's re-render, and an
// uncaught throw there surfaces to the client as a generic, digest-only
// "Server Components render" error (React error #441) -- not the specific
// message this function actually threw. Returning a value sidesteps that
// entirely: the client always gets a real Promise result to branch on.
export async function initiateSnippePayment(input: {
  appointmentId: string;
  channelProvider: SnippeChannelProvider;
  phone: string;
}): Promise<InitiatePaymentResult> {
  try {
    const session = await getPatientSession();
    if (!session) {
      return { ok: false, message: "Your session expired. Please start the intake chat again." };
    }

    const service = createServiceClient();
    const { data: appointment, error: appointmentError } = await service
      .from("appointments")
      .select("id, patient_id, price, currency, payment_status")
      .eq("id", input.appointmentId)
      .maybeSingle();

    if (appointmentError || !appointment) {
      return { ok: false, message: appointmentError?.message ?? "Appointment not found." };
    }
    if (appointment.patient_id !== session.patientId) {
      return { ok: false, message: "Not authorized for this appointment." };
    }
    if (appointment.payment_status === "paid") {
      const hospitalReferenceNumber = await ensurePatientReferenceNumber(service, appointment.patient_id);
      return { ok: true, alreadyPaid: true, reference: null, hospitalReferenceNumber };
    }

    // Keyed by appointment, not IP -- each attempt can push a real
    // M-Pesa/Airtel prompt to the patient's phone, so this caps repeat
    // pushes for this specific appointment regardless of session/IP,
    // beyond what the 60s pending-reuse window below already absorbs.
    const { allowed } = await checkRateLimit("payment", input.appointmentId);
    if (!allowed) {
      return { ok: false, message: "Too many payment attempts. Please wait a few minutes and try again." };
    }

    const since = new Date(Date.now() - PENDING_PAYMENT_REUSE_WINDOW_MS).toISOString();
    const [{ data: patient }, { data: recentPending }] = await Promise.all([
      service.from("patients").select("full_name").eq("id", session.patientId).maybeSingle(),
      service
        .from("payments")
        .select("id, reference, idempotency_key")
        .eq("appointment_id", input.appointmentId)
        .eq("status", "pending")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const [firstName, ...rest] = (patient?.full_name ?? "Patient").trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName;

    // A previous attempt already has a live reference -- don't start a
    // second one just because the patient re-opened the pay page.
    if (recentPending?.reference) {
      return { ok: true, alreadyPaid: false, reference: recentPending.reference, hospitalReferenceNumber: null };
    }

    let paymentRowId: string;
    let idempotencyKey: string;

    if (recentPending) {
      paymentRowId = recentPending.id;
      idempotencyKey = recentPending.idempotency_key ?? randomUUID().replace(/-/g, "").slice(0, 30);
    } else {
      idempotencyKey = randomUUID().replace(/-/g, "").slice(0, 30);
      const { data: inserted, error: insertError } = await service
        .from("payments")
        .insert({
          appointment_id: input.appointmentId,
          patient_id: session.patientId,
          amount: appointment.price,
          currency: appointment.currency,
          method: input.channelProvider,
          status: "pending",
          idempotency_key: idempotencyKey,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        return { ok: false, message: insertError?.message ?? "Could not start the payment." };
      }
      paymentRowId = inserted.id;
    }

    const normalizedPhone = normalizeTanzanianPhoneToE164(input.phone).replace(/^\+/, "");

    const result = await createSnippeCollectionPayment({
      idempotencyKey,
      amountValue: Number(appointment.price),
      channelProvider: input.channelProvider,
      phone: normalizedPhone,
      firstName,
      lastName,
      email: patientAuthEmailFromPhone(input.phone),
      webhookUrl: `${appBaseUrl()}/api/payments/snippe-webhook`,
      metadata: { appointment_id: input.appointmentId },
    });

    await service.from("payments").update({ reference: result.reference }).eq("id", paymentRowId);

    return { ok: true, alreadyPaid: false, reference: result.reference, hospitalReferenceNumber: null };
  } catch (error) {
    console.error("initiateSnippePayment failed", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not start the payment. Please try again.",
    };
  }
}

export type ConsultationPaymentStatus =
  | { status: "pending" }
  | { status: "paid"; hospitalReferenceNumber: string | null }
  | { status: "failed" };

// The webhook usually wins this race (near-instant), but this action never
// assumes it arrived -- it calls Snippe directly whenever the local status
// is still "pending", so the pay page's own progress never depends on
// SNIPPE_WEBHOOK_SECRET being configured or a webhook actually being
// delivered.
// Never throws -- this is polled every few seconds while the patient just
// sees a spinner, so there's no useful place to surface a thrown message
// even if the client's try/catch *did* reliably receive it (which Server
// Actions don't guarantee in production -- see initiateSnippePayment's
// comment). Any unexpected failure here degrades to "pending"; the next
// tick retries, same as a transient network hiccup already does.
export async function checkSnippePaymentStatus(
  appointmentId: string
): Promise<ConsultationPaymentStatus> {
  try {
    const session = await getPatientSession();
    if (!session) return { status: "pending" };

    const service = createServiceClient();
    const { data: appointment } = await service
      .from("appointments")
      .select("payment_status, patient_id")
      .eq("id", appointmentId)
      .eq("patient_id", session.patientId)
      .maybeSingle();

    if (!appointment) return { status: "pending" };
    if (appointment.payment_status === "paid") {
      const hospitalReferenceNumber = await ensurePatientReferenceNumber(
        service,
        appointment.patient_id as string
      );
      return { status: "paid", hospitalReferenceNumber };
    }
    if (appointment.payment_status === "failed") return { status: "failed" };

    const { data: payment } = await service
      .from("payments")
      .select("reference")
      .eq("appointment_id", appointmentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.reference) {
      return { status: "pending" };
    }

    const snippeResult = await getSnippePaymentStatus(payment.reference);
    if (!snippeResult.found || snippeResult.status === "pending") {
      return { status: "pending" };
    }

    const applied = await applySnippePaymentResult({
      reference: payment.reference,
      snippeStatus: snippeResult.status,
      source: "poll_fallback",
    });

    if (applied.applied) {
      return snippeResult.status === "completed"
        ? { status: "paid", hospitalReferenceNumber: applied.hospitalReferenceNumber }
        : { status: "failed" };
    }

    // The webhook settled it between our two reads above -- trust the
    // appointment row's real status rather than what we just computed.
    const { data: fresh } = await service
      .from("appointments")
      .select("payment_status")
      .eq("id", appointmentId)
      .single();

    if (fresh?.payment_status === "paid") {
      const hospitalReferenceNumber = await ensurePatientReferenceNumber(
        service,
        appointment.patient_id as string
      );
      return { status: "paid", hospitalReferenceNumber };
    }
    if (fresh?.payment_status === "failed") return { status: "failed" };
    return { status: "pending" };
  } catch (error) {
    console.error("checkSnippePaymentStatus failed", error);
    return { status: "pending" };
  }
}

// Lets a patient back out of a stuck "waiting for payment" state -- Snippe
// doesn't reflect an on-phone cancellation right away (it just stays
// "pending" until the ~10-minute session naturally expires), so without this
// the patient would be stuck watching a spinner. Marks the attempt "failed"
// locally (source: "patient_cancelled") so initiateSnippePayment's 60s
// reuse window doesn't hand back this same dead reference on the next Pay
// click -- a real retry fires a fresh STK push instead of silently no-oping.
export async function cancelSnippePayment(appointmentId: string): Promise<void> {
  const session = await getPatientSession();
  if (!session) {
    throw new Error("Your session expired. Please start the intake chat again.");
  }

  const service = createServiceClient();
  const { data: appointment } = await service
    .from("appointments")
    .select("id")
    .eq("id", appointmentId)
    .eq("patient_id", session.patientId)
    .maybeSingle();

  if (!appointment) {
    throw new Error("Not authorized for this appointment.");
  }

  const { data: payment } = await service
    .from("payments")
    .select("reference")
    .eq("appointment_id", appointmentId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment?.reference) return;

  await applySnippePaymentResult({
    reference: payment.reference,
    snippeStatus: "voided",
    source: "patient_cancelled",
  });
}

// Called from /consultation/[id]/connect when the patient picks in-app
// voice or video -- corrects the "video" placeholder bookConsultation wrote
// at booking time (see doctors/actions.ts) to what they actually chose, so
// the doctor's video queue and the account-dashboard "join" link both agree
// with reality. Never called for phone-call/WhatsApp picks -- those bypass
// LiveKit entirely, so there's nothing here to correct.
export async function selectConnectionMode(appointmentId: string, mode: "voice" | "video") {
  const session = await getPatientSession();
  if (!session) {
    throw new Error("Your session expired. Please start the intake chat again.");
  }

  const service = createServiceClient();
  const { data: appointment } = await service
    .from("appointments")
    .select("id, payment_status")
    .eq("id", appointmentId)
    .eq("patient_id", session.patientId)
    .maybeSingle();

  if (!appointment) {
    throw new Error("Not authorized for this appointment.");
  }
  if (appointment.payment_status !== "paid") {
    throw new Error("Payment is required before you can join this consultation.");
  }

  await service
    .from("consultation_orders")
    .update({ consultation_mode: mode })
    .eq("appointment_id", appointmentId);
}

// Called from the "call ended" screen (CallRoom), before the account-upgrade
// offer -- patient-facing, skippable, one row per appointment. rating is
// required to submit at all (the Skip link bypasses the whole form instead);
// feedbackText is private quality feedback for admin/doctor review,
// testimonialText is a separate opt-in quote only usable publicly if the
// patient ticked the consent checkbox. Result-object return, not a throw --
// same reason as every other patient-facing action in this file (see
// initiateSnippePayment's comment).
export type SubmitFeedbackResult = { ok: true } | { ok: false; message: string };

export async function submitConsultationFeedback(input: {
  appointmentId: string;
  rating: number;
  feedbackText: string;
  testimonialText: string;
  testimonialConsent: boolean;
}): Promise<SubmitFeedbackResult> {
  try {
    const session = await getPatientSession();
    if (!session) {
      return { ok: false, message: "Your session expired." };
    }
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      return { ok: false, message: "Please choose a star rating." };
    }

    const service = createServiceClient();
    const { data: appointment, error: appointmentError } = await service
      .from("appointments")
      .select("id, patient_id, provider_id")
      .eq("id", input.appointmentId)
      .maybeSingle();

    if (appointmentError || !appointment) {
      return { ok: false, message: appointmentError?.message ?? "Appointment not found." };
    }
    if (appointment.patient_id !== session.patientId) {
      return { ok: false, message: "Not authorized for this appointment." };
    }

    // A testimonial someone typed but didn't consent to share publicly is
    // stored as private-only -- consent only counts alongside actual text.
    const testimonialText = input.testimonialText.trim();
    const testimonialConsent = testimonialText.length > 0 && input.testimonialConsent;

    const { error: upsertError } = await service.from("consultation_feedback").upsert(
      {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        provider_id: appointment.provider_id,
        rating: input.rating,
        feedback_text: input.feedbackText.trim() || null,
        testimonial_text: testimonialText || null,
        testimonial_consent: testimonialConsent,
      },
      { onConflict: "appointment_id" }
    );

    if (upsertError) {
      return { ok: false, message: upsertError.message };
    }

    return { ok: true };
  } catch (error) {
    console.error("submitConsultationFeedback failed", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not submit your feedback.",
    };
  }
}
