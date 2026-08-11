// Supabase Auth's phone field requires E.164 ("+255712345678"). The manual
// /account/sign-up form enforces that at the HTML level (a pattern attribute
// with a placeholder showing the expected format), so it never reaches the
// server malformed. The AI chat and its fallback form have no such
// constraint -- patients type whatever format feels natural in conversation
// ("0712345678", "0712 345 678") -- so anything that hands a patient-given
// phone number to Supabase Auth needs to normalize it first.
export function normalizeTanzanianPhoneToE164(rawPhone: string): string {
  const digits = rawPhone.replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("255")) return `+${digits}`;
  if (digits.startsWith("0")) return `+255${digits.slice(1)}`;
  if (digits.length === 9) return `+255${digits}`;

  return `+${digits}`;
}
