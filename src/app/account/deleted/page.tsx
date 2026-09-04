import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";

export default async function AccountDeletedPage() {
  const locale = await getServerLocale();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <CheckCircle2 className="size-8 text-primary" />
      <h1 className="text-xl font-semibold">{t("account_deleted_title", locale)}</h1>
      <p className="text-sm text-muted-foreground">{t("account_deleted_body", locale)}</p>
      <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        {t("account_deleted_back_home", locale)}
      </Link>
    </main>
  );
}
