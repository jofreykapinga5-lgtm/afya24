import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, adminLabOrderStatusKey } from "@/lib/i18n";
import { getPatientDashboardContext } from "../patient-context";
import { attachmentIcon, fileKindKey, statusClass } from "../dashboard-utils";

type DbLabOrder = {
  id: string;
  status: string;
  reason: string | null;
  map_url: string | null;
  lab_locations: { name: string } | null;
};

type DbFile = {
  id: string;
  original_filename: string | null;
  attachment_kind: string | null;
  storage_path: string;
  created_at: string;
};

export default async function AccountDashboardFilesPage() {
  const locale = await getServerLocale();
  const { patient, supabase } = await getPatientDashboardContext();

  const [{ data: labOrdersData }, { data: attachmentFiles }] = await Promise.all([
    patient
      ? supabase
          .from("lab_orders")
          .select("id, status, reason, map_url, lab_locations(name)")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false })
          .limit(10)
          .returns<DbLabOrder[]>()
      : Promise.resolve({ data: [] as DbLabOrder[] }),
    patient
      ? supabase
          .from("files")
          .select("id, original_filename, attachment_kind, storage_path, created_at")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false })
          .limit(20)
          .returns<DbFile[]>()
      : Promise.resolve({ data: [] as DbFile[] }),
  ]);

  const signedUrlByPath = new Map<string, string>();
  if (attachmentFiles && attachmentFiles.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("patient-attachments")
      .createSignedUrls(
        attachmentFiles.map((file) => file.storage_path),
        600
      );
    signedUrls?.forEach((entry) => {
      if (entry.signedUrl) signedUrlByPath.set(entry.path ?? "", entry.signedUrl);
    });
  }

  return (
    <section className="mx-auto max-w-2xl rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#071923]">{t("account_dashboard_labs_files_title", locale)}</p>
        <FlaskConical className="size-5 text-[#01b7bb]" />
      </div>
      <div className="mt-4 grid gap-2">
        {labOrdersData && labOrdersData.length > 0 ? (
          labOrdersData.map((order) => (
            <div key={order.id} className="rounded-2xl bg-[#f8fbfd] p-3">
              <p className="text-sm font-semibold text-[#071923]">
                {order.reason ?? t("account_dashboard_lab_order_fallback", locale)}
              </p>
              <p className="mt-1 text-xs text-[#64747c]">
                {order.lab_locations?.name ?? t("account_dashboard_partner_lab_fallback", locale)}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(order.status)}`}>
                  {t(
                    adminLabOrderStatusKey[order.status as keyof typeof adminLabOrderStatusKey] ??
                      adminLabOrderStatusKey.ordered,
                    locale
                  )}
                </span>
                {order.map_url ? (
                  <Link href={order.map_url} className="text-xs font-bold text-[#083273]">
                    {t("account_dashboard_open_map", locale)}
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#64747c]">{t("account_dashboard_no_lab_orders", locale)}</p>
        )}
      </div>
      <div className="mt-5 grid gap-2 border-t border-[#e1e9ec] pt-4">
        {attachmentFiles && attachmentFiles.length > 0 ? (
          attachmentFiles.map((file) => {
            const Icon = attachmentIcon(file.attachment_kind);
            const url = signedUrlByPath.get(file.storage_path);
            return (
              <a
                key={file.id}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 rounded-xl bg-[#f8fbfd] px-3 py-2 text-sm hover:bg-[#eef4f5]"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium text-[#071923]">
                  <Icon className="size-4 shrink-0 text-[#64747c]" />
                  <span className="truncate">{file.original_filename ?? t("account_dashboard_file_fallback", locale)}</span>
                </span>
                <span className="shrink-0 text-xs text-[#64747c]">
                  {t(
                    fileKindKey[file.attachment_kind as keyof typeof fileKindKey] ??
                      "account_dashboard_file_kind_document",
                    locale
                  )}
                </span>
              </a>
            );
          })
        ) : (
          <p className="px-1 text-sm text-[#64747c]">{t("account_dashboard_no_files_uploaded", locale)}</p>
        )}
      </div>
    </section>
  );
}
