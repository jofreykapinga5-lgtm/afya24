import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";

// A patient looking at a doctor who's currently offline can ask to be
// pushed once that doctor comes back (see doctor-availability-subscriptions.ts
// for where this actually fires). GET checks whether they've already asked;
// POST toggles it on/off, so the mobile "Notify me" button can be driven by
// one endpoint instead of separate subscribe/unsubscribe routes.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ providerId: string }> }) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }
  const { providerId } = await params;

  const service = createServiceClient();
  const { data } = await service
    .from("doctor_availability_subscriptions")
    .select("id")
    .eq("patient_id", session.patientId)
    .eq("provider_id", providerId)
    .maybeSingle();

  return NextResponse.json({ ok: true, subscribed: Boolean(data) });
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ providerId: string }> }) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }
  const { providerId } = await params;

  const service = createServiceClient();
  const { data: existing } = await service
    .from("doctor_availability_subscriptions")
    .select("id")
    .eq("patient_id", session.patientId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (existing) {
    const { error } = await service
      .from("doctor_availability_subscriptions")
      .delete()
      .eq("patient_id", session.patientId)
      .eq("provider_id", providerId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, subscribed: false });
  }

  const { error } = await service
    .from("doctor_availability_subscriptions")
    .insert({ patient_id: session.patientId, provider_id: providerId });
  // A double-tap (or a client retry on a slow response) can race two POSTs
  // here: both see `existing` as null before either insert commits, so the
  // second hits the table's unique(patient_id, provider_id) constraint
  // (23505). That isn't a real failure -- the patient ends up correctly
  // subscribed either way -- so treat it the same as a fresh success instead
  // of surfacing a 500 for what looks, to the patient, like a harmless
  // double-tap on "Notify me".
  if (error && error.code !== "23505") {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, subscribed: true });
}
