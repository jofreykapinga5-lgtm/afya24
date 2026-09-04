import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPatientSession } from "@/lib/patient-session";
import { patientAuthEmailFromPhone } from "@/lib/patient-auth-email";
import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";
import { ensurePatientReferenceNumber } from "@/lib/patient-account";
import { createSnippeCollectionPayment, type SnippeChannelProvider } from "@/lib/payments/snippe";
import { checkRateLimit } from "@/lib/rate-limit";

const PENDING_PAYMENT_REUSE_WINDOW_MS = 60 * 1000;

function appBaseUrl() {
  const url = process.env.APP_BASE_URL;
  if (!url) throw new Error("APP_BASE_URL is not set");
  return url.replace(/\/$/, "");
}

// Mobile-native equivalent of consultation/actions.ts's initiateSnippePayment
// -- same re-priced-server-side, idempotent-reuse-window logic, reimplemented
// here (not imported) since this one's error handling already returns a
// value rather than throwing, matching this route's JSON convention
// directly -- imported straight through would still need this same
// request-parsing/Bearer-auth wrapper anyway.
export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const appointmentId = typeof body?.appointmentId === "string" ? body.appointmentId : "";
  const channelProvider = body?.channelProvider as SnippeChannelProvider | undefined;
  const phone = typeof body?.phone === "string" ? body.phone : "";
  const validProviders: SnippeChannelProvider[] = ["mpesa", "airtel", "halotel", "mixx"];
  if (!appointmentId || !phone || !channelProvider || !validProviders.includes(channelProvider)) {
    return NextResponse.json({ ok: false, error: "Missing or invalid payment details." }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const { data: appointment, error: appointmentError } = await service
      .from("appointments")
      .select("id, patient_id, price, currency, payment_status")
      .eq("id", appointmentId)
      .maybeSingle();

    if (appointmentError || !appointment) {
      return NextResponse.json({ ok: false, error: appointmentError?.message ?? "Appointment not found." }, { status: 404 });
    }
    if (appointment.patient_id !== session.patientId) {
      return NextResponse.json({ ok: false, error: "Not authorized for this appointment." }, { status: 403 });
    }
    if (appointment.payment_status === "paid") {
      const hospitalReferenceNumber = await ensurePatientReferenceNumber(service, appointment.patient_id);
      return NextResponse.json({ ok: true, alreadyPaid: true, reference: null, hospitalReferenceNumber });
    }

    const { allowed } = await checkRateLimit("payment", appointmentId);
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many payment attempts. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const since = new Date(Date.now() - PENDING_PAYMENT_REUSE_WINDOW_MS).toISOString();
    const [{ data: patient }, { data: recentPending }] = await Promise.all([
      service.from("patients").select("full_name").eq("id", session.patientId).maybeSingle(),
      service
        .from("payments")
        .select("id, reference, idempotency_key")
        .eq("appointment_id", appointmentId)
        .eq("status", "pending")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const [firstName, ...rest] = (patient?.full_name ?? "Patient").trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName;

    if (recentPending?.reference) {
      return NextResponse.json({ ok: true, alreadyPaid: false, reference: recentPending.reference, hospitalReferenceNumber: null });
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
          appointment_id: appointmentId,
          patient_id: session.patientId,
          amount: appointment.price,
          currency: appointment.currency,
          method: channelProvider,
          status: "pending",
          idempotency_key: idempotencyKey,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        return NextResponse.json({ ok: false, error: insertError?.message ?? "Could not start the payment." }, { status: 500 });
      }
      paymentRowId = inserted.id;
    }

    const normalizedPhone = normalizeTanzanianPhoneToE164(phone).replace(/^\+/, "");

    const result = await createSnippeCollectionPayment({
      idempotencyKey,
      amountValue: Number(appointment.price),
      channelProvider,
      phone: normalizedPhone,
      firstName,
      lastName,
      email: patientAuthEmailFromPhone(phone),
      webhookUrl: `${appBaseUrl()}/api/payments/snippe-webhook`,
      metadata: { appointment_id: appointmentId },
    });

    await service.from("payments").update({ reference: result.reference }).eq("id", paymentRowId);

    return NextResponse.json({ ok: true, alreadyPaid: false, reference: result.reference, hospitalReferenceNumber: null });
  } catch (error) {
    console.error("mobile initiateSnippePayment failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not start the payment. Please try again." },
      { status: 500 }
    );
  }
}
