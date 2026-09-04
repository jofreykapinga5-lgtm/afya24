import { ShieldAlert } from "lucide-react";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";
import { getPatientDashboardContext } from "../patient-context";
import { DeleteAccountForm } from "./delete-account-form";

export default async function AccountDashboardSettingsPage() {
  const locale = await getServerLocale();
  await getPatientDashboardContext();

  return (
    <section className="mx-auto grid max-w-2xl gap-5">
      <div className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
        <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_settings_title", locale)}</p>
        <p className="mt-1 text-sm text-[#64747c]">{t("account_dashboard_settings_body", locale)}</p>
      </div>

      <div className="rounded-[1.35rem] bg-[#fef6f5] p-5 ring-1 ring-[#f3d9d6]">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="size-5 shrink-0 text-[#c94a3a]" />
          <p className="text-sm font-bold text-[#7a2a20]">{t("account_dashboard_danger_zone_title", locale)}</p>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#7a4038]">
          {t("account_dashboard_danger_zone_body", locale)}
        </p>
        <DeleteAccountForm locale={locale} />
      </div>
    </section>
  );
}
