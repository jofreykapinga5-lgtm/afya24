import { t } from "./i18n";
import type { ConsultationMode, Locale, Provider } from "./types";

export interface ProviderRow {
  id: string;
  full_name: string;
  specialty: string;
  credentials: string | null;
  bio: string | null;
  photo_url: string | null;
  languages: string[] | null;
  rating_summary: { rating?: number; reviewCount?: number } | null;
  available_now: boolean | null;
  consultation_modes: string[] | null;
}

export interface ProviderScheduleInfo {
  // Formatted time chips ("2:40 PM") for the storefront's upcoming-slots grid.
  chips: string[];
  // Pre-formatted "Today, 2:40 PM" / "Tomorrow, 9:15 AM" / "Fri, Aug 21"
  // string for the earliest open schedule block, when the caller has real
  // provider_availability_slots data. Falls back to the available_now-based
  // copy below when omitted or there's nothing upcoming.
  nextAvailableAt?: string;
}

// Maps a real public.providers row onto the Provider shape DoctorCard/
// doctor-carousel-card already render, so those components need zero
// changes. Per-doctor pricing and photo uploads are out of scope this
// phase -- every doctor gets the one flat consultation price and falls back
// to DoctorCard's built-in tinted-initials avatar when photo_url is empty.
export function mapProviderRow(
  row: ProviderRow,
  basePrice: number,
  locale: Locale,
  schedule: ProviderScheduleInfo = { chips: [] }
): Provider {
  const languages = (row.languages ?? []).filter(
    (language): language is Locale => language === "en" || language === "sw"
  );

  // Chat has no real infrastructure anywhere in the codebase (no messages
  // table, no realtime UI) -- never advertise a mode that isn't bookable.
  const consultationModes = (row.consultation_modes ?? []).filter(
    (mode): mode is ConsultationMode => mode === "voice" || mode === "video"
  );

  return {
    id: row.id,
    name: row.full_name,
    specialty: row.specialty,
    credentials: row.credentials ?? "",
    rating: row.rating_summary?.rating ?? 0,
    reviewCount: row.rating_summary?.reviewCount ?? 0,
    languages: languages.length > 0 ? languages : ["en"],
    price: basePrice,
    consultationModes,
    nextAvailableAt: row.available_now
      ? t("doctor_available_now", locale)
      : (schedule.nextAvailableAt ?? t("doctor_check_back_later", locale)),
    isAvailableNow: Boolean(row.available_now),
    photoUrl: row.photo_url ?? "",
    bio: row.bio ?? "",
    // There's no separate patient-testimonial data source yet -- the
    // doctor's own bio is the only real first-person content available, so
    // it doubles as the card's pull-quote instead of leaving that space
    // blank for every real provider.
    quote: row.bio || undefined,
    timeSlots: schedule.chips.length > 0 ? schedule.chips : undefined,
  };
}
