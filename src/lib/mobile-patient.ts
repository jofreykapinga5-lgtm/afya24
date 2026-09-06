import "server-only";
import { toTitleCase } from "@/lib/format-name";

// The shape every mobile auth endpoint returns for the signed-in patient
// (mobile/src/api.ts's ApiPatient type mirrors this exactly). Previously
// this exact object literal was hand-copied into 6+ route files, each named
// in its own comment as "the same ApiPatient shape every other mobile auth
// endpoint already returns" -- a shape that, until this file, existed only
// as that recurring comment, not as anything a type-checker could enforce.
// One of the six had already silently drifted (a different null-fallback
// for phone) before this existed.
export type ApiPatient = {
  id: string;
  fullName: string | null;
  phone: string | null;
  gender: "female" | "male" | "other" | null;
  age: number | null;
  location: string | null;
  createdAt: string | null;
};

// For the endpoints that read a full patients row (me, verify-otp, claim,
// google/session) -- title-cases full_name for display the same way every
// one of them already did, maps address -> location and gender to its
// three known values (or null), and tolerates a partial/missing row so a
// caller can pass through whatever it actually selected.
export function toApiPatient(row: {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  gender?: string | null;
  age?: number | null;
  address?: string | null;
  created_at?: string | null;
}): ApiPatient {
  const gender = row.gender === "female" || row.gender === "male" || row.gender === "other" ? row.gender : null;
  return {
    id: row.id,
    fullName: row.full_name ? toTitleCase(row.full_name) : null,
    phone: row.phone ?? null,
    gender,
    age: row.age ?? null,
    location: row.address ?? null,
    createdAt: row.created_at ?? null,
  };
}
