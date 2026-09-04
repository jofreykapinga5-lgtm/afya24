import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";

const VALID_FREQUENCIES = ["once", "twice", "thrice", "four", "asNeeded"];

export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const dose = typeof body?.dose === "string" ? body.dose.trim() : "";
  const frequency = typeof body?.frequency === "string" ? body.frequency : "";
  const times = Array.isArray(body?.times) ? body.times.filter((t: unknown) => typeof t === "string") : [];
  const courseDays = typeof body?.courseDays === "number" ? body.courseDays : null;

  if (!name || !dose || !VALID_FREQUENCIES.includes(frequency)) {
    return NextResponse.json({ ok: false, error: "Missing or invalid medication details." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("patient_self_medications")
    .insert({
      patient_id: session.patientId,
      name,
      dose,
      frequency,
      times,
      course_days: courseDays,
      started_on: new Date().toISOString().slice(0, 10),
    })
    .select("id, name, dose, frequency, times, course_days, started_on, ended_on")
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Could not add this medication." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    medication: {
      id: data.id,
      name: data.name,
      dose: data.dose,
      frequency: data.frequency,
      times: data.times,
      courseDays: data.course_days,
      startedOn: data.started_on,
      endedOn: data.ended_on,
    },
  });
}
