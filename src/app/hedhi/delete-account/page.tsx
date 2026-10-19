import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { HedhiDeleteAccount } from "@/components/hedhi/hedhi-delete-account";
import { CONTACT_EMAIL } from "@/lib/hedhi-legal";
import { getServerLocale } from "@/lib/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "sw" ? "Futa akaunti ya Hedhi" : "Delete your Hedhi account",
    description:
      locale === "sw"
        ? "Futa akaunti yako ya Hedhi na taarifa zake zote kutoka kwenye seva zetu."
        : "Delete your Hedhi account and all of its data from our servers.",
  };
}

// The web page Google Play requires: a way to delete a Hedhi account without opening the app.
export default async function HedhiDeleteAccountPage() {
  const locale = await getServerLocale();
  const sw = locale === "sw";
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-14 sm:px-6">
      <div className="mb-8">
        <Breadcrumbs
          items={[
            { name: sw ? "Nyumbani" : "Home", path: "/" },
            { name: "Hedhi", path: "/hedhi" },
          ]}
          current={sw ? "Futa akaunti" : "Delete account"}
          currentPath="/hedhi/delete-account"
        />
      </div>

      <p className="text-sm font-semibold text-primary">Hedhi</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{sw ? "Futa akaunti yako ya Hedhi" : "Delete your Hedhi account"}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {sw
          ? "Hii inafuta akaunti yako na taarifa zote zilizohifadhiwa kwenye seva zetu: nakala ya shajara na tarehe za hedhi, miadi, malipo, arifa na ushirikiano wa mwenza. Haiwezi kurudishwa."
          : "This deletes your account and everything stored on our servers: your diary and period backup, appointments, payments, notifications and partner link. It cannot be undone."}
      </p>

      <div className="mt-8">
        <HedhiDeleteAccount locale={locale} />
      </div>

      <section className="mt-10 space-y-3 border-t pt-6 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">{sw ? "Njia nyingine" : "Other ways"}</h2>
        <p>
          {sw
            ? "Ndani ya programu: fungua Hedhi > Mipangilio > Akaunti > Futa akaunti."
            : "In the app: open Hedhi > Settings > Account > Delete account."}
        </p>
        <p>
          {sw ? "Au tutumie barua pepe kutoka kwenye barua pepe ya akaunti yako: " : "Or email us from your account's email address: "}
          <a className="text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}?subject=Futa akaunti ya Hedhi / Delete Hedhi account`}>
            {CONTACT_EMAIL}
          </a>
          {sw ? ". Tutaifuta ndani ya siku 7." : ". We delete it within 7 days."}
        </p>
        <p>
          {sw
            ? "Taarifa ulizohifadhi kwenye simu bila akaunti hazifiki kwenye seva zetu. Zinafutwa ukifuta programu, au kwenye Mipangilio > Akaunti > Futa data zote."
            : "Data you keep on your phone without an account never reaches our servers. It is removed when you uninstall the app, or in Settings > Account > Erase all data."}
        </p>
      </section>
    </main>
  );
}
