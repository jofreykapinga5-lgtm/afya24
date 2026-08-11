import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// A 4-6 digit PIN has at most a million possible values, so a fast unsalted
// hash (like the sha256 used elsewhere for lookup audit hashes) would be
// trivially reversible via a precomputed table. scrypt is deliberately slow
// and salted per-patient to make that infeasible -- this still relies on
// rate-limiting (see lookupPatient) to be meaningfully secure, since the
// keyspace itself stays small.
const KEY_LENGTH = 64;

export function isValidPin(pin: string) {
  return /^\d{4,6}$/.test(pin);
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(pin, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
