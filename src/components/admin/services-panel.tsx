"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
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
  onToggleStatus,
}: {
  locale: Locale;
  categories: ServiceCategory[];
  services: Service[];
  onToggleStatus: (serviceId: string, serviceName: string, next: ServiceStatus) => void;
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
                <TableCell className="tabular-nums">TZS {service.startingPrice}</TableCell>
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onToggleStatus(
                        service.id,
                        service.name,
                        status === "active" ? "inactive" : "active"
                      )
                    }
                  >
                    {status === "active"
                      ? t("admin_action_deactivate", locale)
                      : t("admin_action_activate", locale)}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
