import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileUser,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  ScrollText,
  ShieldCheck,
  Star,
  Stethoscope,
} from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { AdminDashboard, type AdminTab } from "@/components/admin/admin-dashboard";
import { AdminNavList } from "@/components/admin/admin-nav-list";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getServerLocale } from "@/lib/locale-cookie";
import { t, staffRoleKey, staffStatusKey } from "@/lib/i18n";
import { toTitleCase } from "@/lib/format-name";
import type { AppointmentPaymentRow } from "@/components/admin/payments-panel";
import type { ProviderApplicationRow } from "@/components/admin/applications-panel";
import type {
  Appointment,
  AppointmentStatus,
  AuditActionType,
  AuditLogEntry,
  ConsultationFeedback,
  ConsultationMode,
  LabOrder,
  LabOrderStatus,
  PaymentStatus,
  PharmacyCategory,
  PharmacyItem,
  PharmacyItemBadge,
  PharmacyItemStatus,
  PharmacyOrder,
  Service,
  ServiceCategory,
  StaffRole,
  StockStatus,
  WhatsappDeliveryStatus,
} from "@/lib/types";
import { signOut } from "../actions";

type DbProviderRow = {
  id: string;
  user_id: string;
  full_name: string;
  specialty: string;
  credentials: string | null;
  license_number: string | null;
  bio: string | null;
  profile_status: string;
  languages: string[] | null;
  consultation_modes: string[] | null;
  available_now: boolean | null;
  availability_note: string | null;
  created_at: string;
  rating_summary: { rating?: number; reviewCount?: number } | null;
};

type PaymentAppointmentRow = {
  id: string;
  scheduled_at: string;
  payment_status: string;
  status: string;
  provider_id: string;
  service_id: string;
  price: number | string | null;
  currency: string | null;
  patients: { full_name: string; hospital_reference_number: string | null } | null;
  providers: { full_name: string } | null;
  consultation_orders: { consultation_mode: string }[] | null;
};

type DbFeedbackRow = {
  id: string;
  rating: number;
  feedback_text: string | null;
  testimonial_text: string | null;
  testimonial_consent: boolean;
  created_at: string;
  patients: { full_name: string; hospital_reference_number: string | null } | null;
  providers: { full_name: string } | null;
};

type DbAuditLogRow = {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

type DbLabOrderRow = {
  id: string;
  status: string;
  map_url: string | null;
  instructions: string | null;
  whatsapp_delivery_status: string;
  lab_location_id: string;
  lab_order_tests: { lab_tests: { test_name: string } | null }[] | null;
};

type DbLabLocationRow = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  region: string | null;
  latitude: number | string;
  longitude: number | string;
  map_url: string | null;
  opening_hours: string | null;
  status: string;
};

type DbPharmacyItemRow = {
  id: string;
  medicine_name: string;
  category: string;
  description: string | null;
  form: string | null;
  strength: string | null;
  stock_status: string;
  unit_price: number | string;
  requires_prescription: boolean;
  photo_url: string | null;
  status: string;
  badge: string | null;
  created_at: string;
};

type DbPharmacyOrderRow = {
  id: string;
  status: string;
  fulfillment_method: string;
  total_amount: number | string;
  created_at: string;
  patients: { hospital_reference_number: string | null } | null;
  pharmacy_order_items: {
    id: string;
    pharmacy_item_id: string;
    prescribed_medication_name: string | null;
    quantity: number;
    availability_status: string;
    substitution_requested: boolean;
  }[];
};

type DbServiceRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  base_price: number | string;
  status: string;
};

type DbServiceCategoryRow = {
  id: string;
  name: string;
  description: string | null;
};

type DbProviderApplicationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  license_number: string | null;
  specialty: string | null;
  region: string | null;
  experience_years: number | null;
  languages: string[] | null;
  consultation_modes: string[] | null;
  bio: string | null;
  file_path: string | null;
  file_name: string | null;
  status: string;
  created_at: string;
};

const navItems = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Doctors", href: "#providers", icon: Stethoscope },
  { label: "Applications", href: "#applications", icon: FileUser },
  { label: "Services", href: "#services", icon: ClipboardList },
  { label: "Appointments", href: "#appointments", icon: CalendarClock },
  { label: "Payments", href: "#payments", icon: CreditCard },
  { label: "Pharmacy", href: "#pharmacy", icon: Pill },
  { label: "Labs", href: "#labs", icon: FlaskConical },
  { label: "Feedback", href: "#feedback", icon: Star },
  { label: "Audit log", href: "#audit", icon: ScrollText },
];

