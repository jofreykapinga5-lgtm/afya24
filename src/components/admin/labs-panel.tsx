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
import {
  adminLabLocationStatusKey,
  adminLabOrderStatusKey,
  adminWhatsappStatusKey,
  t,
  type TranslationKey,
} from "@/lib/i18n";
import type {
  LabLocation,
  LabLocationStatus,
  LabOrder,
  LabOrderStatus,
  Locale,
  WhatsappDeliveryStatus,
} from "@/lib/types";

const orderTone: Record<LabOrderStatus, StatusTone> = {
  ordered: "neutral",
  instructions_sent: "info",
  sample_collected: "info",
  results_pending: "pending",
  results_ready: "positive",
};

const whatsappTone: Record<WhatsappDeliveryStatus, StatusTone> = {
  not_sent: "neutral",
  sent: "info",
  delivered: "positive",
  failed: "urgent",
};

const locationTone: Record<LabLocationStatus, StatusTone> = {
  active: "positive",
  inactive: "neutral",
};

export function LabsPanel({
  locale,
  labOrders,
  labLocations,
  onToggleLocation,
}: {
  locale: Locale;
  labOrders: LabOrder[];
  labLocations: LabLocation[];
  onToggleLocation: (locationId: string, name: string, next: LabLocationStatus) => void;
}) {
  const locationName = useMemo(
    () => new Map(labLocations.map((location) => [location.id, location.name])),
    [labLocations]
  );

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold">{t("admin_lab_orders_title", locale)}</h3>
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("admin_col_tests", locale)}</TableHead>
                <TableHead>{t("admin_col_location", locale)}</TableHead>
                <TableHead>{t("admin_col_status", locale)}</TableHead>
                <TableHead className="pr-4">{t("admin_col_whatsapp", locale)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="max-w-64 pl-4">
                    <span className="line-clamp-1">{order.tests.join(", ")}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {locationName.get(order.labLocationId) ?? "-"}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={orderTone[order.status]}>
                      {t(adminLabOrderStatusKey[order.status] as TranslationKey, locale)}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="pr-4">
                    <StatusPill tone={whatsappTone[order.whatsappDeliveryStatus]}>
                      {t(adminWhatsappStatusKey[order.whatsappDeliveryStatus] as TranslationKey, locale)}
                    </StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">{t("admin_lab_locations_title", locale)}</h3>
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("admin_col_location", locale)}</TableHead>
                <TableHead>{t("admin_col_address", locale)}</TableHead>
                <TableHead>{t("admin_col_region", locale)}</TableHead>
                <TableHead>{t("admin_col_hours", locale)}</TableHead>
                <TableHead>{t("admin_col_status", locale)}</TableHead>
                <TableHead className="pr-4 text-right">{t("admin_col_actions", locale)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="pl-4 font-medium">{location.name}</TableCell>
                  <TableCell className="text-muted-foreground">{location.address}</TableCell>
                  <TableCell className="text-muted-foreground">{location.region}</TableCell>
                  <TableCell className="text-muted-foreground">{location.openingHours}</TableCell>
                  <TableCell>
                    <StatusPill tone={locationTone[location.status]}>
                      {t(adminLabLocationStatusKey[location.status] as TranslationKey, locale)}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onToggleLocation(
                          location.id,
                          location.name,
                          location.status === "active" ? "inactive" : "active"
                        )
                      }
                    >
                      {location.status === "active"
                        ? t("admin_action_deactivate", locale)
                        : t("admin_action_activate", locale)}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
