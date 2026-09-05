import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getDefaultService } from "@/lib/default-service";
import { getCachedActiveProviders } from "@/lib/cache/public-catalog";
import { mapProviderRow, type ProviderRow } from "@/lib/providers-mapping";
import type { Locale } from "@/lib/types";

// Public, unauthenticated -- same data the web /doctors page shows (this
// wraps the exact same getCachedActiveProviders() + mapProviderRow() the
// web page uses, not a parallel implementation), just as JSON for the
// mobile app instead of a rendered page. No booking/payment logic lives
// here -- this is read-only browsing.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale: Locale = searchParams.get("locale") === "sw" ? "sw" : "en";

  try {
    const service = createServiceClient();
    const [providerRows, defaultService] = await Promise.all([
      getCachedActiveProviders(),
      getDefaultService(service).catch(() => null),
    ]);

    const providerIds = (providerRows as ProviderRow[]).map((row) => row.id);

    // "Patients served" -- a mobile-only stat (not part of the shared
    // Provider type the web /doctors page uses, so it's merged onto the
    // JSON response here instead of touching mapProviderRow). Distinct
    // patient count per doctor across all-time completed appointments.
    const patientsServedByProvider = new Map<string, number>();
    if (providerIds.length > 0) {
      const { data: completedRows } = await service
        .from("appointments")
        .select("provider_id, patient_id")
        .eq("status", "completed")
        .in("provider_id", providerIds);

      const patientsByProvider = new Map<string, Set<string>>();
      for (const row of completedRows ?? []) {
        const providerId = row.provider_id as string;
        const patientId = row.patient_id as string;
        if (!patientsByProvider.has(providerId)) patientsByProvider.set(providerId, new Set());
        patientsByProvider.get(providerId)!.add(patientId);
      }
      for (const [providerId, patients] of patientsByProvider) {
        patientsServedByProvider.set(providerId, patients.size);
      }
    }

    const doctors = (providerRows as ProviderRow[]).map((row) => ({
      ...mapProviderRow(row, defaultService?.basePrice ?? 0, locale),
      patientsServed: patientsServedByProvider.get(row.id) ?? 0,
    }));

    // Doctors online right now first -- same ordering as the web page.
    doctors.sort((a, b) => Number(b.isAvailableNow) - Number(a.isAvailableNow));

    return NextResponse.json({ ok: true, doctors });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not load doctors." },
      { status: 500 }
    );
  }
}
