// A `redirectTo` value here can come straight from a URL query param (a
// link someone shares), not just a same-origin form field -- accepting it
// unchecked would be an open-redirect vector (e.g. /account?redirectTo=
// https://evil.example/phish). Only a path that starts with a single "/"
// (never "//", which browsers treat as protocol-relative to another host)
// is safe to hand to next/navigation's redirect().
export function safeRedirectPath(value: string | undefined | null, fallback: string): string {
  const trimmed = (value ?? "").trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  return fallback;
}
