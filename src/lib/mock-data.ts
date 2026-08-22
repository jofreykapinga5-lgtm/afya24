// Static product copy for the homepage services grid, not fake data --
// these category descriptions pre-fill the AI qualification chat's
// starting complaint (see components/home/services-grid.tsx). Everything
// else that used to live in this file (providers, appointments, payments,
// audit logs, lab orders, checkouts, patient files) has been replaced by
// real Supabase-backed data throughout the app and deleted as dead code.

import type { ServiceCategory } from "./types";

export const serviceCategories: ServiceCategory[] = [
  {
    id: "cat-general",
    name: "General doctor",
    description: "Talk to a general practitioner about any everyday health concern.",
    icon: "stethoscope",
    popularServices: ["svc-general-consult", "svc-followup"],
  },
  {
    id: "cat-urgent",
    name: "Urgent care",
    description: "Same-day care for issues that need attention soon but aren't emergencies.",
    icon: "alarm-clock",
    popularServices: ["svc-urgent-consult"],
  },
  {
    id: "cat-mental-health",
    name: "Mental health",
    description: "Support for anxiety, depression, stress, and sleep issues.",
    icon: "brain",
    popularServices: ["svc-mental-health-consult"],
  },
  {
    id: "cat-dermatology",
    name: "Dermatology",
    description: "Skin, hair, and nail concerns reviewed by a doctor.",
    icon: "scan-face",
    popularServices: ["svc-derm-consult"],
  },
  {
    id: "cat-sexual-health",
    name: "Sexual health",
    description: "Confidential care for sexual and reproductive health concerns.",
    icon: "heart-pulse",
    popularServices: ["svc-sexual-health-consult"],
  },
  {
    id: "cat-prescription",
    name: "Prescription refill",
    description: "Renew an existing prescription without an in-person visit.",
    icon: "pill",
    popularServices: ["svc-refill-consult"],
  },
  {
    id: "cat-lab",
    name: "Lab tests",
    description: "Get a doctor's referral for lab tests at a nearby partner lab.",
    icon: "flask-conical",
    popularServices: ["svc-lab-referral"],
  },
  {
    id: "cat-womens-health",
    name: "Women's health",
    description: "Care for menstrual, reproductive, and general women's health concerns.",
    icon: "heart-pulse",
    popularServices: ["svc-womens-health-consult"],
  },
  {
    id: "cat-pediatrics",
    name: "Pediatrics",
    description: "Care for your child from a doctor experienced in pediatric health.",
    icon: "baby",
    popularServices: ["svc-pediatric-consult"],
  },
  {
    id: "cat-chronic",
    name: "Chronic condition follow-up",
    description: "Ongoing check-ins for diabetes, hypertension, asthma, and similar conditions.",
    icon: "repeat",
    popularServices: ["svc-chronic-followup"],
  },
];
