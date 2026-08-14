"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FlaskConical,
  Pill,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StatusPill } from "@/components/admin/status-pill";
import { isUuid, ProviderStatusForm, ProvidersPanel } from "@/components/admin/providers-panel";
import { ServicesPanel } from "@/components/admin/services-panel";
import { AppointmentsPanel } from "@/components/admin/appointments-panel";
import { PaymentsPanel, type AppointmentPaymentRow } from "@/components/admin/payments-panel";
import { PharmacyPanel } from "@/components/admin/pharmacy-panel";
import { LabsPanel } from "@/components/admin/labs-panel";
import { ApplicationsPanel, type ProviderApplicationRow } from "@/components/admin/applications-panel";
import { AuditPanel } from "@/components/admin/audit-panel";
import { adminAuditActionKey, appointmentStatusKey, t, type TranslationKey } from "@/lib/i18n";
import type {
  AdminProviderMeta,
  Appointment,
  AuditActionType,
  AuditLogEntry,
  LabLocation,
  LabLocationStatus,
  LabOrder,
  Locale,
  PharmacyOrder,
  PharmacyItem,
  Provider,
  ProviderStatus,
  Service,
  ServiceCategory,
  ServiceStatus,
} from "@/lib/types";

let clientLogSeq = 0;

export type AdminTab =
  | "overview"
  | "providers"
  | "applications"
  | "services"
  | "appointments"
  | "payments"
  | "pharmacy"
  | "labs"
  | "audit";

const providerStatusTone: Record<ProviderStatus, "positive" | "pending" | "urgent"> = {
  active: "positive",
  pending: "pending",
  suspended: "urgent",
};

const adminTabs: AdminTab[] = [
  "overview",
  "providers",
  "applications",
  "services",
  "appointments",
  "payments",
  "pharmacy",
  "labs",
  "audit",
];

function tabFromHash(hash: string): AdminTab | null {
  const value = hash.replace("#", "") as AdminTab;
  return adminTabs.includes(value) ? value : null;
}

