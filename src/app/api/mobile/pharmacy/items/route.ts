import { NextResponse } from "next/server";
import { getPublishedPharmacyItems } from "@/lib/pharmacy-items";

// Same published catalog the web /pharmacy storefront reads -- public, no
// session required (matches the web page, which is reachable signed out).
export async function GET() {
  const items = await getPublishedPharmacyItems();
  return NextResponse.json({ ok: true, items });
}
