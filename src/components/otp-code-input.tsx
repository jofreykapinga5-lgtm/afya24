"use client";

import { useRef, useState } from "react";

// Six single-digit boxes instead of one free-text field -- matches the
// standard SMS-code pattern (each digit gets its own slot, focus advances
// automatically). Still submits as one plain "code" field via the hidden
// input below, so the server action (verifyPatientOtp) needed no changes.
export function OtpCodeInput({ name, length = 6 }: { name: string; length?: number }) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, rawValue: string) {
    const clean = rawValue.replace(/\D/g, "");

    // Autofill (iOS/Android "use code from SMS") or a mid-field paste can
    // drop every digit into whichever box was focused, not just one -- treat
    // that the same as a paste and spread it across the remaining boxes.
    if (clean.length > 1) {
      setDigits((prev) => {
        const next = [...prev];
        for (let i = 0; i < clean.length && index + i < length; i++) {
          next[index + i] = clean[i];
        }
        return next;
      });
      inputsRef.current[Math.min(index + clean.length, length - 1)]?.focus();
      return;
    }

    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (clean && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    setDigits(() => {
      const next = Array(length).fill("");
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
      return next;
    });
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  const code = digits.join("");

  return (
    <div>
      <input type="hidden" name={name} value={code} required />
      <div className="flex justify-center gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={length}
            value={digit}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            aria-label={`Digit ${index + 1}`}
            className="h-14 w-11 rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] text-center text-2xl font-bold text-[#071923] outline-none focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20 sm:w-13"
          />
        ))}
      </div>
    </div>
  );
}