export function AdminDashboard({
  locale,
  allowedTabs = adminTabs,
  providers,
  providerMeta,
  providerApplications,
  serviceCategories,
  services,
  appointments,
  payments,
  pharmacyItems,
  pharmacyOrders,
  labOrders,
  labLocations,
  auditLogs,
}: {
  locale: Locale;
  allowedTabs?: AdminTab[];
  providers: Provider[];
  providerMeta: AdminProviderMeta[];
  providerApplications: ProviderApplicationRow[];
  serviceCategories: ServiceCategory[];
  services: Service[];
  appointments: Appointment[];
  payments: AppointmentPaymentRow[];
  pharmacyItems: PharmacyItem[];
  pharmacyOrders: PharmacyOrder[];
  labOrders: LabOrder[];
  labLocations: LabLocation[];
  auditLogs: AuditLogEntry[];
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>(allowedTabs[0] ?? "overview");
  const [providerMetaState, setProviderMetaState] = useState(providerMeta);
  const [serviceState, setServiceState] = useState(services);
  const [labLocationState, setLabLocationState] = useState(labLocations);
  const [auditState, setAuditState] = useState(auditLogs);

  useEffect(() => {
    function syncHashToTab() {
      const tab = tabFromHash(window.location.hash);
      if (tab && allowedTabs.includes(tab)) setActiveTab(tab);
    }

    syncHashToTab();
    window.addEventListener("hashchange", syncHashToTab);
    return () => window.removeEventListener("hashchange", syncHashToTab);
  }, [allowedTabs]);

  function selectTab(tab: AdminTab) {
    if (!allowedTabs.includes(tab)) return;
    setActiveTab(tab);
    if (window.location.hash !== `#${tab}`) {
      window.history.replaceState(null, "", `#${tab}`);
    }
  }

  function logActivity(action: AuditActionType, entityLabel: string) {
    clientLogSeq += 1;
    setAuditState((current) => [
      {
        id: `audit-client-${clientLogSeq}`,
        actorName: "You",
        actorRole: "admin",
        action,
        entityLabel,
        createdAt: "Just now",
      },
      ...current,
    ]);
  }

  function handleProviderStatusChange(providerId: string, providerName: string, next: ProviderStatus) {
    setProviderMetaState((current) =>
      current.map((meta) => (meta.providerId === providerId ? { ...meta, status: next } : meta))
    );
    logActivity("provider_status_changed", `${providerName} set to ${next}`);
  }

  function handleServiceStatusChange(serviceId: string, serviceName: string, next: ServiceStatus) {
    setServiceState((current) =>
      current.map((service) => (service.id === serviceId ? { ...service, status: next } : service))
    );
    logActivity("service_price_changed", `${serviceName} marked ${next}`);
  }

  function handleToggleLabLocation(locationId: string, name: string, next: LabLocationStatus) {
    setLabLocationState((current) =>
      current.map((location) => (location.id === locationId ? { ...location, status: next } : location))
    );
    logActivity("lab_location_updated", `${name} marked ${next}`);
  }

  const providerRows = useMemo(() => {
    const metaByProvider = new Map(providerMetaState.map((meta) => [meta.providerId, meta]));
    return providers
      .map((provider) => ({ provider, meta: metaByProvider.get(provider.id) }))
      .filter((row): row is { provider: Provider; meta: AdminProviderMeta } => Boolean(row.meta));
  }, [providerMetaState, providers]);

  const ops = useMemo(() => {
    const appointmentsToday = appointments.filter((appointment) =>
      appointment.scheduledAt.startsWith("Today")
    ).length;
    const waitingAppointments = appointments.filter((appointment) => appointment.status === "waiting").length;
    const liveAppointments = appointments.filter((appointment) => appointment.status === "in_progress").length;
    const pendingPayments = payments.filter((payment) => payment.status === "pending").length;
    const failedPayments = payments.filter((payment) => payment.status === "failed").length;
    const activeProviders = providerMetaState.filter((meta) => meta.status === "active").length;
    const pendingProviders = providerMetaState.filter((meta) => meta.status === "pending").length;
    const suspendedProviders = providerMetaState.filter((meta) => meta.status === "suspended").length;
    const openPharmacyOrders = pharmacyOrders.filter(
      (order) => order.status !== "delivered" && order.status !== "completed"
    ).length;
    const pharmacySubstitutions = pharmacyOrders.filter((order) => order.substitutionRequested).length;
    const openLabOrders = labOrders.filter((order) => order.status !== "results_ready").length;
    const labWhatsappPending = labOrders.filter((order) => order.whatsappDeliveryStatus !== "delivered").length;
    const activeLabLocations = labLocationState.filter((location) => location.status === "active").length;

    return {
      appointmentsToday,
      waitingAppointments,
      liveAppointments,
      pendingPayments,
      failedPayments,
      activeProviders,
      pendingProviders,
      suspendedProviders,
      openPharmacyOrders,
      pharmacySubstitutions,
      openLabOrders,
      labWhatsappPending,
      activeLabLocations,
    };
  }, [appointments, labLocationState, labOrders, payments, pharmacyOrders, providerMetaState]);

  const providerQueue = providerRows
    .filter(({ meta }) => meta.status !== "active")
    .concat(providerRows.filter(({ meta }) => meta.status === "active"))
    .slice(0, 5);

  return (
    <div className={activeTab === "overview" ? "space-y-6" : "space-y-3"}>
      {activeTab === "overview" && (
        <section className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e9ec] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#071923]">
              <ShieldCheck className="size-4 text-[#087a7b]" />
              Admin control room
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="h-9 rounded-full bg-[#01b7bb] px-4 font-bold text-white hover:bg-[#019ea2]" onClick={() => selectTab("providers")}>
                <UserPlus className="size-4" />
                Create doctor
              </Button>
              <Button variant="outline" className="h-9 rounded-full bg-white px-4 font-bold text-[#083273]" onClick={() => selectTab("payments")}>
                <CreditCard className="size-4" />
                Confirm pay
              </Button>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-[#e1e9ec] p-4 lg:border-r lg:border-b-0">
              <div className="grid grid-cols-2 divide-x divide-y divide-[#e1e9ec] overflow-hidden rounded-2xl border border-[#e1e9ec] sm:grid-cols-5 sm:divide-y-0">
                <KpiCell value={ops.appointmentsToday} label={t("admin_kpi_appointments_today", locale)} />
                <KpiCell
                  value={ops.pendingPayments}
                  label={t("admin_kpi_pending_payments", locale)}
                  tone={ops.pendingPayments > 0 ? "pending" : undefined}
                />
                <KpiCell value={ops.activeProviders} label={t("admin_kpi_active_providers", locale)} />
                <KpiCell value={ops.openPharmacyOrders} label={t("admin_kpi_open_pharmacy", locale)} />
                <KpiCell value={ops.openLabOrders} label={t("admin_kpi_open_labs", locale)} />
              </div>
            </div>

            <div className="bg-[#f4f8f9] p-4">
              <h3 className="text-sm font-bold text-[#071923]">Needs attention</h3>
              <div className="mt-3 grid gap-2">
                <OpsRow
                  icon={Users}
                  label="Provider access"
                  value={`${ops.pendingProviders} pending`}
                  detail={`${ops.suspendedProviders} suspended accounts`}
                  tone={ops.pendingProviders > 0 ? "pending" : "positive"}
                  onClick={() => selectTab("providers")}
                />
                <OpsRow
                  icon={CalendarClock}
                  label="Consultations"
                  value={`${ops.waitingAppointments} waiting`}
                  detail={`${ops.liveAppointments} live sessions`}
                  tone={ops.waitingAppointments > 0 ? "info" : "neutral"}
                  onClick={() => selectTab("appointments")}
                />
                <OpsRow
                  icon={Wallet}
                  label="Payments"
                  value={`${ops.pendingPayments} pending`}
                  detail={`${ops.failedPayments} failed payments`}
                  tone={ops.failedPayments > 0 ? "urgent" : "pending"}
                  onClick={() => selectTab("payments")}
                />
                <OpsRow
                  icon={FlaskConical}
                  label="Lab network"
                  value={`${ops.activeLabLocations} active labs`}
                  detail={`${ops.labWhatsappPending} WhatsApp messages pending`}
                  tone={ops.labWhatsappPending > 0 ? "pending" : "positive"}
                  onClick={() => selectTab("labs")}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <Tabs value={activeTab} onValueChange={(value) => selectTab(value as AdminTab)}>
        <TabsContent value="overview" className="mt-0 space-y-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <CapabilityCard
              icon={UserPlus}
              title="Doctor access"
              value={`${ops.pendingProviders} pending review`}
              detail="Admin creates doctor accounts, verifies license details, then activates access."
              action="Review providers"
              onClick={() => selectTab("providers")}
            />
            <CapabilityCard
              icon={Brain}
              title="AI routing control"
              value="Approved doctors only"
              detail="AI collects symptoms in Swahili first, shows a patient-confirmed summary, then routes by specialty and availability."
              action="View appointments"
              onClick={() => selectTab("appointments")}
            />
            <CapabilityCard
              icon={Pill}
              title="Care after visit"
              value={`${ops.openPharmacyOrders} pharmacy orders`}
              detail="Doctor-signed prescriptions can move into pharmacy fulfillment and lab referrals can send WhatsApp map instructions."
              action="Open pharmacy"
              onClick={() => selectTab("pharmacy")}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <PanelHeader
                title="Provider access queue"
                action="Full provider list"
                onClick={() => selectTab("providers")}
              />
              <div className="divide-y divide-border rounded-xl border border-border bg-background">
                {providerQueue.map(({ provider, meta }) => (
                  <ProviderAccessRow
                    key={provider.id}
                    provider={provider}
                    meta={meta}
                    onStatusChange={handleProviderStatusChange}
                  />
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <PanelHeader
                title={t("admin_recent_activity", locale)}
                action="Audit log"
                onClick={() => selectTab("audit")}
              />
              <div className="divide-y divide-border rounded-xl border border-border bg-background">
                {auditState.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="px-4 py-3 text-sm">
                    <p className="font-medium">
                      {t(adminAuditActionKey[entry.action] as TranslationKey, locale)}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {entry.entityLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {entry.actorName} / {entry.createdAt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <PanelHeader
                title={t("admin_upcoming_appointments", locale)}
                action="All appointments"
                onClick={() => selectTab("appointments")}
              />
              <div className="divide-y divide-border rounded-xl border border-border bg-background">
                {appointments.slice(0, 5).map((appointment) => {
                  const provider = providers.find((p) => p.id === appointment.providerId);
                  return (
                    <button
                      key={appointment.id}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50"
                      onClick={() => selectTab("appointments")}
                      type="button"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{provider?.name ?? "-"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {appointment.patientReference} / {appointment.scheduledAt}
                        </p>
                      </div>
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
                        {t(appointmentStatusKey[appointment.status], locale)}
                      </StatusPill>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Rules this dashboard must enforce</h3>
              </div>
              <div className="mt-4 grid gap-3">
                <RuleRow text="Only admin-created and approved doctors can receive patient matches." />
                <RuleRow text="Patient sees and confirms the AI summary before doctor routing." />
                <RuleRow text="Payment is checked before chat, voice, or video consultation starts." />
                <RuleRow text="Doctor availability controls whether patients can book now or later." />
                <RuleRow text="Pharmacy substitutions and lab referrals remain tied to the signed visit." />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="mt-0">
          <ProvidersPanel
            locale={locale}
            providers={providers}
            meta={providerMetaState}
            appointments={appointments}
            onStatusChange={handleProviderStatusChange}
          />
        </TabsContent>

        <TabsContent value="applications" className="mt-0">
          <ApplicationsPanel applications={providerApplications} />
        </TabsContent>

        <TabsContent value="services" className="mt-0">
          <ServicesPanel
            locale={locale}
            categories={serviceCategories}
            services={serviceState}
            onToggleStatus={handleServiceStatusChange}
          />
        </TabsContent>

        <TabsContent value="appointments" className="mt-0">
          <AppointmentsPanel
            locale={locale}
            appointments={appointments}
            providers={providers}
            services={serviceState}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-0">
          <PaymentsPanel locale={locale} payments={payments} />
        </TabsContent>

        <TabsContent value="pharmacy" className="mt-0">
          <PharmacyPanel locale={locale} products={pharmacyItems} orders={pharmacyOrders} />
        </TabsContent>

        <TabsContent value="labs" className="mt-0">
          <LabsPanel
            locale={locale}
            labOrders={labOrders}
            labLocations={labLocationState}
            onToggleLocation={handleToggleLabLocation}
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-0">
          <AuditPanel locale={locale} entries={auditState} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCell({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone?: "pending";
}) {
  return (
    <div className="min-h-20 bg-white p-3">
      <p
        className={
          tone === "pending" && value > 0
            ? "text-2xl font-bold tabular-nums text-[#9a6500]"
            : "text-2xl font-bold tabular-nums text-[#083273]"
        }
      >
        {value}
      </p>
      <p className="mt-1 max-w-28 text-[11px] leading-4 text-[#64747c]">{label}</p>
    </div>
  );
}

function OpsRow({
  icon: Icon,
  label,
  value,
  detail,
  tone,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "info" | "pending" | "urgent" | "neutral";
  onClick: () => void;
}) {
  return (
    <button
      className="group flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-left ring-1 ring-[#dfe8eb] transition-colors hover:bg-[#f8fbfd]"
      onClick={onClick}
      type="button"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-[#e8f7f4] text-[#087a7b]">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[#071923]">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-[#64747c]">{detail}</span>
      </span>
      <StatusPill tone={tone}>{value}</StatusPill>
    </button>
  );
}

function CapabilityCard({
  icon: Icon,
  title,
  value,
  detail,
  action,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  detail: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-[1.35rem] bg-white p-3.5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.45)] ring-1 ring-[#dfe8eb]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-[#e8f7f4] text-[#087a7b]">
          <Icon className="size-5" />
        </span>
        <Button variant="ghost" size="sm" onClick={onClick}>
          {action}
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <p className="mt-3 text-xs font-semibold text-[#64747c]">{title}</p>
      <p className="mt-1 text-base font-bold tracking-tight text-[#071923]">{value}</p>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#64747c]">{detail}</p>
    </div>
  );
}

function ProviderAccessRow({
  provider,
  meta,
  onStatusChange,
}: {
  provider: Provider;
  meta: AdminProviderMeta;
  onStatusChange: (providerId: string, providerName: string, next: ProviderStatus) => void;
}) {
  const action =
    meta.status === "pending"
      ? { label: "Approve", next: "active" as const, variant: "default" as const }
      : meta.status === "suspended"
        ? { label: "Reactivate", next: "active" as const, variant: "outline" as const }
        : { label: "Suspend", next: "suspended" as const, variant: "destructive" as const };

  return (
    <div className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{provider.name}</p>
          <StatusPill tone={providerStatusTone[meta.status]}>{meta.status}</StatusPill>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{provider.specialty}</span>
          <span>{meta.licenseNumber}</span>
          <span>{meta.appointmentsThisWeek} appts this week</span>
          <span>{provider.nextAvailableAt}</span>
        </div>
      </div>
      {isUuid(provider.id) ? (
        <ProviderStatusForm providerId={provider.id} status={meta.status} />
      ) : (
        <Button
          size="sm"
          variant={action.variant}
          onClick={() => onStatusChange(provider.id, provider.name, action.next)}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

function PanelHeader({
  title,
  action,
  onClick,
}: {
  title: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <Button variant="ghost" size="sm" onClick={onClick}>
        {action}
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

function RuleRow({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-[#f8fbfd] p-3 text-sm ring-1 ring-[#dfe8eb]">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#01b7bb]" />
      <p className="leading-6 text-[#64747c]">{text}</p>
    </div>
  );
}
