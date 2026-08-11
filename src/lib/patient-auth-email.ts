import { normalizeTanzanianPhoneToE164 } from "./phone";

// Supabase Auth's phone+password sign-in requires E.164-formatted numbers
// (e.g. "+255712345678"), but patients give locally-formatted numbers
// ("0712345678") through both the AI chat and the manual signup form.
// Rather than validate/reformat every number, both flows sign patients in
// with a synthetic email derived from their phone digits instead, with the
// real phone stored separately on the user and patients rows.
//
// Normalize to E.164 *before* deriving the email: "0712345678" and
// "+255712345678" are the same real number and must resolve to the same
// login email, or a patient who types their number differently between
// account creation and a later sign-in would be told it doesn't exist.
export function patientAuthEmailFromPhone(phone: string) {
  const digits = normalizeTanzanianPhoneToE164(phone).replace(/\D/g, "");
  return `patient-${digits}@auth.afya24.local`;
}
