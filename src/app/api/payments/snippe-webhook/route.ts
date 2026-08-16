import { NextResponse } from "next/server";
import { verifySnippeWebhookSignature, type SnippePaymentStatus } from "@/lib/payments/snippe";
import { applySnippePaymentResult } from "@/lib/payments/reconcile";

// Snippe posts here on payment.completed/failed/voided/expired. Unlike every
// other route in this app, this one reads the RAW body (request.text(), not
// .json()) because HMAC verification has to run against the exact bytes
// Snippe signed -- parsing first and re-serializing can silently change
// that byte sequence. See lib/payments/snippe.ts for the signature scheme.
//
// This route is intentionally reachable without auth (src/proxy.ts's
// PROTECTED_PREFIXES doesn't cover /api/payments/*) -- the HMAC signature is
// the authentication here, not a session.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("X-Webhook-Timestamp");
  const signature = request.headers.get("X-Webhook-Signature");

  if (!verifySnippeWebhookSignature(rawBody, timestamp, signature)) {
    console.error("Snippe webhook signature verification failed");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { type?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const reference = event.data?.reference;
  const snippeStatus = eventTypeToStatus(event.type);

  // Payout events, or a shape we don't recognize -- acknowledge so Snippe
  // doesn't retry something we were never going to act on.
  if (!reference || !snippeStatus) {
    return NextResponse.json({ received: true });
  }

  try {
    await applySnippePaymentResult({ reference, snippeStatus, source: "webhook" });
  } catch (error) {
    // Don't fail the webhook over this -- checkSnippePaymentStatus's poll
    // fallback will reconcile it independently on the patient's next poll
    // tick, and returning non-2xx here would just spend one of Snippe's
    // limited retry attempts on a case it can't help resolve.
    console.error("Snippe webhook reconciliation failed", error);
  }

  return NextResponse.json({ received: true });
}

function eventTypeToStatus(type: string | undefined): SnippePaymentStatus | null {
  switch (type) {
    case "payment.completed":
      return "completed";
    case "payment.failed":
      return "failed";
    case "payment.voided":
      return "voided";
    case "payment.expired":
      return "expired";
    default:
      return null;
  }
}
