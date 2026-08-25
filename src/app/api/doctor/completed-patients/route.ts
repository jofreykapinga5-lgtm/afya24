import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { toTitleCase } from "@/lib/format-name";

type CompletedAppointmentRow = {
  id: string;
  patient_id: string;
  updated_at: string;
  patients: { full_name: string; hospital_reference_number: string } | null;
  consultation_orders: { consultation_mode: string }[] | null;
};

// Dar es Salaam has no DST and sits at a fixed UTC+3 -- a plain offset is
// enough to turn "today" into the right UTC instant boundaries without
// pulling in a timezone library for one calculation.
const DAR_ES_SALAAM_OFFSET_MS = 3 * 60 * 60 * 1000;

function darEsSalaamDayStart(daysAgo: number) {
  const nowInDar = new Date(Date.now() + DAR_ES_SALAAM_OFFSET_MS);
  const dayStartInDar = new Date(
    Date.UTC(nowInDar.getUTCFullYear(), nowInDar.getUTCMonth(), nowInDar.getUTCDate() - daysAgo)
  );
  return new Date(dayStartInDar.getTime() - DAR_ES_SALAAM_OFFSET_MS);
}

function rangeForPeriod(period: string, fromParam: string | null, toParam: string | null) {
  if (period === "yesterday") {
    return { start: darEsSalaamDayStart(1), end: darEsSalaamDayStart(0) };
  }
  if (period === "week") {
    return { start: darEsSalaamDayStart(6), end: darEsSalaamDayStart(-1) };
  }
  if (period === "30d") {
    return { start: darEsSalaamDayStart(29), end: darEsSalaamDayStart(-1) };
  }
  if (period === "custom" && fromParam && toParam) {
    const start = new Date(`${fromParam}T00:00:00+03:00`);
    const end = new Date(`${toParam}T00:00:00+03:00`);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }
  // "today" default
  return { start: darEsSalaamDayStart(0), end: darEsSalaamDayStart(-1) };
}

export async function GET(request: Request) {
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
    return NextResponse.json({ items: [] });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get("period") ?? "today";
  const { start, end } = rangeForPeriod(period, url.searchParams.get("from"), url.searchParams.get("to"));

  const { data: appointments } = await service
    .from("appointments")
    .select("id, patient_id, updated_at, patients(full_name, hospital_reference_number), consultation_orders(consultation_mode)")
    .eq("provider_id", provider.id)
    .eq("status", "completed")
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString())
    .order("updated_at", { ascending: false })
    .returns<CompletedAppointmentRow[]>();

  const items = (appointments ?? []).map((appointment) => ({
    id: appointment.id,
    patientId: appointment.patient_id,
    patientName: toTitleCase(appointment.patients?.full_name ?? "Patient"),
    patientReference: appointment.patients?.hospital_reference_number ?? "",
    consultationMode:
      appointment.consultation_orders?.[0]?.consultation_mode === "voice" ? ("voice" as const) : ("video" as const),
    completedAt: appointment.updated_at,
  }));

  return NextResponse.json({ items });
}
