import type { Metadata } from "next";
import Link from "next/link";
import { getServerLocale } from "@/lib/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: "Hedhi",
    description:
      locale === "sw"
        ? "Hedhi: programu ya kufuatilia hedhi kwa Kiswahili, kutoka Afya24."
        : "Hedhi: a Swahili-first period tracker app from Afya24.",
  };
}

// A small home for the Hedhi app on afya24.com: what it is, and its legal pages.
export default async function HedhiPage() {
  const locale = await getServerLocale();
  const sw = locale === "sw";
  const links = [
    { href: "/hedhi/privacy", label: sw ? "Sera ya Faragha" : "Privacy Policy" },
    { href: "/hedhi/terms", label: sw ? "Masharti ya Matumizi" : "Terms of Use" },
    { href: "/hedhi/delete-account", label: sw ? "Futa akaunti ya Hedhi" : "Delete your Hedhi account" },
  ];
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold text-primary">Afya24</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Hedhi</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        {sw
          ? "Hedhi ni programu ya kufuatilia hedhi kwa Kiswahili: tabiri hedhi inayofuata na siku za rutuba, andika shajara ya hisia na dalili, weka vikumbusho, na zungumza na daktari. Taarifa zako ni zako na zinalindwa."
          : "Hedhi is a Swahili-first period tracker: predict your next period and fertile days, keep a diary of moods and symptoms, set reminders, and talk to a doctor. Your information is yours and is kept private."}
      </p>
      <ul className="mt-8 divide-y rounded-2xl border bg-card">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex items-center justify-between px-5 py-4 text-sm font-medium hover:bg-muted">
              {l.label}
              <span aria-hidden>→</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
