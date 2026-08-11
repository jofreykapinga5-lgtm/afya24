"use client";

import { Hero } from "@/components/ui/animated-hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { HealthTips } from "@/components/home/health-tips";
import { DoctorsPreview } from "@/components/home/doctors-preview";
import { ServicesGrid } from "@/components/home/services-grid";
import { PharmacyPreview } from "@/components/home/pharmacy-preview";
import { LabsPreview } from "@/components/home/labs-preview";
import { TrustSection } from "@/components/home/trust-section";
import { ReturningPatient } from "@/components/home/returning-patient";
import { PatientReviews } from "@/components/home/patient-reviews";
import { EmailCapture } from "@/components/home/email-capture";
import { SiteFooter } from "@/components/home/site-footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <Hero />

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-12 sm:gap-16 sm:px-6 sm:py-16">
          <HowItWorks />
          <DoctorsPreview />
          <ServicesGrid />
          <PharmacyPreview />
          <TrustSection />
          <LabsPreview />
          <HealthTips />
          <ReturningPatient />
          <PatientReviews />
          <EmailCapture />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
