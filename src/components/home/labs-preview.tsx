"use client";

import { useMemo, useState } from "react";
import { Clock, LocateFixed, Lock, MapPin, Navigation, Phone } from "lucide-react";
import { distanceKm } from "@/lib/geo";
import { SectionHeading } from "@/components/home/section-heading";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { LabLocationStatus } from "@/lib/types";

const NEAREST_COUNT = 3;

export type PublicLabLocation = {
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
};

type LocateState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ready"; lat: number; lng: number }
  | { status: "error"; message: string };

function directionsUrl(originLat: number, originLng: number, lab: PublicLabLocation) {
  const params = new URLSearchParams({
    api: "1",
    origin: `${originLat},${originLng}`,
    destination: `${lab.latitude},${lab.longitude}`,
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function LabsPreview({ labs }: { labs: PublicLabLocation[] }) {
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
    return labs
      .filter((lab) => lab.status === "active")
      .map((lab) => ({
        lab,
        distance: distanceKm(locate.lat, locate.lng, lab.latitude, lab.longitude),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, NEAREST_COUNT);
  }, [labs, locate]);

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
            nearestLabs.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {nearestLabs.map(({ lab, distance }) => (
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
                        {lab.phone ? (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#667079]">
                            <Phone className="size-3.5 shrink-0 text-brand-teal" />
                            {lab.phone}
                          </p>
                        ) : null}
                      </div>
                      <span className="w-fit shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">
                        {distance < 1
                          ? `${Math.round(distance * 1000)} ${t("labs_away_meters", locale)}`
                          : `${distance.toFixed(1)} ${t("labs_away_km", locale)}`}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="line-clamp-2 text-xs leading-5 text-[#68727a]">
                        {lab.region}
                      </span>
                      <a
                        href={directionsUrl(locate.lat, locate.lng, lab)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-teal px-3 py-1.5 text-xs font-bold text-white outline-none transition-colors hover:bg-brand-teal/85 focus-visible:ring-3 focus-visible:ring-brand-teal/40"
                      >
                        <Navigation className="size-3.5" />
                        {t("labs_open_maps", locale)}
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mx-auto max-w-md rounded-2xl bg-white px-4 py-3 text-center text-sm text-muted-foreground ring-1 ring-[#dfe8eb]">
                {t("home_no_labs_configured", locale)}
              </p>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}
