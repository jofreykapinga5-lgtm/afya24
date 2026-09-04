import { NextResponse } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";

// Real notifications -- see supabase/migrations/0024_patient_notifications.sql
// and lib/patient-notifications.ts. Returns kind + data, not pre-rendered
// text; the mobile client renders the actual title/body via its own
// notifCopy i18n templates (see NotificationsScreen), same reasoning as the
// table itself staying bilingual.
export async function GET() {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("patient_notifications")
    .select("id, kind, data, read_at, created_at")
    .eq("patient_id", session.patientId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const notifications = (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    data: row.data,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ ok: true, notifications });
}