function allowedTabsForRole(role: string | null | undefined): AdminTab[] {
  if (role === "admin") {
    return [
      "overview",
      "providers",
      "applications",
      "services",
      "appointments",
      "payments",
      "pharmacy",
      "labs",
      "feedback",
      "audit",
    ];
  }
  if (role === "pharmacy_staff") return ["pharmacy"];
  if (role === "lab_staff") return ["labs"];
  if (role === "payment_staff") return ["payments"];
  return [];
}

function roleLabel(role: string, locale: "en" | "sw") {
  if (role in staffRoleKey) {
    return t(staffRoleKey[role as keyof typeof staffRoleKey], locale);
  }
  if (role === "payment_staff") return locale === "sw" ? "Mfanyakazi wa malipo" : "Payment staff";
  return role.replaceAll("_", " ");
}

export default async function AdminDashboardPage() {
  const locale = await getServerLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/doctor");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "doctor") {
    redirect("/doctor/dashboard");
  }

  const allowedTabs = allowedTabsForRole(profile?.role);

  if (profile && allowedTabs.length === 0) {
    redirect("/");
  }

  const visibleNavItems = navItems.filter((item) =>
    item.href === "#overview"
      ? allowedTabs.includes("overview")
      : allowedTabs.includes(item.href.replace("#", "") as AdminTab)
  );

  let adminDataWarning: string | null = null;
  let pharmacyDataWarning: string | null = null;
  let feedbackDataWarning: string | null = null;
  let dbProviders: DbProviderRow[] | null = null;
  let paymentAppointments: PaymentAppointmentRow[] | null = null;
  let dbLabLocations: DbLabLocationRow[] | null = null;
  let dbApplications: DbProviderApplicationRow[] | null = null;
  let dbServices: DbServiceRow[] | null = null;
  let dbServiceCategories: DbServiceCategoryRow[] | null = null;
  let dbPharmacyItems: DbPharmacyItemRow[] | null = null;
  let dbPharmacyOrders: DbPharmacyOrderRow[] | null = null;
  let dbAuditLogs: DbAuditLogRow[] | null = null;
  let dbLabOrders: DbLabOrderRow[] | null = null;
  let dbFeedback: DbFeedbackRow[] | null = null;
  const actorNameByUserId = new Map<string, string>();
  const actorRoleByUserId = new Map<string, StaffRole>();
  const applicationFileUrls = new Map<string, string>();

  if (profile) {
    try {
      const service = createServiceClient();
      // Independent tables -- was one sequential round trip after another
      // before this, even though none of them depend on each other's result.
      const [
        providersResult,
        appointmentsResult,
        labsResult,
        applicationsResult,
        servicesResult,
        serviceCategoriesResult,
        auditLogsResult,
        labOrdersResult,
      ] =
        await Promise.all([
          service
            .from("providers")
            .select(
              "id, user_id, full_name, specialty, credentials, license_number, bio, profile_status, languages, consultation_modes, available_now, availability_note, created_at, rating_summary"
            )
            .order("created_at", { ascending: false }),
          service
            .from("appointments")
            .select(
              "id, scheduled_at, payment_status, status, provider_id, service_id, price, currency, patients(full_name, hospital_reference_number), providers(full_name), consultation_orders(consultation_mode)"
            )
            .order("scheduled_at", { ascending: false })
            .limit(50),
          service
            .from("lab_locations")
            .select("id, name, address, phone, region, latitude, longitude, map_url, opening_hours, status")
            .order("region", { ascending: true })
            .order("name", { ascending: true }),
          service
            .from("provider_applications")
            .select(
              "id, full_name, email, phone, license_number, specialty, region, experience_years, languages, consultation_modes, bio, file_path, file_name, status, created_at"
            )
            .order("created_at", { ascending: false })
            .limit(100),
          service
            .from("services")
            .select("id, category_id, name, description, base_price, status")
            .order("name", { ascending: true }),
          service.from("service_categories").select("id, name, description").order("sort_order", { ascending: true }),
          service
            .from("audit_logs")
            .select("id, actor_user_id, action, entity_type, entity_id, created_at")
            .order("created_at", { ascending: false })
            .limit(50),
          service
            .from("lab_orders")
            .select(
              "id, status, map_url, instructions, whatsapp_delivery_status, lab_location_id, lab_order_tests(lab_tests(test_name))"
            )
            .order("created_at", { ascending: false })
            .limit(50),
        ]);

      if (providersResult.error) {
        throw providersResult.error;
      }

      dbProviders = providersResult.data as DbProviderRow[];

      if (appointmentsResult.error) {
        throw appointmentsResult.error;
      }

      paymentAppointments = appointmentsResult.data as unknown as PaymentAppointmentRow[];

      if (labsResult.error) {
        throw labsResult.error;
      }

      dbLabLocations = labsResult.data as DbLabLocationRow[];

      if (applicationsResult.error) {
        throw applicationsResult.error;
      }

      dbApplications = applicationsResult.data as DbProviderApplicationRow[];

      if (servicesResult.error) {
        throw servicesResult.error;
      }

      dbServices = servicesResult.data as DbServiceRow[];

      if (serviceCategoriesResult.error) {
        throw serviceCategoriesResult.error;
      }

      dbServiceCategories = serviceCategoriesResult.data as DbServiceCategoryRow[];

      if (auditLogsResult.error) {
        throw auditLogsResult.error;
      }

      dbAuditLogs = auditLogsResult.data as DbAuditLogRow[];

      if (labOrdersResult.error) {
        throw labOrdersResult.error;
      }

      dbLabOrders = labOrdersResult.data as unknown as DbLabOrderRow[];

      // audit_logs only stores actor_user_id -- resolve a display name from
      // whichever staff table actually has one. Doctors have a name via
      // providers (already fetched above); anyone else falls back to their
      // email. One batched lookup for every distinct actor, not one query
      // per log row.
      const actorUserIds = [
        ...new Set(dbAuditLogs.map((log) => log.actor_user_id).filter((id): id is string => Boolean(id))),
      ];
      const providerNameByUserId = new Map(dbProviders.map((provider) => [provider.user_id, provider.full_name]));
      if (actorUserIds.length > 0) {
        const { data: actorUsers } = await service
          .from("users")
          .select("id, email, role")
          .in("id", actorUserIds);
        (actorUsers ?? []).forEach((user) => {
          actorNameByUserId.set(user.id, providerNameByUserId.get(user.id) ?? user.email);
          actorRoleByUserId.set(user.id, user.role as StaffRole);
        });
      }

      const applicationFilePaths = dbApplications
        .map((application) => application.file_path)
        .filter((path): path is string => Boolean(path));

      if (applicationFilePaths.length > 0) {
        const { data: signedUrls } = await service.storage
          .from("provider-applications")
          .createSignedUrls(applicationFilePaths, 900);
        signedUrls?.forEach((entry) => {
          if (entry.path && entry.signedUrl) {
            applicationFileUrls.set(entry.path, entry.signedUrl);
          }
        });
      }
    } catch (error) {
      adminDataWarning =
        error instanceof Error
          ? error.message
          : "Admin data could not be loaded. Check Supabase configuration and migrations.";
    }

    // Isolated from the block above on purpose: pharmacy_items.description
    // and .status are a newer migration (0012), so a database that hasn't
    // been migrated yet would otherwise throw here and take the providers/
    // payments/labs/applications tabs down with it, even though those don't
    // depend on this table at all.
    try {
      const service = createServiceClient();
      const [pharmacyItemsResult, pharmacyOrdersResult] = await Promise.all([
        service
          .from("pharmacy_items")
          .select(
            "id, medicine_name, category, description, form, strength, stock_status, unit_price, requires_prescription, photo_url, status, badge, created_at"
          )
          .order("created_at", { ascending: false }),
        service
          .from("pharmacy_orders")
          .select(
            "id, status, fulfillment_method, total_amount, created_at, patients(hospital_reference_number), pharmacy_order_items(id, pharmacy_item_id, prescribed_medication_name, quantity, availability_status, substitution_requested)"
          )
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (pharmacyItemsResult.error) {
        throw pharmacyItemsResult.error;
      }

      dbPharmacyItems = pharmacyItemsResult.data as DbPharmacyItemRow[];

      if (pharmacyOrdersResult.error) {
        throw pharmacyOrdersResult.error;
      }

      dbPharmacyOrders = pharmacyOrdersResult.data as unknown as DbPharmacyOrderRow[];
    } catch (error) {
      pharmacyDataWarning =
        error instanceof Error
          ? error.message
          : "Pharmacy data could not be loaded. Check Supabase configuration and migrations.";
    }

    // Isolated for the same reason as the pharmacy block above --
    // consultation_feedback is a newer migration (0020), so a database that
    // hasn't been migrated yet would otherwise take every other tab down
    // with it.
    try {
      const service = createServiceClient();
      const { data, error } = await service
        .from("consultation_feedback")
        .select(
          "id, rating, feedback_text, testimonial_text, testimonial_consent, created_at, patients(full_name, hospital_reference_number), providers(full_name)"
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        throw error;
      }

      dbFeedback = data as unknown as DbFeedbackRow[];
    } catch (error) {
      feedbackDataWarning =
        error instanceof Error
          ? error.message
          : "Feedback data could not be loaded. Check Supabase configuration and migrations.";
    }
  }

  const mappedProviders =
    dbProviders
      ? dbProviders.map((provider) => ({
          id: provider.id,
          name: provider.full_name,
          specialty: provider.specialty,
          credentials: provider.credentials ?? "Credentials pending",
          rating: Number((provider.rating_summary as { rating?: number } | null)?.rating ?? 0),
          reviewCount: Number(
            (provider.rating_summary as { reviewCount?: number } | null)?.reviewCount ?? 0
          ),
          languages: (provider.languages?.length ? provider.languages : ["sw", "en"]) as (
            | "en"
            | "sw"
          )[],
          price: 0,
          consultationModes: (provider.consultation_modes?.length
            ? provider.consultation_modes
            : ["voice", "video"]) as ("chat" | "voice" | "video")[],
          nextAvailableAt: provider.availability_note || "Set availability",
          isAvailableNow: Boolean(provider.available_now),
          photoUrl: "",
          bio: provider.bio ?? "Provider profile created by Afya24 admin.",
          timeSlots: [],
        }))
      : [];

  // Real, honest data -- no mock fallback. An admin needs to be able to
  // trust that "no payments" means no payments, not "the DB happened to be
  // empty so we're showing you seven fake ones instead."
  const realPayments: AppointmentPaymentRow[] = (paymentAppointments ?? []).map((appointment) => ({
    id: appointment.id,
    scheduledAt: appointment.scheduled_at,
    status: appointment.payment_status as AppointmentPaymentRow["status"],
    price: Number(appointment.price ?? 0),
    currency: appointment.currency ?? "TZS",
    // patients/providers are many-to-one FKs, so PostgREST embeds each as a
    // single object -- confirmed against the real API response, not just
    // the untyped client's generic (and here, misleading) inferred shape.
    patientName: toTitleCase(
      (appointment.patients as unknown as { full_name: string } | null)?.full_name ?? "Patient"
    ),
    patientReference:
      (appointment.patients as unknown as { hospital_reference_number: string | null } | null)
        ?.hospital_reference_number ?? "—",
    providerName: (appointment.providers as unknown as { full_name: string } | null)?.full_name ?? "Doctor",
  }));

  // Same honesty rule as realPayments above -- intakeStatus/chatStatus/
  // voiceStatus/videoStatus have no real column anywhere (confirmed: the
  // admin UI never actually reads them, they're pure mock-data leftovers
  // in the shared Appointment type), so they get a harmless static default
  // rather than fabricated per-row values.
  const realAppointments: Appointment[] = (paymentAppointments ?? []).map((appointment) => ({
    id: appointment.id,
    patientReference:
      (appointment.patients as unknown as { hospital_reference_number: string | null } | null)
        ?.hospital_reference_number ?? "—",
    providerId: appointment.provider_id,
    serviceId: appointment.service_id,
    scheduledAt: new Date(appointment.scheduled_at).toLocaleString("en-TZ", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Dar_es_Salaam",
    }),
    consultationMode: (appointment.consultation_orders?.[0]?.consultation_mode ?? "chat") as ConsultationMode,
    status: appointment.status as AppointmentStatus,
    paymentStatus: appointment.payment_status as PaymentStatus,
    intakeStatus: "complete",
    chatStatus: "not_started",
    voiceStatus: "not_started",
    videoStatus: "not_started",
  }));

  const realAuditLogs: AuditLogEntry[] = (dbAuditLogs ?? []).map((log) => ({
    id: log.id,
    actorName: log.actor_user_id ? (actorNameByUserId.get(log.actor_user_id) ?? "Unknown") : "System",
    // System-initiated events (e.g. the payment gateway webhook) have no
    // real staff role -- "admin" is the closest harmless fit for display,
    // not a claim that an admin literally clicked anything.
    actorRole: (log.actor_user_id ? actorRoleByUserId.get(log.actor_user_id) : undefined) ?? "admin",
    action: log.action as AuditActionType,
    entityLabel: log.entity_type + (log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""),
    createdAt: new Date(log.created_at).toLocaleString("en-TZ", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Dar_es_Salaam",
    }),
  }));

  const realLabOrders: LabOrder[] = (dbLabOrders ?? []).map((order) => ({
    id: order.id,
    tests: (order.lab_order_tests ?? [])
      .map((entry) => entry.lab_tests?.test_name)
      .filter((name): name is string => Boolean(name)),
    status: order.status as LabOrderStatus,
    labLocationId: order.lab_location_id,
    mapUrl: order.map_url ?? "",
    whatsappDeliveryStatus: order.whatsapp_delivery_status as WhatsappDeliveryStatus,
    instructions: order.instructions ?? "",
  }));

  const mappedProviderMeta =
    dbProviders
      ? dbProviders.map((provider) => ({
          providerId: provider.id,
          status: provider.profile_status as "active" | "pending" | "suspended",
          licenseNumber: provider.license_number ?? "Not set",
          appointmentsThisWeek: 0,
          joinedAt: new Date(provider.created_at).toLocaleDateString("en-TZ", {
            month: "short",
            year: "numeric",
            timeZone: "Africa/Dar_es_Salaam",
          }),
        }))
      : [];

  // Real, honest data -- same principle as realPayments below. Only one
  // service exists in practice (see supabase/migrations/0006_seed_default_service.sql)
  // but this stays generic rather than hardcoding that assumption.
  const realServiceCategories: ServiceCategory[] = (dbServiceCategories ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description ?? "",
    // Not stored on the real table -- these two fields are only ever read
    // by the patient-facing services grid, which still runs on mock data
    // (a separate, pre-existing gap outside this fix's scope).
    icon: "Stethoscope",
    popularServices: [],
  }));

  const realServices: Service[] = (dbServices ?? []).map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description ?? "",
    startingPrice: Number(row.base_price),
    // Not stored on the real table -- every bookable service today offers
    // both, matching what bookConsultation/booking-form actually let a
    // patient pick from.
    consultationModes: ["voice", "video"],
    estimatedDuration: 20,
    status: row.status as Service["status"],
  }));

  const realLabLocations =
    dbLabLocations?.map((location) => ({
      id: location.id,
      name: location.name,
      address: location.address,
      phone: location.phone ?? "",
      region: location.region ?? "",
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      openingHours: location.opening_hours ?? "Hours not listed",
      mapUrl:
        location.map_url ??
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${location.latitude},${location.longitude}`
        )}`,
      status: location.status as "active" | "inactive",
    })) ?? [];

  const providerApplications: ProviderApplicationRow[] = (dbApplications ?? []).map((application) => ({
    id: application.id,
    fullName: application.full_name,
    email: application.email,
    phone: application.phone ?? "",
    licenseNumber: application.license_number ?? "",
    specialty: application.specialty ?? "",
    region: application.region ?? "",
    experienceYears: application.experience_years,
    languages: application.languages ?? [],
    consultationModes: application.consultation_modes ?? [],
    bio: application.bio ?? "",
    fileName: application.file_name ?? "",
    fileUrl: application.file_path ? applicationFileUrls.get(application.file_path) ?? null : null,
    status: application.status as ProviderApplicationRow["status"],
    createdAt: application.created_at,
  }));

  // Real, honest data -- same principle as realPayments above. An empty
  // catalog or order list should read as "nothing here yet," not be padded
  // out with placeholder products no one actually stocks.
  const realPharmacyItems: PharmacyItem[] = (dbPharmacyItems ?? []).map((item) => ({
    id: item.id,
    medicineName: item.medicine_name,
    category: item.category as PharmacyCategory,
    description: item.description ?? undefined,
    form: item.form ?? "Not set",
    strength: item.strength ?? "Not set",
    unitPrice: Number(item.unit_price),
    stockStatus: item.stock_status as StockStatus,
    requiresPrescription: item.requires_prescription,
    photoUrl: item.photo_url ?? undefined,
    status: item.status as PharmacyItemStatus,
    badge: (item.badge as PharmacyItemBadge | null) ?? undefined,
  }));

  const realPharmacyOrders: PharmacyOrder[] = (dbPharmacyOrders ?? []).map((order) => ({
    id: order.id,
    patientReference:
      (order.patients as unknown as { hospital_reference_number: string | null } | null)
        ?.hospital_reference_number ?? "—",
    prescriptionId: "",
    items: (order.pharmacy_order_items ?? []).map((orderItem) => ({
      pharmacyItemId: orderItem.pharmacy_item_id,
      prescribedMedicationName: orderItem.prescribed_medication_name ?? "",
      quantity: orderItem.quantity,
      availabilityStatus: orderItem.availability_status as StockStatus,
      substitutionRequested: orderItem.substitution_requested,
    })),
    fulfillmentMethod: order.fulfillment_method as PharmacyOrder["fulfillmentMethod"],
    subtotal: Number(order.total_amount),
    fees: 0,
    total: Number(order.total_amount),
    status: order.status as PharmacyOrder["status"],
    substitutionRequested: (order.pharmacy_order_items ?? []).some(
      (orderItem) => orderItem.substitution_requested
    ),
  }));

  const realFeedback: ConsultationFeedback[] = (dbFeedback ?? []).map((entry) => ({
    id: entry.id,
    rating: entry.rating,
    feedbackText: entry.feedback_text,
    testimonialText: entry.testimonial_text,
    testimonialConsent: entry.testimonial_consent,
    patientName: toTitleCase(
      (entry.patients as unknown as { full_name: string } | null)?.full_name ?? "Patient"
    ),
    patientReference:
      (entry.patients as unknown as { hospital_reference_number: string | null } | null)
        ?.hospital_reference_number ?? "—",
    providerName: (entry.providers as unknown as { full_name: string } | null)?.full_name ?? "Doctor",
    createdAt: entry.created_at,
  }));

  return (
    <main className="min-h-[100dvh] bg-[#edf3f6] px-3 py-3 text-[#101820] sm:px-5 lg:px-6">
      <div className="sticky top-0 z-40 mx-auto mb-3 flex w-full max-w-7xl items-center justify-between rounded-2xl border border-[#dfe8eb] bg-white/94 px-4 py-3 shadow-[0_18px_45px_-32px_rgba(8,50,115,0.35)] backdrop-blur lg:hidden">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/brand/afya24-logo-header.png"
            alt="Afya24"
            width={220}
            height={70}
            priority
            style={{ width: "auto" }}
            className="h-7"
          />
        </Link>

        <details className="group relative">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full bg-[#e8f7f4] text-[#083273] outline-none transition hover:bg-[#d8f3ef] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/30">
            <Menu className="size-5" />
            <span className="sr-only">Open admin menu</span>
          </summary>
          <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl bg-white p-2 text-[#071923] shadow-[0_24px_60px_-28px_rgba(8,50,115,0.75)] ring-1 ring-[#dfe8eb]">
            <AdminNavList
              items={visibleNavItems.map((item) => ({
                label: item.label,
                href: item.href,
                icon: <item.icon className="size-4 text-[#01b7bb]" />,
              }))}
              variant="menu"
            />
          </div>
        </details>
      </div>

      <div className="mx-auto grid w-full max-w-7xl rounded-[1.75rem] bg-[#f8fbfd] shadow-[0_28px_90px_-50px_rgba(8,50,115,0.55)] lg:grid-cols-[250px_1fr]">
        <aside className="hidden border-r border-[#dfe8eb] bg-white p-5 text-[#071923] lg:sticky lg:top-3 lg:block lg:h-[calc(100dvh-1.5rem)] lg:self-start lg:overflow-y-auto lg:rounded-l-[1.75rem]">
          <div className="flex min-h-full flex-col">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/brand/afya24-logo-header.png"
                alt="Afya24"
                width={220}
                height={70}
                priority
                style={{ width: "auto" }}
                className="h-8"
              />
            </Link>

            <nav className="mt-8 grid gap-1.5">
              <AdminNavList
                items={visibleNavItems.map((item) => ({
                  label: item.label,
                  href: item.href,
                  icon: <item.icon className="size-4" />,
                }))}
                variant="sidebar"
              />
            </nav>

            <div className="mt-10 rounded-[1.35rem] bg-[#f4f8f9] p-4 ring-1 ring-[#dfe8eb] lg:mt-auto">
              <p className="text-sm font-bold text-[#083273]">Admin control</p>
              <p className="mt-2 text-xs leading-5 text-[#60717a]">
                Doctors, payments, pharmacy, labs, and audit trails stay in one workspace.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#087a7b]">
                <ShieldCheck className="size-4" />
                Staff access verified
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0" id="overview">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#e1e9ec] bg-[#f8fbfd]/92 px-4 py-4 backdrop-blur sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7a82]">
                Admin dashboard
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#071923]">
                {t("admin_dashboard_title", locale)}
              </h1>
              <p className="mt-1 hidden text-sm text-[#64747c] md:block">
                {t("admin_dashboard_subtitle", locale)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {profile && (
                <div className="hidden text-right text-sm sm:block">
                  <p className="font-bold text-[#071923]">{user.email}</p>
                  <p className="text-xs text-[#64747c]">
                    {roleLabel(profile.role, locale)} · {t(staffStatusKey[profile.status], locale)}
                  </p>
                </div>
              )}
              <form action={signOut}>
                <SubmitButton variant="outline" className="h-10 rounded-full bg-white px-4">
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">{t("dashboard_sign_out", locale)}</span>
                </SubmitButton>
              </form>
            </div>
          </header>

          <div className="p-4 sm:p-6">
            {adminDataWarning ? (
              <div className="mb-4 rounded-[1.1rem] bg-[#fff4f0] p-4 text-sm text-[#9b2c12] ring-1 ring-[#ffd4c6]">
                <p className="font-bold">Admin data could not load.</p>
                <p className="mt-1">
                  {adminDataWarning}
                </p>
                <p className="mt-2 text-xs text-[#9b2c12]/80">
                  Check Vercel Supabase environment variables and make sure the latest database
                  migrations are applied.
                </p>
              </div>
            ) : null}

            {pharmacyDataWarning ? (
              <div className="mb-4 rounded-[1.1rem] bg-[#fff4f0] p-4 text-sm text-[#9b2c12] ring-1 ring-[#ffd4c6]">
                <p className="font-bold">Pharmacy data could not load.</p>
                <p className="mt-1">{pharmacyDataWarning}</p>
                <p className="mt-2 text-xs text-[#9b2c12]/80">
                  Run migration 0012_pharmacy_catalog_details.sql against this Supabase project,
                  then reload.
                </p>
              </div>
            ) : null}

            {feedbackDataWarning ? (
              <div className="mb-4 rounded-[1.1rem] bg-[#fff4f0] p-4 text-sm text-[#9b2c12] ring-1 ring-[#ffd4c6]">
                <p className="font-bold">Feedback data could not load.</p>
                <p className="mt-1">{feedbackDataWarning}</p>
                <p className="mt-2 text-xs text-[#9b2c12]/80">
                  Run migration 0020_consultation_feedback.sql against this Supabase project, then
                  reload.
                </p>
              </div>
            ) : null}

            {profile ? (
              <div id="admin-tabs">
                <AdminDashboard
                  locale={locale}
                  allowedTabs={allowedTabs}
                  providers={mappedProviders}
                  providerMeta={mappedProviderMeta}
                  providerApplications={providerApplications}
                  serviceCategories={realServiceCategories}
                  services={realServices}
                  appointments={realAppointments}
                  payments={realPayments}
                  pharmacyItems={realPharmacyItems}
                  pharmacyOrders={realPharmacyOrders}
                  labOrders={realLabOrders}
                  labLocations={realLabLocations}
                  feedback={realFeedback}
                  auditLogs={realAuditLogs}
                />
              </div>
            ) : (
              <div className="rounded-[1.35rem] bg-white p-6 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
                <p className="text-sm text-[#64747c]">
                  {t("doctor_dashboard_no_profile", locale)}{" "}
                  <code className="rounded bg-[#f4f8f9] px-1.5 py-0.5 text-xs">public.users</code>{" "}
                  {t("doctor_dashboard_with_role", locale)}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
