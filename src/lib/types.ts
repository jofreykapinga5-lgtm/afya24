// Shared domain types for Afya24 frontend prototype.
// Shapes follow PRD.md section 14 (Initial API Contract Assumptions).
// Mock data implements these now; real API responses should match later.

export type ConsultationMode = "chat" | "voice" | "video";

export type UrgencyLevel = "low" | "moderate" | "high" | "emergency";

export type Locale = "en" | "sw";

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  popularServices: string[];
}

export type ServiceStatus = "active" | "inactive";

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  startingPrice: number;
  consultationModes: ConsultationMode[];
  estimatedDuration: number;
  status?: ServiceStatus;
}

export interface QualificationResult {
  urgencyLevel: UrgencyLevel;
  recommendedSpecialties: string[];
  patientConfirmedSummary: string;
  summaryForDoctor: string;
  missingInformation: string[];
  emergencyReason?: string;
  chiefComplaint?: string;
  symptoms?: string[];
  duration?: string;
  medications?: string[];
  allergies?: string[];
  existingConditions?: string[];
}

// Used to back the specialty dropdown on both the doctor application form
// and the admin "add doctor" form, so specialties stay consistent instead
// of fragmenting into free-text variants (e.g. "Peds" vs "Pediatrics").
export const MEDICAL_SPECIALTIES = [
  "General Practice",
  "Internal Medicine",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Dermatology",
  "Psychiatry & Mental Health",
  "Cardiology",
  "ENT (Ear, Nose & Throat)",
  "Ophthalmology",
  "Orthopedics",
  "Dentistry",
  "Nutrition & Dietetics",
  "Endocrinology & Diabetes",
  "Urology",
  "Neurology",
] as const;

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  credentials: string;
  rating: number;
  reviewCount: number;
  languages: Locale[];
  price: number;
  consultationModes: ConsultationMode[];
  nextAvailableAt: string;
  isAvailableNow: boolean;
  photoUrl: string;
  bio: string;
  quote?: string;
  timeSlots?: string[];
}

export type CheckoutStatus = "pending" | "paid" | "failed";

export interface Checkout {
  id: string;
  patientReference: string | null;
  serviceId: string;
  providerId: string;
  consultationMode: ConsultationMode;
  scheduledAt: string;
  subtotal: number;
  fees: number;
  total: number;
  status: CheckoutStatus;
}

export type AppointmentStatus =
  | "scheduled"
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";
export type IntakeStatus = "not_started" | "in_progress" | "complete";
export type SessionChannelStatus = "not_started" | "connecting" | "active" | "ended";

export interface Appointment {
  id: string;
  patientReference: string;
  providerId: string;
  serviceId: string;
  scheduledAt: string;
  consultationMode: ConsultationMode;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  intakeStatus: IntakeStatus;
  chatStatus: SessionChannelStatus;
  voiceStatus: SessionChannelStatus;
  videoStatus: SessionChannelStatus;
}

export interface Prescription {
  medicationName: string;
  dosage: string;
  instructions: string;
  duration: string;
}

export interface Referral {
  reason: string;
  referredTo: string;
  notes: string;
}

export type LabLocationStatus = "active" | "inactive";

export interface LabLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  region: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  mapUrl: string;
  status: LabLocationStatus;
}

export type WhatsappDeliveryStatus = "not_sent" | "sent" | "delivered" | "failed";
export type LabOrderStatus =
  | "ordered"
  | "instructions_sent"
  | "sample_collected"
  | "results_pending"
  | "results_ready";

export interface LabOrder {
  id: string;
  tests: string[];
  status: LabOrderStatus;
  labLocationId: string;
  mapUrl: string;
  whatsappDeliveryStatus: WhatsappDeliveryStatus;
  instructions: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

// Admin-defined free text -- no longer a closed enum, so new categories can
// be added from the admin panel without a code change.
export type PharmacyCategory = string;

// A small set of well-known categories to seed the admin panel's suggestion
// list; not exhaustive and not enforced by the database.
export const KNOWN_PHARMACY_CATEGORIES = [
  "Pain relief",
  "Allergy",
  "Antibiotics",
  "Vitamins & supplements",
  "Supplements",
  "Hospital tools",
  "Medical devices",
  "Wound care",
  "First aid",
  "Cold & flu",
  "Chronic condition",
] as const;

export type PharmacyItemStatus = "published" | "coming_soon" | "hidden";

export type PharmacyItemBadge = "trending" | "hot" | "new" | "sale";

export interface PharmacyItem {
  id: string;
  medicineName: string;
  category: PharmacyCategory;
  description?: string;
  form: string;
  strength: string;
  unitPrice: number;
  stockStatus: StockStatus;
  requiresPrescription: boolean;
  photoUrl?: string;
  status: PharmacyItemStatus;
  badge?: PharmacyItemBadge | null;
}

export interface PharmacyOrderItem {
  pharmacyItemId: string;
  prescribedMedicationName: string;
  quantity: number;
  availabilityStatus: StockStatus;
  substitutionRequested: boolean;
}

export type PharmacyOrderStatus =
  | "pending"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "completed";

export type FulfillmentMethod = "pickup" | "delivery";

export interface PharmacyOrder {
  id: string;
  patientReference: string;
  prescriptionId: string;
  items: PharmacyOrderItem[];
  fulfillmentMethod: FulfillmentMethod;
  subtotal: number;
  fees: number;
  total: number;
  status: PharmacyOrderStatus;
  substitutionRequested: boolean;
}

// --- Admin dashboard ---
// Shapes below back the admin dashboard prototype (providers, services,
// appointments, payments, pharmacy/lab oversight, audit log). Mock data
// implements these now; real API responses should match later.

export type StaffRole = "admin" | "doctor" | "pharmacy_staff" | "lab_staff";
export type ProviderStatus = "active" | "pending" | "suspended";

export interface AdminProviderMeta {
  providerId: string;
  status: ProviderStatus;
  licenseNumber: string;
  appointmentsThisWeek: number;
  joinedAt: string;
}

export type PaymentMethod = "mpesa" | "card" | "cash";

export interface Payment {
  id: string;
  appointmentId: string;
  patientReference: string;
  providerId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  confirmedByAdmin: boolean;
  createdAt: string;
}

export type AuditActionType =
  | "provider_added"
  | "provider_status_changed"
  | "service_price_changed"
  | "payment_confirmed"
  | "payment_marked_failed"
  | "payment_gateway_completed"
  | "payment_gateway_failed"
  | "lab_location_updated"
  | "pharmacy_order_status_changed"
  | "prescription_signed"
  | "lab_order_approved"
  | "pharmacy_item_added"
  | "pharmacy_item_updated"
  | "pharmacy_item_deleted";

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: StaffRole;
  action: AuditActionType;
  entityLabel: string;
  createdAt: string;
}
