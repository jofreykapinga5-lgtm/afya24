import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";

// Body: { id: string } marks one notification read; { all: true } marks
// every one of this patient's unread notifications read (mirrors the
// mock UI's "Mark all read" action). Ownership is enforced via
// patient_id, same convention as every other mobile write route -- an id
// that isn't this patient's own is silently a 0-row no-op, not a leak.
export async function POST(request: NextRequest) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const service = createServiceClient();
  const readAt = new Date().toISOString();

  if (body?.all === true) {
    const { error } = await service
      .from("patient_notifications")
      .update({ read_at: readAt })
      .eq("patient_id", session.patientId)
      .is("read_at", null);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
  }

  const { error } = await service
    .from("patient_notifications")
    .update({ read_at: readAt })
    .eq("id", id)
    .eq("patient_id", session.patientId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
