import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConsultationMode, Locale, QualificationResult } from "./types";

interface BookingSelection {
  serviceId: string | null;
  providerId: string | null;
  consultationMode: ConsultationMode | null;
}

export interface PharmacyCartLine {
  itemId: string;
  quantity: number;
}

interface AppState {
  locale: Locale;
  setLocale: (locale: Locale) => void;

  patientReference: string | null;
  setPatientReference: (reference: string | null) => void;

  qualificationComplaint: string;
  setQualificationComplaint: (complaint: string) => void;

  qualificationResult: QualificationResult | null;
  setQualificationResult: (result: QualificationResult | null) => void;

  booking: BookingSelection;
  setBookingSelection: (selection: Partial<BookingSelection>) => void;
  resetBooking: () => void;

  pharmacyCart: PharmacyCartLine[];
  addToPharmacyCart: (itemId: string) => void;
  removeFromPharmacyCart: (itemId: string) => void;
  setPharmacyCartQuantity: (itemId: string, quantity: number) => void;
  clearPharmacyCart: () => void;

  // The doctor dashboard's embedded call panel (src/app/doctor/dashboard/
  // call-panel.tsx) reads this to know which appointment to join -- lives
  // here rather than local component state because the "join call" click
  // happens in DoctorVideoQueue while the panel itself renders in a
  // separate part of the (server-rendered) dashboard tree.
  activeDoctorCall: {
    appointmentId: string;
    patientId: string;
    patientName: string;
    doctorNotes: string;
  } | null;
  setActiveDoctorCall: (
    call: { appointmentId: string; patientId: string; patientName: string; doctorNotes: string } | null
  ) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: "sw",
      setLocale: (locale) => set({ locale }),

      patientReference: null,
      setPatientReference: (reference) => set({ patientReference: reference }),

      qualificationComplaint: "",
      setQualificationComplaint: (complaint) => set({ qualificationComplaint: complaint }),

      qualificationResult: null,
      setQualificationResult: (result) => set({ qualificationResult: result }),

      booking: { serviceId: null, providerId: null, consultationMode: null },
      setBookingSelection: (selection) =>
        set((state) => ({ booking: { ...state.booking, ...selection } })),
      resetBooking: () =>
        set({ booking: { serviceId: null, providerId: null, consultationMode: null } }),

      pharmacyCart: [],
      addToPharmacyCart: (itemId) =>
        set((state) => {
          const existing = state.pharmacyCart.find((line) => line.itemId === itemId);
          if (existing) {
            return {
              pharmacyCart: state.pharmacyCart.map((line) =>
                line.itemId === itemId ? { ...line, quantity: line.quantity + 1 } : line
              ),
            };
          }
          return { pharmacyCart: [...state.pharmacyCart, { itemId, quantity: 1 }] };
        }),
      removeFromPharmacyCart: (itemId) =>
        set((state) => ({
          pharmacyCart: state.pharmacyCart.filter((line) => line.itemId !== itemId),
        })),
      setPharmacyCartQuantity: (itemId, quantity) =>
        set((state) => ({
          pharmacyCart:
            quantity <= 0
              ? state.pharmacyCart.filter((line) => line.itemId !== itemId)
              : state.pharmacyCart.map((line) =>
                  line.itemId === itemId ? { ...line, quantity } : line
                ),
        })),
      clearPharmacyCart: () => set({ pharmacyCart: [] }),

      activeDoctorCall: null,
      setActiveDoctorCall: (call) => set({ activeDoctorCall: call }),
    }),
    {
      name: "afya24-preferences",
      // Only the language preference survives a reload/new tab -- booking
      // selection, cart, and the in-flight AI complaint are meant to be
      // session-only.
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
