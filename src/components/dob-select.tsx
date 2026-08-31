"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const currentYear = new Date().getFullYear();
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const years = Array.from({ length: 121 }, (_, i) => currentYear - i);

function pad(value: string) {
  return value.padStart(2, "0");
}

export function DobSelect({ locale }: { locale: Locale }) {
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const combined = useMemo(() => {
    if (!day || !month || !year) return "";
    return `${year}-${pad(month)}-${pad(day)}`;
  }, [day, month, year]);

  return (
    <div className="grid grid-cols-3 gap-2">
      <input type="hidden" name="dateOfBirth" value={combined} required />
      <Select value={day} onValueChange={(value) => setDay(value ?? "")}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("lookup_dob_day", locale)} />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={String(d)}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={month} onValueChange={(value) => setMonth(value ?? "")}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("lookup_dob_month", locale)} />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m} value={String(m)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={(value) => setYear(value ?? "")}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("lookup_dob_year", locale)} />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
