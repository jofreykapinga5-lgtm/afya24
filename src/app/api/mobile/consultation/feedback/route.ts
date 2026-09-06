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
    // submitConsultationFeedback returns a plain message string, no error
    // code (it's shared with the web form, which doesn't need one -- a
    // browser session redirect handles "signed out" there). Every sibling
    // mobile route in this same diff (book, notify-when-available,
    // push-token) answers 401 specifically for "no/expired session", which
    // the mobile app's shared fetch layer needs to keep behaving consistently
    // (clearing the stored token and returning to sign-in) -- matching on
    // this exact known message is the smallest way to keep this route in
    // that same convention without changing the shared web/mobile result type.
    const status = result.message === "Your session expired." ? 401 : 400;
    return NextResponse.json({ ok: false, error: result.message }, { status });
  }
  return NextResponse.json({ ok: true });
}
