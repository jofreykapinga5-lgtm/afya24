import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";

export default async function AccountDashboardBookACallPage() {
  const locale = await getServerLocale();

  return (
    <section className="mx-auto max-w-md rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_nav_book", locale)}</p>
          <p className="mt-1 text-sm text-[#64747c]">{t("account_dashboard_find_doctor_fast_body", locale)}</p>
        </div>
        <Search className="size-5 text-[#01b7bb]" />
      </div>
      <div className="mt-4 grid gap-2">
        <Button
          className="h-11 rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2]"
          nativeButton={false}
          render={<Link href="/qualification" />}
        >
          {t("start_assessment_cta", locale)}
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-full bg-white font-bold text-[#083273]"
          nativeButton={false}
          render={<Link href="/doctors" />}
        >
          {t("account_dashboard_browse_doctors", locale)}
        </Button>
      </div>
    </section>
  );
}
