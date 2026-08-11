"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill } from "@/components/admin/status-pill";
import { adminAuditActionKey, staffRoleKey, t, type TranslationKey } from "@/lib/i18n";
import type { AuditLogEntry, Locale } from "@/lib/types";

export function AuditPanel({ locale, entries }: { locale: Locale; entries: AuditLogEntry[] }) {
  return (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">{t("admin_col_actor", locale)}</TableHead>
            <TableHead>{t("admin_col_action", locale)}</TableHead>
            <TableHead>{t("admin_col_entity", locale)}</TableHead>
            <TableHead className="pr-4">{t("admin_col_time", locale)}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                {t("admin_no_results", locale)}
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="pl-4">
                  <div className="font-medium">{entry.actorName}</div>
                  <StatusPill tone="neutral" className="mt-1">
                    {t(staffRoleKey[entry.actorRole] as TranslationKey, locale)}
                  </StatusPill>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t(adminAuditActionKey[entry.action] as TranslationKey, locale)}
                </TableCell>
                <TableCell className="max-w-80 text-muted-foreground">
                  <span className="line-clamp-2 whitespace-normal">{entry.entityLabel}</span>
                </TableCell>
                <TableCell className="pr-4 text-muted-foreground">{entry.createdAt}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
