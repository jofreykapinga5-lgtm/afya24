import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { placePharmacyOrder } from "@/app/pharmacy/actions";
import type { FulfillmentMethod } from "@/lib/types";

// placePharmacyOrder is reused directly, unmodified -- it already takes a
// plain object (no FormData, no redirect(), no cookies().set()) and reads
// the patient via getPatientSession(), which is Bearer-header-aware (see
// lib/patient-session.ts), so it's already correct for a mobile caller as
// written. It also already enforces the real prescription gate itself
// (rejects any requires_prescription item outright -- see its own comment),
// so there's nothing extra to re-check here.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const rawLines: unknown = body?.lines;
  const fulfillmentMethod: FulfillmentMethod = body?.fulfillmentMethod === "delivery" ? "delivery" : "pickup";

  if (
    !Array.isArray(rawLines) ||
    rawLines.some(
      (line: unknown) =>
        typeof (line as { itemId?: unknown })?.itemId !== "string" ||
        typeof (line as { quantity?: unknown })?.quantity !== "number"
    )
  ) {
    return NextResponse.json({ ok: false, message: "Your cart looks invalid. Please review it and try again." }, { status: 400 });
  }
  const lines = rawLines as { itemId: string; quantity: number }[];

  const result = await placePharmacyOrder({ lines, fulfillmentMethod });
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, orderId: result.orderId });
}
