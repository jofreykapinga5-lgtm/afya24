import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { SiteHeader } from "@/components/site-header";
import { CookieConsent } from "@/components/cookie-consent";
import { getServerLocale } from "@/lib/locale-cookie";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("site_title", locale),
    description: t("site_description", locale),
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
        <QueryProvider>
          <SiteHeader patientName={patientName} />
          {children}
          <CookieConsent />
        </QueryProvider>
      </body>
    </html>
  );
}
