"use client";

import { useMemo } from "react";
import { updateServicePrice, updateServiceStatus } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/admin/status-pill";
import { adminServiceStatusKey, t, type TranslationKey } from "@/lib/i18n";
import type { Locale, Service, ServiceCategory, ServiceStatus } from "@/lib/types";

const statusTone: Record<ServiceStatus, StatusTone> = {
  active: "positive",
  inactive: "neutral",
};

export function ServicesPanel({
  locale,
  categories,
  services,
}: {
  locale: Locale;
  categories: ServiceCategory[];
  services: Service[];
}) {
  const categoryName = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  return (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">{t("admin_col_service", locale)}</TableHead>
            <TableHead>{t("admin_col_category", locale)}</TableHead>
            <TableHead>{t("admin_col_price", locale)}</TableHead>
            <TableHead>{t("admin_col_duration", locale)}</TableHead>
            <TableHead>{t("admin_col_modes", locale)}</TableHead>
            <TableHead>{t("admin_col_status", locale)}</TableHead>
            <TableHead className="pr-4 text-right">{t("admin_col_actions", locale)}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => {
            const status = service.status ?? "active";
            return (
              <TableRow key={service.id}>
                <TableCell className="pl-4 font-medium">{service.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {categoryName.get(service.categoryId) ?? "-"}
                </TableCell>
                <TableCell>
                  <UpdatePriceForm serviceId={service.id} price={service.startingPrice} locale={locale} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {service.estimatedDuration} min
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {service.consultationModes.join(", ")}
                </TableCell>
                <TableCell>
                  <StatusPill tone={statusTone[status]}>
                    {t(adminServiceStatusKey[status] as TranslationKey, locale)}
                  </StatusPill>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <form action={updateServiceStatus}>
                    <input type="hidden" name="serviceId" value={service.id} />
                    <input type="hidden" name="status" value={status === "active" ? "inactive" : "active"} />
                    <SubmitButton size="sm" variant="outline">
                      {status === "active"
                        ? t("admin_action_deactivate", locale)
                        : t("admin_action_activate", locale)}
                    </SubmitButton>
                  </form>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function UpdatePriceForm({
  serviceId,
  price,
  locale,
}: {
  serviceId: string;
  price: number;
  locale: Locale;
}) {
  return (
    <form action={updateServicePrice} className="flex items-center gap-1.5">
      <input type="hidden" name="serviceId" value={serviceId} />
      <span className="text-xs text-muted-foreground">TZS</span>
      <input
        key={price}
        name="price"
        type="number"
        min={500}
        step={1}
        defaultValue={price}
        aria-label="Price in TZS (minimum 500, the payment gateway's floor)"
        title="Minimum TZS 500 -- the payment gateway rejects anything lower"
        className="h-7 w-20 rounded-md border border-border bg-white px-1.5 text-xs tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <SubmitButton size="sm" variant="outline" className="h-7 px-2.5 text-xs">
        {t("admin_action_save", locale)}
      </SubmitButton>
    </form>
  );
}
