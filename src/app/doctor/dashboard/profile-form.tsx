"use client";

import Image from "next/image";
import { ImageUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { updateDoctorPublicProfile } from "../actions";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export function DoctorProfileForm({
  bio,
  photoUrl,
  phone,
}: {
  bio: string;
  photoUrl: string;
  phone: string;
}) {
  const locale = useAppStore((state) => state.locale);
  return (
    <form action={updateDoctorPublicProfile} className="mt-5 grid gap-4">
      <div className="grid gap-3 rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb] sm:grid-cols-[96px_1fr] sm:items-center">
        <div className="relative size-24 overflow-hidden rounded-2xl bg-white ring-1 ring-[#dfe8eb]">
          {photoUrl ? (
            <Image src={photoUrl} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-[#01b7bb]">
              <ImageUp className="size-7" />
            </div>
          )}
        </div>
        <label className="grid gap-1.5 text-sm">
          <span className="font-bold text-[#071923]">{t("doctor_profile_image_label", locale)}</span>
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-[#60717a] file:mr-3 file:rounded-full file:border-0 file:bg-[#01b7bb] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
          />
          <span className="text-xs text-[#64747c]">{t("doctor_profile_image_hint", locale)}</span>
        </label>
      </div>

      <label className="grid gap-1.5 text-sm">
        <span className="font-bold text-[#071923]">{t("doctor_profile_phone_label", locale)}</span>
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={phone}
          placeholder="0712 345 678"
          className="rounded-xl border-[#d8e5e3] bg-[#f8fbfd]"
        />
        <span className="text-xs text-[#64747c]">
          {t("doctor_profile_phone_hint", locale)}
        </span>
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-bold text-[#071923]">{t("doctor_profile_bio_label", locale)}</span>
        <Textarea
          name="bio"
          defaultValue={bio}
          placeholder={t("doctor_profile_bio_placeholder", locale)}
          className="min-h-28 rounded-2xl border-[#d8e5e3] bg-[#f8fbfd]"
        />
      </label>

      <SubmitButton
        pendingText={t("common_please_wait", locale)}
        className="h-11 justify-self-start rounded-full bg-[#01b7bb] px-5 font-bold text-white hover:bg-[#019ea2]"
      >
        {t("doctor_profile_save", locale)}
      </SubmitButton>
    </form>
  );
}
