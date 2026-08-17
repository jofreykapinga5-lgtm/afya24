"use server";

import { randomUUID } from "node:crypto";
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

// Turns the lightweight, no-password patient record the AI created into a
// real account -- attaches a Supabase Auth user to the SAME patients row
// rather than the old /account/sign-up path of creating a second, unlinked
// row for the same person. Reuses the phone already collected during
// intake. No password prompt -- the patient's date of birth (already on
// file; both intake paths require it) becomes the account password, in the
// same YYYY-MM-DD form the /lookup DOB-alternative already uses, so sign-in
// later needs only their phone number and the birthdate they already know.
export async function upgradeToFullAccount() {
  const session = await getPatientSession();
  if (!session) {
    throw new Error("Your session expired. Please look yourself up again to continue.");
  }

  const service = createServiceClient();
  const { data: patient, error: patientError } = await service
    .from("patients")
    .select("id, phone, user_id, date_of_birth")
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
  if (!patient.date_of_birth) {
    throw new Error("No date of birth on file to create an account with.");
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
