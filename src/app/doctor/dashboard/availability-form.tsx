"use client";

import { useRef, type ReactNode } from "react";
import { Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateProviderAvailability } from "../actions";

export function DoctorAvailabilityForm({
  availableNow,
  availabilityNote,
  modes,
}: {
  availableNow: boolean;
  availabilityNote: string;
  modes: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateProviderAvailability} className="mt-5 grid gap-4">
      <label className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8fbfd] p-4 text-sm ring-1 ring-[#dfe8eb]">
        <span>
          <span className="block font-bold text-[#071923]">Available now</span>
          <span className="text-xs text-[#64747c]">
            Patients can be routed when slots and payment rules match.
          </span>
        </span>
        <input
          className="size-4 accent-[#01b7bb]"
          defaultChecked={availableNow}
          name="availableNow"
          type="checkbox"
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>

      <fieldset className="rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb]">
        <legend className="px-1 text-sm font-bold text-[#071923]">Consultation modes</legend>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <ModeCheckbox icon={<Phone className="size-4" />} label="Voice" name="voice" checked={modes.includes("voice")} />
          <ModeCheckbox icon={<Video className="size-4" />} label="Video" name="video" checked={modes.includes("video")} />
        </div>
      </fieldset>

      <label className="grid gap-1.5 text-sm">
        <span className="font-bold text-[#071923]">Availability note</span>
        <Textarea
          name="availabilityNote"
          placeholder="Example: Online from 2 PM, urgent care only today."
          defaultValue={availabilityNote}
          className="min-h-24 rounded-2xl border-[#d8e5e3] bg-[#f8fbfd]"
        />
      </label>

      <Button type="submit" className="h-11 justify-self-start rounded-full bg-[#01b7bb] px-5 font-bold text-white hover:bg-[#019ea2]">
        Save availability
      </Button>
    </form>
  );
}

function ModeCheckbox({
  icon,
  label,
  name,
  checked,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  checked: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-[#d8e5e3] bg-white px-3 py-1.5 text-[#071923]">
      <input
        className="size-4 accent-[#01b7bb]"
        defaultChecked={checked}
        name="consultationModes"
        type="checkbox"
        value={name}
      />
      {icon}
      {label}
    </label>
  );
}
