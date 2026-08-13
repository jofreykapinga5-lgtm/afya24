"use client";

import { useMemo, useState } from "react";
import { Clock, LocateFixed, Lock, MapPin, MessageCircle, Navigation } from "lucide-react";
import { labLocations, labOrders } from "@/lib/mock-data";
import { distanceKm } from "@/lib/geo";
import { SectionHeading } from "@/components/home/section-heading";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

const commonTests: Record<string, string[]> = {
  "lab-nairobi-central": ["Full blood count", "Malaria test", "Liver function panel"],
  "lab-westlands": ["Full blood count", "Rapid strep test", "Pregnancy test"],
  "lab-kilimani": ["Full blood count", "Diabetes panel", "Cholesterol test"],
  "lab-karen": ["Full blood count", "Thyroid panel", "Vitamin D test"],
  "lab-eastleigh": ["Full blood count", "Malaria test", "Typhoid test"],
};

const NEAREST_COUNT = 3;

type LocateState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ready"; lat: number; lng: number }
  | { status: "error"; message: string };

export function LabsPreview() {
  const locale = useAppStore((state) => state.locale);
  const [locate, setLocate] = useState<LocateState>({ status: "idle" });

  function findNearMe() {
    if (!("geolocation" in navigator)) {
      setLocate({ status: "error", message: t("labs_geo_unavailable", locale) });
      return;
    }
    setLocate({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setLocate({
          status: "ready",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () =>
        setLocate({
          status: "error",
          message: t("labs_geo_error", locale),
        }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  const nearestLabs = useMemo(() => {
    if (locate.status !== "ready") return [];
    return labLocations
      .map((lab) => ({
        lab,
        distance: distanceKm(locate.lat, locate.lng, lab.latitude, lab.longitude),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, NEAREST_COUNT);
  }, [locate]);

  return (
    <section id="labs" className="scroll-mt-20">
      <div className="rounded-[1.75rem] bg-[#f7faf9] px-5 py-6 ring-1 ring-[#e0e9e7] sm:px-7 lg:px-9">
        <div className="mx-auto grid max-w-5xl gap-6">
          <div className="mx-auto w-full max-w-xl">
            <SectionHeading
              eyebrow={t("labs_title", locale)}
              body={t("labs_find_closest_body", locale).replace("{n}", String(NEAREST_COUNT))}
            >
              <span className="text-[#01b7bb]">{t("labs_find_closest_title", locale)}</span>
            </SectionHeading>

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={findNearMe}
                disabled={locate.status === "locating"}
                className="inline-flex min-h-11 w-full max-w-[18rem] items-center justify-center gap-2.5 rounded-full bg-primary px-5 text-sm font-bold text-white outline-none transition-all hover:-translate-y-0.5 hover:bg-[#062960] focus-visible:ring-3 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <LocateFixed className="size-4" />
                {locate.status === "locating"
                  ? t("labs_finding_you", locale)
                  : locate.status === "ready"
                    ? t("labs_search_again", locale)
                    : t("labs_find_near_me", locale)}
              </button>
            </div>

            {locate.status === "error" ? (
              <p className="mt-4 rounded-xl bg-urgent-soft px-4 py-3 text-sm font-medium text-urgent">
                {locate.message}
              </p>
            ) : (
              <p className="mx-auto mt-4 flex max-w-[34ch] items-start justify-center gap-2 text-left text-xs leading-5 text-[#60717a]">
                <Lock className="mt-0.5 size-3.5 shrink-0" />
                {t("labs_privacy_note", locale)}
              </p>
            )}
          </div>

          {locate.status === "ready" ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {nearestLabs.map(({ lab, distance }) => {
                const relatedOrder = labOrders.find((order) => order.labLocationId === lab.id);

                return (
                  <article
                    key={lab.id}
                    className="rounded-2xl bg-white p-4 ring-1 ring-[#dfe8eb]"
                  >
                    <div className="flex flex-col gap-3 sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#173846]">{lab.name}</p>
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-[#667079]">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand-teal" />
                          {lab.address}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#667079]">
                          <Clock className="size-3.5 shrink-0 text-brand-teal" />
                          {lab.openingHours}
                        </p>
                      </div>
                      <span className="w-fit shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">
                        {distance < 1
                          ? `${Math.round(distance * 1000)} ${t("labs_away_meters", locale)}`
                          : `${distance.toFixed(1)} ${t("labs_away_km", locale)}`}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(commonTests[lab.id] ?? []).slice(0, 3).map((test) => (
                        <span
                          key={test}
                          className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary"
                        >
                          {test}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      {relatedOrder ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#075b63]">
                          <MessageCircle className="size-3.5" />
                          {t("labs_sent_whatsapp", locale)}
                        </span>
                      ) : (
                        <span className="line-clamp-2 text-xs leading-5 text-[#68727a]">
                          {t("labs_body", locale)}
                        </span>
                      )}
                      <a
                        href={lab.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-teal px-3 py-1.5 text-xs font-bold text-white outline-none transition-colors hover:bg-brand-teal/85 focus-visible:ring-3 focus-visible:ring-brand-teal/40"
                      >
                        <Navigation className="size-3.5" />
                        {t("labs_open_maps", locale)}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
