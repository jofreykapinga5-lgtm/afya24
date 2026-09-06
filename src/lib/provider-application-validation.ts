import { normalizeTanzanianPhoneToE164 } from "@/lib/phone";

// Shared by both the public application form (src/app/doctor/apply/page.tsx,
// a client component) and the server route that's the real security boundary
// (src/app/api/provider-applications/route.ts) -- previously each declared
// its own copy of these patterns "mirroring" the other by comment only, with
// nothing enforcing they stayed identical; the phone check had already
// drifted (the client accepted values the server rejected) before this file
// existed. No "server-only" import here on purpose: normalizeTanzanianPhoneToE164
// (lib/phone.ts) already has none either, so both are safe in a client bundle.
//
// Letters only for name/region (never digits), digits only for phone/
// experience, a real email shape, and a conservative charset for a license
// number (letters/digits/hyphens -- real license numbers mix both, so this
// can't be numbers-only or letters-only the way name/phone can). The name
// class includes both the plain ASCII apostrophe and the Unicode right
// single quotation mark (U+2019) -- iOS/Android keyboards autocorrect a
// typed ' to the latter by default, so a real name like "O'Brien" or
// "D'Souza" typed on a phone would otherwise fail validation.
export const NAME_PATTERN = /^\p{L}[\p{L}\s'’.-]{1,79}$/u;
export const LICENSE_PATTERN = /^[A-Za-z0-9-]{3,40}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^\+\d{9,15}$/;
export const EXPERIENCE_PATTERN = /^\d{1,2}$/;

// The one true "is this phone valid" check -- normalizes first, same as the
// server's own insert path, so a client-side pass guarantees a server-side
// pass for the exact same input (previously the client tested a looser,
// un-normalized pattern that could accept a number the server then rejected).
export function isValidApplicationPhone(rawPhone: string): boolean {
  return PHONE_PATTERN.test(normalizeTanzanianPhoneToE164(rawPhone));
}
