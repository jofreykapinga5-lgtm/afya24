import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { submitConsultationFeedback } from "@/app/consultation/actions";

// Mobile-native equivalent of the web call-ended screen's
// ConsultationFeedbackForm -- imports and calls the exact same
// submitConsultationFeedback used there (it's already a plain
// getPatientSession()-based function with no cookie/redirect side effects,
// so it's directly reusable here, same as bookConsultationForPatient is for
// booking) instead of a parallel implementation.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const appointmentId = typeof body?.appointmentId === "string" ? body.appointmentId : "";
  const rating = Number(body?.rating);
  if (!appointmentId) {
    return NextResponse.json({ ok: false, error: "Missing appointmentId." }, { status: 400 });
  }

  const result = await submitConsultationFeedback({
    appointmentId,
    rating,
    feedbackText: typeof body?.feedbackText === "string" ? body.feedbackText : "",
    testimonialText: typeof body?.testimonialText === "string" ? body.testimonialText : "",
    testimonialConsent: body?.testimonialConsent === true,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
