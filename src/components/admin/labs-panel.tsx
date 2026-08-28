"use client";

import { useMemo, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { createLabLocation, updateLabLocationStatus } from "@/app/admin/actions";
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
}: {
  locale: Locale;
  labOrders: LabOrder[];
  labLocations: LabLocation[];
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
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold">{t("admin_lab_locations_title", locale)}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add partner labs with Google Maps latitude and longitude. Patients are matched by live browser location.
            </p>
          </div>
        </div>

        <form
          action={createLabLocation}
          className="mb-4 grid gap-3 rounded-xl bg-[#f8fbfd] p-3 ring-1 ring-[#dfe8eb] lg:grid-cols-[1fr_1fr_0.7fr_0.75fr_0.75fr_auto] lg:items-end"
        >
          <LabField label="Lab name">
            <Input name="name" placeholder="Mbeya Medical Lab" required />
          </LabField>
          <LabField label="Address">
            <Input name="address" placeholder="Street, town" required />
          </LabField>
          <LabField label="Region">
            <Input name="region" placeholder="Mbeya" />
          </LabField>
          <LabField label="Latitude">
            <Input name="latitude" type="number" step="any" placeholder="-8.9000" required />
          </LabField>
          <LabField label="Longitude">
            <Input name="longitude" type="number" step="any" placeholder="33.4500" required />
          </LabField>
          <SubmitButton className="h-8 rounded-lg bg-[#01b7bb] text-white hover:bg-[#019ea2]">
            Add lab
          </SubmitButton>
          <div className="grid gap-3 lg:col-span-6 lg:grid-cols-2">
            <LabField label="Phone">
              <Input name="phone" placeholder="+255..." />
            </LabField>
            <LabField label="Opening hours">
              <Input name="openingHours" placeholder="Mon-Sat, 7:00 AM - 7:00 PM" />
            </LabField>
          </div>
        </form>

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
                    <form action={updateLabLocationStatus}>
                      <input type="hidden" name="locationId" value={location.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={location.status === "active" ? "inactive" : "active"}
                      />
                      <SubmitButton size="sm" variant="outline">
                        {location.status === "active"
                          ? t("admin_action_deactivate", locale)
                          : t("admin_action_activate", locale)}
                      </SubmitButton>
                    </form>
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

function LabField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-[#071923]">
      {label}
      {children}
    </label>
  );
}
