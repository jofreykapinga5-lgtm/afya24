"use client";

// A plain "tel" input reads as a generic web form field -- the +255/flag
// prefix is the one visual cue that this product is actually built for a
// Tanzanian patient typing their own local-format number ("0712345678"),
// not a raw international field. The prefix is display-only: the name=
// "phone" value submitted is still just what the patient types (local or
// E.164), same as before -- lib/phone.ts's normalizeTanzanianPhoneToE164
// does the real normalization server-side, this is purely a visual anchor.
//
// A real inline SVG, not the 🇹🇿 emoji -- Windows' default fonts don't
// carry regional-indicator flag glyphs, so that emoji renders as the plain
// letters "TZ" there instead of an actual flag, unlike macOS/iOS/Android.
// An SVG draws identically on every platform.
function TanzaniaFlag() {
  return (
    <svg
      viewBox="0 0 30 20"
      width="20"
      height="14"
      aria-hidden="true"
      className="shrink-0 rounded-[2px]"
    >
      <polygon points="0,0 30,0 0,20" fill="#1EB53A" />
      <polygon points="30,0 30,20 0,20" fill="#00A3DD" />
      <line x1="0" y1="20" x2="30" y2="0" stroke="#FCD116" strokeWidth="6.5" />
      <line x1="0" y1="20" x2="30" y2="0" stroke="#000000" strokeWidth="3.5" />
    </svg>
  );
}
export function TzPhoneInput({
  id,
  name,
  placeholder,
  defaultValue,
  className,
}: {
  id: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <div
      className={
        "flex h-13 w-full items-center rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] pl-3.5 pr-4 focus-within:border-[#01b7bb] focus-within:ring-3 focus-within:ring-[#01b7bb]/20 " +
        (className ?? "")
      }
    >
      <span className="flex shrink-0 items-center gap-1.5 border-r border-[#d8e5e3] pr-2.5 text-base text-[#071923]">
        <TanzaniaFlag />
        <span className="font-semibold">+255</span>
      </span>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder}
        pattern="(0|\+?255)?[0-9]{9}"
        defaultValue={defaultValue}
        required
        className="h-full w-full bg-transparent pl-2.5 text-base text-[#071923] outline-none placeholder:text-[#a8b4b8]"
      />
    </div>
  );
}
