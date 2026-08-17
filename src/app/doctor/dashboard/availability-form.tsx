"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateProviderAvailability, type AvailabilityActionState } from "../actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

const initialState: AvailabilityActionState = { status: "idle", message: "" };

export function DoctorAvailabilityForm({
  availableNow,
  availabilityNote,
  modes,
}: {
  availableNow: boolean;
  availabilityNote: string;
  modes: string[];
}) {
  const locale = useAppStore((state) => state.locale);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(updateProviderAvailability, initialState);
  const [online, setOnline] = useState(availableNow);

  // The switch flips optimistically on click (see onCheckedChange below) so
  // it never feels laggy. If the save actually fails, snap it back to the
  // last confirmed server state instead of leaving it showing a lie.
  // Deferred a tick so this isn't a direct synchronous setState-in-effect
  // (same pattern used for the pharmacy item dialog's close-on-success).
  useEffect(() => {
    if (state.status !== "error") return;
    const timeoutId = setTimeout(() => setOnline(availableNow), 0);
    return () => clearTimeout(timeoutId);
  }, [state, availableNow]);

  return (
    <form ref={formRef} action={formAction} className="mt-5 grid gap-4">
      <div
        className={`flex items-center justify-between gap-4 rounded-2xl p-4 ring-1 transition-colors ${
          online ? "bg-[#e8f7f4] ring-[#ccece7]" : "bg-[#f8fbfd] ring-[#dfe8eb]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`size-2.5 shrink-0 rounded-full ${online ? "bg-emerald-500" : "bg-[#a7b4bc]"}`}
            aria-hidden="true"
          />
          <span>
            <span className="block text-sm font-bold text-[#071923]">
              {online ? t("doctor_avail_visible_label", locale) : t("doctor_avail_offline_label", locale)}
            </span>
            <span className="text-xs text-[#64747c]">
              {t("doctor_avail_visible_body", locale)}
            </span>
          </span>
        </div>
        <Switch
          name="availableNow"
          checked={online}
          onCheckedChange={(checked) => {
            setOnline(checked);
            requestAnimationFrame(() => formRef.current?.requestSubmit());
          }}
          disabled={pending}
          aria-label={t("doctor_avail_aria_label", locale)}
        />
      </div>

      <fieldset className="rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb]">
        <legend className="px-1 text-sm font-bold text-[#071923]">{t("doctor_avail_modes_legend", locale)}</legend>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <ModeToggle icon={<Phone className="size-3.5" />} label={t("doctor_avail_mode_voice", locale)} name="voice" defaultChecked={modes.includes("voice")} />
          <ModeToggle icon={<Video className="size-3.5" />} label={t("doctor_avail_mode_video", locale)} name="video" defaultChecked={modes.includes("video")} />
        </div>
      </fieldset>

      <label className="grid gap-1.5 text-sm">
        <span className="font-bold text-[#071923]">{t("doctor_avail_note_label", locale)}</span>
        <Textarea
          name="availabilityNote"
          placeholder={t("doctor_avail_note_placeholder", locale)}
          defaultValue={availabilityNote}
          className="min-h-24 rounded-2xl border-[#d8e5e3] bg-[#f8fbfd]"
        />
      </label>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-[#01b7bb] px-5 font-bold text-white hover:bg-[#019ea2]"
        >
          {pending ? t("doctor_avail_saving", locale) : t("doctor_avail_save", locale)}
        </Button>
        {state.status === "success" ? (
          <span role="status" className="text-sm font-medium text-[#087a7b]">
            {state.message}
          </span>
        ) : state.status === "error" ? (
          <span role="alert" className="text-sm font-medium text-destructive">
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function ModeToggle({
  icon,
  label,
  name,
  defaultChecked,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
        checked
          ? "border-transparent bg-[#083273] text-white"
          : "border-[#d8e5e3] bg-white text-[#071923] hover:border-[#083273]/30"
      }`}
    >
      <input
        className="sr-only"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
        name="consultationModes"
        type="checkbox"
        value={name}
      />
      {icon}
      {label}
    </label>
  );
}
