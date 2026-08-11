"use client";

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
import { confirmAppointmentPayment, markAppointmentPaymentFailed } from "@/app/admin/actions";
import { adminPaymentStatusKey, t, type TranslationKey } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export interface AppointmentPaymentRow {
  id: string;
  scheduledAt: string;
  status: "pending" | "paid" | "failed";
  price: number;
  currency: string;
  patientName: string;
  patientReference: string;
  providerName: string;
}

const statusTone: Record<AppointmentPaymentRow["status"], StatusTone> = {
  paid: "positive",
  pending: "pending",
  failed: "urgent",
};

export function PaymentsPanel({ locale, payments }: { locale: Locale; payments: AppointmentPaymentRow[] }) {
  return (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">{t("admin_col_patient_ref", locale)}</TableHead>
            <TableHead>{t("admin_col_provider", locale)}</TableHead>
            <TableHead>{t("admin_col_amount", locale)}</TableHead>
            <TableHead>{t("admin_col_status", locale)}</TableHead>
            <TableHead>{t("admin_col_scheduled", locale)}</TableHead>
            <TableHead className="pr-4 text-right">{t("admin_col_actions", locale)}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                {t("admin_payments_empty", locale)}
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="pl-4">
                  <div className="font-medium">{payment.patientName}</div>
                  <div className="font-mono text-xs text-muted-foreground">{payment.patientReference}</div>
                </TableCell>
                <TableCell>{payment.providerName}</TableCell>
                <TableCell className="tabular-nums">
                  {payment.currency} {payment.price}
                </TableCell>
                <TableCell>
                  <StatusPill tone={statusTone[payment.status]}>
                    {t(adminPaymentStatusKey[payment.status] as TranslationKey, locale)}
                  </StatusPill>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(payment.scheduledAt).toLocaleString(locale === "sw" ? "sw-TZ" : "en-TZ", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  {payment.status === "pending" ? (
                    <div className="flex justify-end gap-2">
                      <form action={confirmAppointmentPayment}>
                        <input type="hidden" name="appointmentId" value={payment.id} />
                        <Button type="submit" size="sm">
                          {t("admin_action_confirm", locale)}
                        </Button>
                      </form>
                      <form action={markAppointmentPaymentFailed}>
                        <input type="hidden" name="appointmentId" value={payment.id} />
                        <Button type="submit" size="sm" variant="outline">
                          {t("admin_action_mark_failed", locale)}
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
