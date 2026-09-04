import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPatientSession } from "@/lib/patient-session";
import { applySnippePaymentResult } from "@/lib/payments/reconcile";

// Mobile-native equivalent of consultation/actions.ts's cancelSnippePayment
// -- same "mark the pending attempt voided so the next Pay tap fires a
// fresh STK push instead of silently reusing a dead reference" behavior,
// JSON result instead of a throw.
export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const appointmentId = typeof body?.appointmentId === "string" ? body.appointmentId : "";
  if (!appointmentId) {
    return NextResponse.json({ ok: false, error: "Missing appointmentId." }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const { data: appointment } = await service
      .from("appointments")
      .select("id")
      .eq("id", appointmentId)
      .eq("patient_id", session.patientId)
      .maybeSingle();

    if (!appointment) {
      return NextResponse.json({ ok: false, error: "Not authorized for this appointment." }, { status: 403 });
    }

    const { data: payment } = await service
      .from("payments")
      .select("reference")
      .eq("appointment_id", appointmentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (payment?.reference) {
      await applySnippePaymentResult({ reference: payment.reference, snippeStatus: "voided", source: "patient_cancelled" });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not cancel this payment." },
      { status: 500 }
    );
  }
}
