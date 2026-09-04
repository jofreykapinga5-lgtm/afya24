import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const times = Array.isArray(body?.times) ? body.times.filter((t: unknown) => typeof t === "string") : null;
  if (!id || !times) {
    return NextResponse.json({ ok: false, error: "Missing id or times." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("patient_self_medications")
    .update({ times })
    .eq("id", id)
    .eq("patient_id", session.patientId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "Not authorized for this medication." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
