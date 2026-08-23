import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { SiteHeader } from "@/components/site-header";
import { CookieConsent } from "@/components/cookie-consent";
import { getServerLocale } from "@/lib/locale-cookie";
import { createClient } from "@/lib/supabase/server";
import { organizationJsonLd } from "@/lib/structured-data";
import { t } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Falls back to localhost in dev; APP_BASE_URL is the same env var the
// Snippe webhook URL is built from (see consultation/actions.ts), so
// there's one source of truth for "what is our real production URL."
const siteUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const title = t("site_title", locale);
  const description = t("site_description", locale);
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: "Afya24",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
      locale: locale === "sw" ? "sw_TZ" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getServerLocale();

  // Header needs to know whether to show "Log in" or the account menu.
  // Only patients get an account menu here -- doctors/admins have their own
  // dashboards and a Supabase session from browsing there shouldn't make the
  // public marketing header look like a patient is signed in (see the
  // "navbar must stay patient-first" rule).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const patientName =
    user?.user_metadata?.role === "patient" && typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <QueryProvider>
          <SiteHeader patientName={patientName} />
          {children}
          <CookieConsent />
        </QueryProvider>
      </body>
    </html>
  );
}
