import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { LegalDoc } from "@/lib/hedhi-legal";
import type { Locale } from "@/lib/types";

// One Hedhi legal page (privacy policy or terms), laid out like Afya24's own /privacy.
export function HedhiLegalDoc({ doc, locale, path }: { doc: LegalDoc; locale: Locale; path: string }) {
  const sw = locale === "sw";
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14 sm:px-6">
      <div className="mb-8">
        <Breadcrumbs
          items={[
            { name: sw ? "Nyumbani" : "Home", path: "/" },
            { name: "Hedhi", path: "/hedhi" },
          ]}
          current={doc.title}
          currentPath={path}
        />
      </div>

      <p className="text-sm font-semibold text-primary">Hedhi</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{doc.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{doc.updated}</p>
      <p className="mt-6 text-sm leading-relaxed text-foreground">{doc.intro}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
        {doc.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-semibold">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mt-2 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 text-sm">
        <Link href="/hedhi/privacy" className="text-primary hover:underline">
          {sw ? "Sera ya Faragha" : "Privacy Policy"}
        </Link>
        <Link href="/hedhi/terms" className="text-primary hover:underline">
          {sw ? "Masharti ya Matumizi" : "Terms of Use"}
        </Link>
        <Link href="/hedhi/delete-account" className="text-primary hover:underline">
          {sw ? "Futa akaunti ya Hedhi" : "Delete your Hedhi account"}
        </Link>
      </nav>
    </main>
  );
}
