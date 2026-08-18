import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type HistoryRow = {
  id: string;
  scheduled_at: string;
  doctor_notes: string | null;
  providers: { full_name: string } | null;
  ai_summaries: { summary_text: string; urgency_level: string }[] | null;
};

// Any active doctor can look up any patient's past-visit history by
// patient_id -- this is deliberately not scoped to "doctors who have treated
// this patient before". The whole point (per the reference-number-as-patient-
// file request) is continuity of care across doctors: whoever picks up a
// returning patient next should see what happened last time, the same way a
// shared clinic chart works.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const excludeAppointmentId = searchParams.get("excludeAppointmentId");

  if (!patientId) {
    return NextResponse.json({ error: "patientId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: profile } = await service
    .from("users")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "doctor" || profile.status !== "active") {
    return NextResponse.json({ error: "Doctor access required." }, { status: 403 });
  }

  const { data: provider } = await service
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .eq("profile_status", "active")
    .maybeSingle();

  if (!provider) {
    return NextResponse.json({ visits: [] });
  }

  let query = service
    .from("appointments")
    .select(
      "id, scheduled_at, doctor_notes, providers(full_name), ai_summaries(summary_text, urgency_level)"
    )
    .eq("patient_id", patientId)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false })
    .limit(20);

  if (excludeAppointmentId) {
    query = query.neq("id", excludeAppointmentId);
  }

  const { data: rows } = await query.returns<HistoryRow[]>();

  const visits = (rows ?? []).map((row) => {
    const summary = row.ai_summaries?.[0];
    return {
      id: row.id,
      scheduledAt: row.scheduled_at,
      providerName: row.providers?.full_name ?? "Doctor",
      doctorNotes: row.doctor_notes ?? "",
      summaryText: summary?.summary_text ?? "",
      urgencyLevel: summary?.urgency_level ?? "low",
    };
  });

  return NextResponse.json({ visits });
}
