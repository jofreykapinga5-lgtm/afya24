import "server-only";
import { cookies } from "next/headers";
import type { Locale } from "./types";
import { LOCALE_COOKIE } from "./locale-cookie.client";

// Zustand's persisted locale lives in localStorage, which Server Components
// can never read (no access to the browser at request time). This cookie is
// the parallel channel server-rendered pages use instead. LanguageToggle
// writes both on every change -- see src/components/language-toggle.tsx.
export { LOCALE_COOKIE };

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  // Swahili is Afya24's primary intake language (see PRD.md); this must match
  // the Zustand store's default in src/lib/store.ts or first-time visitors
  // get a server/client locale mismatch on every server-rendered page.
  return value === "en" ? "en" : "sw";
}
