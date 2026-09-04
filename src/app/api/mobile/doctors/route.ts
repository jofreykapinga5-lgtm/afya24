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

    const doctors = (providerRows as ProviderRow[]).map((row) =>
      mapProviderRow(row, defaultService?.basePrice ?? 0, locale)
    );

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
