import type { Locale } from "./types";

// Just the cookie name, safe to import from Client Components. The
// server-only read helper lives in locale-cookie.ts.
export const LOCALE_COOKIE = "afya24_locale";

// Plain (non-component) function so the "mutate document from inside a
// component" lint rule doesn't fire on the call site in LanguageToggle.
export function setLocaleCookie(value: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
}
