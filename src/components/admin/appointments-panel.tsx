"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill, type StatusTone } from "@/components/admin/status-pill";
import { appointmentStatusKey, t, type TranslationKey } from "@/lib/i18n";
import type {
  Appointment,
  AppointmentStatus,
  Locale,
  PaymentStatus,
  Provider,
  Service,
} from "@/lib/types";

const appointmentTone: Record<AppointmentStatus, StatusTone> = {
  scheduled: "info",
  waiting: "pending",
  in_progress: "info",
  completed: "positive",
  cancelled: "neutral",
};

const paymentTone: Record<PaymentStatus, StatusTone> = {
  paid: "positive",
  pending: "pending",
  failed: "urgent",
};

const paymentLabelKey: Record<PaymentStatus, TranslationKey> = {
  paid: "admin_payment_status_paid",
  pending: "admin_payment_status_pending",
  failed: "admin_payment_status_failed",
};

export function AppointmentsPanel({
  locale,
  appointments,
  providers,
  services,
}: {
  locale: Locale;
  appointments: Appointment[];
  providers: Provider[];
  services: Service[];
}) {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const providerName = useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider.name])),
    [providers]
  );
  const serviceName = useMemo(
    () => new Map(services.map((service) => [service.id, service.name])),
    [services]
  );

  const filtered = appointments.filter((appointment) => {
    if (statusFilter !== "all" && appointment.status !== statusFilter) return false;
    if (providerFilter !== "all" && appointment.providerId !== providerFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as AppointmentStatus | "all")}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("admin_filter_all_statuses", locale)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin_filter_all_statuses", locale)}</SelectItem>
            {(Object.keys(appointmentStatusKey) as AppointmentStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {t(appointmentStatusKey[status], locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={providerFilter}
          onValueChange={(value) => setProviderFilter(value ?? "all")}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("admin_filter_all_providers", locale)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin_filter_all_providers", locale)}</SelectItem>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{t("admin_col_patient_ref", locale)}</TableHead>
              <TableHead>{t("admin_col_provider", locale)}</TableHead>
              <TableHead>{t("admin_col_service", locale)}</TableHead>
              <TableHead>{t("admin_col_scheduled", locale)}</TableHead>
              <TableHead>{t("admin_col_mode", locale)}</TableHead>
              <TableHead>{t("admin_col_status", locale)}</TableHead>
              <TableHead className="pr-4">{t("admin_col_payment", locale)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {t("admin_no_results", locale)}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="pl-4 font-mono text-xs">
                    {appointment.patientReference}
                  </TableCell>
                  <TableCell>{providerName.get(appointment.providerId) ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {serviceName.get(appointment.serviceId) ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{appointment.scheduledAt}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {appointment.consultationMode}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={appointmentTone[appointment.status]}>
                      {t(appointmentStatusKey[appointment.status], locale)}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="pr-4">
                    <StatusPill tone={paymentTone[appointment.paymentStatus]}>
                      {t(paymentLabelKey[appointment.paymentStatus], locale)}
                    </StatusPill>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
