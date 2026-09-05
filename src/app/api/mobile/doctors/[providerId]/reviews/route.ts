import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Public, unauthenticated -- a doctor's published patient reviews, for the
// mobile app's doctor-profile screen. Two gates, both required: the patient
// consented to a public testimonial (testimonial_consent) AND an admin has
// separately approved it for display (is_published) -- see migration 0029's
// comment for why consent alone was never meant to be enough. No patient
// name/reference is returned here, unlike the admin feedback panel -- this
// is public data.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  if (!providerId) {
    return NextResponse.json({ ok: false, error: "Missing provider id." }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from("consultation_feedback")
      .select("id, rating, testimonial_text, created_at")
      .eq("provider_id", providerId)
      .eq("testimonial_consent", true)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const reviews = (data ?? []).map((row) => ({
      id: row.id as string,
      rating: row.rating as number,
      text: row.testimonial_text as string,
      createdAt: row.created_at as string,
    }));

    return NextResponse.json({ ok: true, reviews });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not load reviews." },
      { status: 500 }
    );
  }
}
