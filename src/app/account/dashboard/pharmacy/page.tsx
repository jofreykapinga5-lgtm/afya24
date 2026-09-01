import Link from "next/link";
import { ArrowRight, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, pharmacyOrderStatusKey } from "@/lib/i18n";
import { getPatientDashboardContext } from "../patient-context";
import { formatDateTime, fulfillmentMethodKey, statusClass } from "../dashboard-utils";

type DbPharmacyOrder = {
  id: string;
  status: string;
  fulfillment_method: string;
  total_amount: number | string;
  created_at: string;
};

export default async function AccountDashboardPharmacyPage() {
  const locale = await getServerLocale();
  const { patient, supabase } = await getPatientDashboardContext();

  const { data: pharmacyOrdersData } = patient
    ? await supabase
        .from("pharmacy_orders")
        .select("id, status, fulfillment_method, total_amount, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<DbPharmacyOrder[]>()
    : { data: [] as DbPharmacyOrder[] };

  return (
    <section className="mx-auto max-w-2xl rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_pharmacy_title", locale)}</p>
          <p className="mt-1 text-sm text-[#64747c]">{t("account_dashboard_pharmacy_body", locale)}</p>
        </div>
        <Button className="h-10 rounded-full bg-[#01b7bb] px-4 font-bold text-white hover:bg-[#019ea2]" nativeButton={false} render={<Link href="/pharmacy" />}>
          <Pill className="size-4" />
          {t("account_dashboard_browse_pharmacy", locale)}
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="mt-5 grid gap-3">
        {pharmacyOrdersData && pharmacyOrdersData.length > 0 ? (
          pharmacyOrdersData.map((order) => (
            <div key={order.id} className="rounded-2xl bg-[#f8fbfd] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#071923]">
                    TZS {order.total_amount} ·{" "}
                    {t(
                      fulfillmentMethodKey[order.fulfillment_method as keyof typeof fulfillmentMethodKey] ??
                        "checkout_delivery",
                      locale
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[#64747c]">{formatDateTime(order.created_at, locale)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(order.status)}`}>
                  {t(
                    pharmacyOrderStatusKey[order.status as keyof typeof pharmacyOrderStatusKey] ??
                      pharmacyOrderStatusKey.pending,
                    locale
                  )}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#64747c]">{t("account_dashboard_no_pharmacy_orders", locale)}</p>
        )}
      </div>
    </section>
  );
}
