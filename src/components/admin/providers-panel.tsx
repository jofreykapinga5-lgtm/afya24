"use client";

import { useActionState, useMemo, useState } from "react";
import {
  CalendarClock,
  Clock3,
  Eye,
  Lock,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  type AdminActionState,
  createProviderAccount,
  deleteProviderAccount,
  resetProviderPassword,
  updateProviderAvailabilityByAdmin,
  updateProviderStatus,
} from "@/app/admin/actions";
import { adminProviderStatusKey, locales, t, type TranslationKey } from "@/lib/i18n";
import type {
  AdminProviderMeta,
  Appointment,
  Locale,
  Provider,
  ProviderStatus,
} from "@/lib/types";

const statusTone: Record<ProviderStatus, StatusTone> = {
  active: "positive",
  pending: "pending",
  suspended: "urgent",
};

const localeLabel: Record<Locale, string> = Object.fromEntries(
  locales.map((entry) => [entry.value, entry.label])
) as Record<Locale, string>;

const initialCreateProviderState: AdminActionState = {
  status: "idle",
  message: "",
};

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function ProvidersPanel({
  locale,
  providers,
  meta,
  appointments,
  onStatusChange,
}: {
  locale: Locale;
  providers: Provider[];
  meta: AdminProviderMeta[];
  appointments: Appointment[];
  onStatusChange: (providerId: string, providerName: string, next: ProviderStatus) => void;
}) {
  const [query, setQuery] = useState("");
  const [createState, createAction, createPending] = useActionState(
    createProviderAccount,
    initialCreateProviderState
  );
  const [deletedProviderIds, setDeletedProviderIds] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Record<string, { availableNow: boolean; note: string }>>(
    () =>
      Object.fromEntries(
        providers.map((provider) => [
          provider.id,
          {
            availableNow: provider.isAvailableNow,
            note: provider.nextAvailableAt,
          },
        ])
      )
  );

  const rows = useMemo(() => {
    const metaById = new Map(meta.map((m) => [m.providerId, m]));
    return providers
      .filter((provider) => !deletedProviderIds.includes(provider.id))
      .map((provider) => ({ provider, meta: metaById.get(provider.id) }))
      .filter(({ meta }) => meta !== undefined) as { provider: Provider; meta: AdminProviderMeta }[];
  }, [deletedProviderIds, providers, meta]);

  const filtered = rows.filter(({ provider }) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      provider.name.toLowerCase().includes(needle) ||
      provider.specialty.toLowerCase().includes(needle) ||
      provider.credentials.toLowerCase().includes(needle)
    );
  });

  const providerStats = useMemo(() => {
    const active = rows.filter(({ meta }) => meta.status === "active").length;
    const disabled = rows.filter(({ meta }) => meta.status === "suspended").length;
    const pending = rows.filter(({ meta }) => meta.status === "pending").length;
    const sessions = appointments.length;
    return { active, disabled, pending, sessions };
  }, [appointments.length, rows]);

  function providerSessionCount(providerId: string) {
    return appointments.filter((appointment) => appointment.providerId === providerId).length;
  }

  function deleteLocalProvider(providerId: string) {
    setDeletedProviderIds((current) => [...current, providerId]);
  }

  function updateAvailability(providerId: string, patch: Partial<{ availableNow: boolean; note: string }>) {
    setAvailability((current) => ({
      ...current,
      [providerId]: {
        availableNow: current[providerId]?.availableNow ?? false,
        note: current[providerId]?.note ?? "Set availability",
        ...patch,
      },
    }));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-5">
        <ProviderStat icon={Users} label="Active doctors" value={providerStats.active} />
        <ProviderStat icon={Clock3} label="Pending approval" value={providerStats.pending} tone="pending" />
        <ProviderStat icon={Lock} label="Disabled" value={providerStats.disabled} tone="urgent" />
        <ProviderStat icon={CalendarClock} label="Sessions" value={providerStats.sessions} />
      </div>

      <div className="flex flex-col gap-3 rounded-[1.1rem] bg-white p-3 ring-1 ring-[#dfe8eb] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("admin_search_providers_placeholder", locale)}
            className="pl-8"
          />
        </div>
        <Dialog>
          <DialogTrigger render={<Button className="h-9 rounded-lg bg-[#01b7bb] text-white hover:bg-[#019ea2]" />}>
            <UserPlus className="size-4" />
            Add doctor
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create doctor account</DialogTitle>
              <DialogDescription>
                Admin creates provider access. The doctor signs in with the email and temporary password you set here.
              </DialogDescription>
            </DialogHeader>
            <form action={createAction} className="grid gap-4">
              {createState.status !== "idle" ? (
                <div
                  className={`rounded-xl px-3 py-2 text-sm ${
                    createState.status === "success"
                      ? "bg-[#e8f7f4] text-[#087a7b] ring-1 ring-[#b7ebe6]"
                      : "bg-[#fff4f0] text-[#9b2c12] ring-1 ring-[#ffd4c6]"
                  }`}
                >
                  {createState.message}
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name">
                  <Input name="fullName" placeholder="Dr. Jane Mwangi" required />
                </Field>
                <Field label="Specialty">
                  <Input name="specialty" placeholder="General Practice" required />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email">
                  <Input name="email" type="email" placeholder="doctor@afya24.com" required />
                </Field>
                <Field label="Temporary password">
                  <Input name="password" type="password" minLength={8} required />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Phone">
                  <Input name="phone" placeholder="+255..." />
                </Field>
                <Field label="License number">
                  <Input name="licenseNumber" placeholder="KMPDC-00000" required />
                </Field>
              </div>
              <Field label="Credentials">
                <Input name="credentials" placeholder="MBChB, KMPDC" />
              </Field>
              <Field label="Bio">
                <Textarea name="bio" placeholder="Short provider bio for profile review." />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <fieldset className="rounded-lg border border-border p-3">
                  <legend className="px-1 text-sm font-medium">Languages</legend>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <Checkbox name="languages" value="sw" label="Swahili" defaultChecked />
                    <Checkbox name="languages" value="en" label="English" defaultChecked />
                  </div>
                </fieldset>
                <fieldset className="rounded-lg border border-border p-3">
                  <legend className="px-1 text-sm font-medium">Consultation modes</legend>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <Checkbox name="consultationModes" value="voice" label="Voice" defaultChecked />
                    <Checkbox name="consultationModes" value="video" label="Video" defaultChecked />
                  </div>
                </fieldset>
              </div>
              <Button type="submit" className="h-10 justify-self-start rounded-lg" disabled={createPending}>
                <UserPlus className="size-4" />
                {createPending ? "Creating..." : "Create pending doctor"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{t("admin_col_provider", locale)}</TableHead>
              <TableHead>{t("admin_col_specialty", locale)}</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>{t("admin_col_status", locale)}</TableHead>
              <TableHead className="pr-4 text-right">{t("admin_col_actions", locale)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  {t("admin_no_results", locale)}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(({ provider, meta }) => {
                const currentAvailability = availability[provider.id] ?? {
                  availableNow: provider.isAvailableNow,
                  note: provider.nextAvailableAt,
                };
                const nextAvailableNow = !currentAvailability.availableNow;
                const sessionCount = providerSessionCount(provider.id);
                const canDelete = sessionCount === 0;

                return (
                  <TableRow key={provider.id} className="align-top">
                    <TableCell className="min-w-64 pl-4">
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-3">
                          <DoctorAvatar name={provider.name} />
                          <span className="min-w-0">
                            <span className="block font-semibold text-[#071923]">{provider.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {provider.credentials} / {meta.licenseNumber}
                            </span>
                          </span>
                          <Eye className="ml-auto size-4 text-muted-foreground transition-colors group-open:text-primary" />
                        </summary>

                        <div className="mt-4 grid gap-3 rounded-xl bg-[#f8fbfd] p-3 ring-1 ring-[#dfe8eb]">
                          <DoctorDetail label="Languages">
                            {provider.languages.map((code) => localeLabel[code]).join(", ")}
                          </DoctorDetail>
                          <DoctorDetail label="Modes">{provider.consultationModes.join(", ")}</DoctorDetail>
                          <DoctorDetail label="Bio">{provider.bio}</DoctorDetail>
                          <DoctorDetail label="Availability note">
                            <Input
                              value={currentAvailability.note}
                              onChange={(event) =>
                                updateAvailability(provider.id, { note: event.target.value })
                              }
                            />
                          </DoctorDetail>
                          <DoctorSessions
                            appointments={appointments.filter((appointment) => appointment.providerId === provider.id)}
                          />
                        </div>
                      </details>
                    </TableCell>
                    <TableCell className="min-w-40 text-muted-foreground">{provider.specialty}</TableCell>
                    <TableCell className="min-w-48">
                      <div className="grid gap-2">
                        <StatusPill tone={currentAvailability.availableNow ? "positive" : "neutral"}>
                          {currentAvailability.availableNow ? "Available now" : "Not available"}
                        </StatusPill>
                        <p className="max-w-44 truncate text-xs text-muted-foreground">
                          {currentAvailability.note}
                        </p>
                        <form action={updateProviderAvailabilityByAdmin} className="grid gap-2">
                          <input type="hidden" name="providerId" value={provider.id} />
                          <input type="hidden" name="availabilityNote" value={currentAvailability.note} />
                          {provider.consultationModes.map((mode) => (
                            <input key={mode} type="hidden" name="consultationModes" value={mode} />
                          ))}
                          {nextAvailableNow ? (
                            <input type="hidden" name="availableNow" value="on" />
                          ) : null}
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateAvailability(provider.id, {
                                availableNow: nextAvailableNow,
                              })
                            }
                            aria-label={
                              currentAvailability.availableNow
                                ? `${provider.name} is already online. Set offline.`
                                : `Set ${provider.name} online.`
                            }
                          >
                            {currentAvailability.availableNow ? "Already online - set offline" : "Set online"}
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <div className="grid gap-1">
                        <span className="font-semibold">{sessionCount}</span>
                        <span className="text-xs text-muted-foreground">
                          {meta.appointmentsThisWeek} this week
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={statusTone[meta.status]}>
                        {t(adminProviderStatusKey[meta.status] as TranslationKey, locale)}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1.5">
                        {isUuid(provider.id) ? (
                          <ProviderStatusForm providerId={provider.id} status={meta.status} />
                        ) : meta.status === "suspended" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStatusChange(provider.id, provider.name, "active")}
                          >
                            Enable
                          </Button>
                        ) : meta.status === "pending" ? (
                          <Button
                            size="sm"
                            onClick={() => onStatusChange(provider.id, provider.name, "active")}
                          >
                            Enable
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onStatusChange(provider.id, provider.name, "suspended")}
                          >
                            Disable
                          </Button>
                        )}

                        {isUuid(provider.id) ? (
                          <form action={deleteProviderAccount}>
                            <input type="hidden" name="providerId" value={provider.id} />
                            <Button
                              type="submit"
                              size="icon-sm"
                              variant="destructive"
                              disabled={!canDelete}
                              aria-label={
                                canDelete ? "Delete doctor" : "Doctor has sessions. Disable instead."
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </form>
                        ) : (
                          <Button
                            size="icon-sm"
                            variant="destructive"
                            disabled={!canDelete}
                            onClick={() => deleteLocalProvider(provider.id)}
                            aria-label={canDelete ? "Delete doctor" : "Doctor has sessions. Disable instead."}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>

                      {isUuid(provider.id) ? (
                        <details className="mt-2 text-left">
                          <summary className="cursor-pointer list-none text-xs font-medium text-primary hover:underline">
                            Reset access
                          </summary>
                          <form action={resetProviderPassword} className="mt-2 flex w-48 gap-2">
                            <input type="hidden" name="providerId" value={provider.id} />
                            <Input
                              name="password"
                              type="password"
                              minLength={8}
                              placeholder="New password"
                              className="h-7"
                              required
                            />
                            <Button type="submit" size="sm" variant="outline">
                              Save
                            </Button>
                          </form>
                        </details>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function ProviderStatusForm({
  providerId,
  status,
}: {
  providerId: string;
  status: ProviderStatus;
}) {
  const nextStatus = status === "active" ? "suspended" : "active";
  const label = status === "active" ? "Disable" : "Enable";
  const variant = status === "active" ? "destructive" : "default";

  return (
    <form action={updateProviderStatus}>
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="status" value={nextStatus} />
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
}

function ProviderStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "pending" | "urgent" | "positive";
}) {
  const toneClass =
    tone === "pending"
      ? "text-[#9a6500]"
      : tone === "urgent"
        ? "text-destructive"
        : tone === "positive"
          ? "text-[#087a7b]"
          : "text-[#083273]";

  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-[#dfe8eb]">
      <div className="flex items-center justify-between gap-2">
        <p className={`text-lg font-bold tabular-nums ${toneClass}`}>{value}</p>
        <span className="flex size-8 items-center justify-center rounded-xl bg-[#e8f7f4] text-[#087a7b]">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DoctorAvatar({ name }: { name: string }) {
  const initials = name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f7f4] text-sm font-bold text-[#087a7b] ring-1 ring-[#dfe8eb]">
      {initials}
    </span>
  );
}

function DoctorDetail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 text-xs">
      <span className="font-semibold uppercase tracking-[0.12em] text-[#6b7a82]">{label}</span>
      <div className="text-sm leading-5 text-[#071923]">{children}</div>
    </div>
  );
}

function DoctorSessions({ appointments }: { appointments: Appointment[] }) {
  const recent = appointments.slice(0, 3);

  return (
    <div className="grid gap-2 text-xs">
      <span className="font-semibold uppercase tracking-[0.12em] text-[#6b7a82]">Sessions</span>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions yet.</p>
      ) : (
        <div className="grid gap-1.5">
          {recent.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-[#dfe8eb]"
            >
              <span className="font-mono text-[11px]">{appointment.patientReference}</span>
              <span className="text-muted-foreground">{appointment.scheduledAt}</span>
              <StatusPill
                tone={
                  appointment.status === "completed"
                    ? "positive"
                    : appointment.status === "cancelled"
                      ? "neutral"
                      : appointment.status === "waiting"
                        ? "pending"
                        : "info"
                }
              >
                {appointment.status}
              </StatusPill>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function Checkbox({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <input
        className="size-4 rounded border-border accent-primary"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
        value={value}
      />
      {label}
    </label>
  );
}
