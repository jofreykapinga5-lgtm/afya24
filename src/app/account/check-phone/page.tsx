import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getServerLocale } from "@/lib/locale-cookie";
import { t } from "@/lib/i18n";

export default async function CheckPhonePage() {
  const locale = await getServerLocale();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <MessageCircle className="size-8 text-primary" />
      <h1 className="text-xl font-semibold">{t("check_phone_title", locale)}</h1>
      <p className="text-sm text-muted-foreground">{t("check_phone_body", locale)}</p>
      <Link
        href="/account"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("check_phone_back_to_signin", locale)}
      </Link>
    </main>
  );
}
