import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPatientSession } from "@/lib/patient-session";
import { ensurePatientReferenceNumber } from "@/lib/patient-account";
import { getSnippePaymentStatus } from "@/lib/payments/snippe";
import { applySnippePaymentResult } from "@/lib/payments/reconcile";

// Mobile-native equivalent of consultation/actions.ts's
// checkSnippePaymentStatus -- polled every few seconds from PaymentScreen's
// waiting state, same webhook-usually-wins-but-never-assumes-it-arrived
// behavior. Always 200s with a "pending" body on any unexpected failure,
// same reasoning as the web version: there's nothing useful to do with an
// error while the patient is just watching a spinner.
export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ status: "pending" });
  }

  const body = await request.json().catch(() => null);
  const appointmentId = typeof body?.appointmentId === "string" ? body.appointmentId : "";
  if (!appointmentId) {
    return NextResponse.json({ status: "pending" });
  }

  try {
    const service = createServiceClient();
    const { data: appointment } = await service
      .from("appointments")
      .select("payment_status, patient_id")
      .eq("id", appointmentId)
      .eq("patient_id", session.patientId)
      .maybeSingle();

    if (!appointment) return NextResponse.json({ status: "pending" });
    if (appointment.payment_status === "paid") {
      const hospitalReferenceNumber = await ensurePatientReferenceNumber(service, appointment.patient_id as string);
      return NextResponse.json({ status: "paid", hospitalReferenceNumber });
    }
    if (appointment.payment_status === "failed") return NextResponse.json({ status: "failed" });

    const { data: payment } = await service
      .from("payments")
      .select("reference")
      .eq("appointment_id", appointmentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.reference) return NextResponse.json({ status: "pending" });

    const snippeResult = await getSnippePaymentStatus(payment.reference);
    if (!snippeResult.found || snippeResult.status === "pending") {
      return NextResponse.json({ status: "pending" });
    }

    const applied = await applySnippePaymentResult({
      reference: payment.reference,
      snippeStatus: snippeResult.status,
      source: "poll_fallback",
    });

    if (applied.applied) {
      return snippeResult.status === "completed"
        ? NextResponse.json({ status: "paid", hospitalReferenceNumber: applied.hospitalReferenceNumber })
        : NextResponse.json({ status: "failed" });
    }

    const { data: fresh } = await service.from("appointments").select("payment_status").eq("id", appointmentId).single();
    if (fresh?.payment_status === "paid") {
      const hospitalReferenceNumber = await ensurePatientReferenceNumber(service, appointment.patient_id as string);
      return NextResponse.json({ status: "paid", hospitalReferenceNumber });
    }
    if (fresh?.payment_status === "failed") return NextResponse.json({ status: "failed" });
    return NextResponse.json({ status: "pending" });
  } catch (error) {
    console.error("mobile checkSnippePaymentStatus failed", error);
    return NextResponse.json({ status: "pending" });
  }
}
