import "server-only";
import type { createServiceClient } from "@/lib/supabase/service";

const DEFAULT_SERVICE_NAME = "General Teleconsultation";

// Looked up by name rather than a hardcoded id -- see
// supabase/migrations/0006_seed_default_service.sql, which seeds exactly
// this row. Throws instead of silently falling back so a missing migration
// fails loudly at booking time rather than corrupting an appointment.
export async function getDefaultService(service: ReturnType<typeof createServiceClient>) {
  const { data, error } = await service
    .from("services")
    .select("id, base_price")
    .eq("name", DEFAULT_SERVICE_NAME)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `Default service "${DEFAULT_SERVICE_NAME}" not found -- run 0006_seed_default_service.sql.`
    );
  }

  return { id: data.id as string, basePrice: Number(data.base_price) };
}
